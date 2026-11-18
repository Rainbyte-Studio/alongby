import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ClientProfile,
  ClientProfileInput,
  ProfessionalProfile,
  ProfessionalProfileInput,
  VerificationStatus,
} from '../types';
import { removeUndefinedFields } from './firestoreUtils';
import { auditService } from './auditService';

export const profileService = {
  /**
   * Save Client Onboarding profile and complete onboarding status
   */
  async saveClientProfile(
    userId: string,
    data: Omit<ClientProfile, 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ClientProfile> {
    const nowIso = new Date().toISOString();
    const clientRef = doc(db, 'clientProfiles', userId);
    const userRef = doc(db, 'users', userId);

    const profile: ClientProfile = {
      userId,
      fullName: data.fullName,
      country: data.country,
      timezone: data.timezone,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Include optional fields only if defined and non-empty
    if (data.companyName && data.companyName.trim()) {
      profile.companyName = data.companyName.trim();
    }
    if (data.companyWebsite && data.companyWebsite.trim()) {
      profile.companyWebsite = data.companyWebsite.trim();
    }
    if (data.profileImageUrl && data.profileImageUrl.trim()) {
      profile.profileImageUrl = data.profileImageUrl.trim();
    }

    const sanitizedClientData = removeUndefinedFields({
      ...profile,
      updatedAtServer: serverTimestamp(),
    });

    await setDoc(clientRef, sanitizedClientData, { merge: true });

    // Mark onboarding completed on the base user record
    const sanitizedUserData = removeUndefinedFields({
      displayName: data.fullName,
      onboardingStatus: 'completed',
      updatedAt: nowIso,
      updatedAtServer: serverTimestamp(),
    });

    await updateDoc(userRef, sanitizedUserData);

    return profile;
  },

  /**
   * Retrieve client profile
   */
  async getClientProfile(userId: string): Promise<ClientProfile | null> {
    const snap = await getDoc(doc(db, 'clientProfiles', userId));
    if (!snap.exists()) return null;
    return snap.data() as ClientProfile;
  },

  /**
   * Authoritative client profile update with explicit allowlist validation.
   * Modifies ONLY user-editable fields; synchronizes displayName to the user record.
   */
  async updateClientProfile(
    userId: string,
    data: Partial<ClientProfileInput>
  ): Promise<ClientProfile> {
    if (!userId) throw new Error('User ID is required.');
    const clientRef = doc(db, 'clientProfiles', userId);
    const userRef = doc(db, 'users', userId);

    const existingSnap = await getDoc(clientRef);
    const existing = existingSnap.exists() ? (existingSnap.data() as ClientProfile) : null;
    const nowIso = new Date().toISOString();

    const fullName = (data.fullName !== undefined ? data.fullName : existing?.fullName || '').trim();
    if (!fullName) {
      throw new Error('Full name is required.');
    }

    const country = (data.country !== undefined ? data.country : existing?.country || 'United Kingdom').trim();
    const timezone = (data.timezone !== undefined ? data.timezone : existing?.timezone || 'UTC').trim();

    // Explicit allowlist construction
    const updatedProfile: ClientProfile = {
      userId,
      fullName,
      country,
      timezone,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    if (data.companyName !== undefined) {
      if (data.companyName.trim()) {
        updatedProfile.companyName = data.companyName.trim();
      }
    } else if (existing?.companyName) {
      updatedProfile.companyName = existing.companyName;
    }

    if (data.companyWebsite !== undefined) {
      if (data.companyWebsite.trim()) {
        updatedProfile.companyWebsite = data.companyWebsite.trim();
      }
    } else if (existing?.companyWebsite) {
      updatedProfile.companyWebsite = existing.companyWebsite;
    }

    if (data.phone !== undefined) {
      if (data.phone.trim()) {
        updatedProfile.phone = data.phone.trim();
      }
    } else if (existing?.phone) {
      updatedProfile.phone = existing.phone;
    }

    if (data.billingEmail !== undefined) {
      if (data.billingEmail.trim()) {
        updatedProfile.billingEmail = data.billingEmail.trim();
      }
    } else if (existing?.billingEmail) {
      updatedProfile.billingEmail = existing.billingEmail;
    }

    if (data.profileImageUrl !== undefined) {
      if (data.profileImageUrl.trim()) {
        updatedProfile.profileImageUrl = data.profileImageUrl.trim();
      }
    } else if (existing?.profileImageUrl) {
      updatedProfile.profileImageUrl = existing.profileImageUrl;
    }

    const sanitizedClientPayload = removeUndefinedFields({
      ...updatedProfile,
      updatedAtServer: serverTimestamp(),
    });

    await setDoc(clientRef, sanitizedClientPayload, { merge: true });

    // Synchronize displayName to base user account
    try {
      await updateDoc(
        userRef,
        removeUndefinedFields({
          displayName: fullName,
          updatedAt: nowIso,
          updatedAtServer: serverTimestamp(),
        })
      );
    } catch (syncErr) {
      console.warn('User displayName sync warning:', syncErr);
    }

    // Append-only audit record
    try {
      await auditService.logEvent(
        userId,
        'client',
        'CLIENT_PROFILE_UPDATED',
        'clientProfile',
        userId,
        {
          hasCompany: Boolean(updatedProfile.companyName),
          country: updatedProfile.country,
        }
      );
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    return updatedProfile;
  },

  /**
   * Save Professional Onboarding profile and mark onboarding completed.
   *
   * Separation of Concerns:
   * - User-editable fields are passed via `data: ProfessionalProfileInput`.
   * - System-managed fields (averageRating, completedProjectCount, verificationStatus)
   *   are managed by platform workflows, never blindly accepted from the client onboarding form.
   * - If the professional has no ratings yet, `averageRating` is completely omitted from the
   *   document (never stored as `undefined`).
   * - All payloads are sanitized with `removeUndefinedFields` before Firestore persistence.
   */
  async saveProfessionalProfile(
    userId: string,
    data: ProfessionalProfileInput
  ): Promise<ProfessionalProfile> {
    const nowIso = new Date().toISOString();
    const profRef = doc(db, 'professionalProfiles', userId);
    const userRef = doc(db, 'users', userId);

    // Existing profile check for preserving verification status and historical data
    const existingSnap = await getDoc(profRef);
    const existingData = existingSnap.exists() ? (existingSnap.data() as ProfessionalProfile) : null;

    const profile: ProfessionalProfile = {
      userId,
      displayName: data.displayName,
      professionalTitle: data.professionalTitle,
      shortBio: data.shortBio,
      country: data.country,
      timezone: data.timezone,
      languages: data.languages || ['English'],
      primaryServices: data.primaryServices || [],
      skills: data.skills || [],
      yearsOfExperience: data.yearsOfExperience,
      minimumBudgetMinor: data.minimumBudgetMinor,
      currency: data.currency || 'EUR',
      verificationStatus: existingData?.verificationStatus || 'submitted',
      completedProjectCount: existingData?.completedProjectCount ?? 0,
      createdAt: existingData?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    // System-managed: averageRating is derived exclusively from real reviews.
    // Omit averageRating entirely if the professional has no ratings yet.
    if (typeof existingData?.averageRating === 'number') {
      profile.averageRating = existingData.averageRating;
    }

    // Optional fields: preserve or include only if defined, never write undefined
    if (data.industries && data.industries.length > 0) {
      profile.industries = data.industries;
    } else if (existingData?.industries && existingData.industries.length > 0) {
      profile.industries = existingData.industries;
    }

    if (data.preferredProjectTypes && data.preferredProjectTypes.length > 0) {
      profile.preferredProjectTypes = data.preferredProjectTypes;
    } else if (existingData?.preferredProjectTypes && existingData.preferredProjectTypes.length > 0) {
      profile.preferredProjectTypes = existingData.preferredProjectTypes;
    }

    if (data.portfolioItems && data.portfolioItems.length > 0) {
      profile.portfolioItems = data.portfolioItems;
    } else if (existingData?.portfolioItems && existingData.portfolioItems.length > 0) {
      profile.portfolioItems = existingData.portfolioItems;
    }

    // Sanitize before Firestore persistence to ensure zero undefined fields
    const sanitizedPayload = removeUndefinedFields({
      ...profile,
      updatedAtServer: serverTimestamp(),
    });

    await setDoc(profRef, sanitizedPayload, { merge: true });

    // Mark onboarding completed on user record
    const sanitizedUserUpdate = removeUndefinedFields({
      displayName: data.displayName,
      onboardingStatus: 'completed',
      updatedAt: nowIso,
      updatedAtServer: serverTimestamp(),
    });

    await updateDoc(userRef, sanitizedUserUpdate);

    return profile;
  },

  /**
   * Retrieve professional profile
   */
  async getProfessionalProfile(userId: string): Promise<ProfessionalProfile | null> {
    const snap = await getDoc(doc(db, 'professionalProfiles', userId));
    if (!snap.exists()) return null;
    return snap.data() as ProfessionalProfile;
  },

  /**
   * Authoritative professional profile update with strict allowlist validation.
   * Protects governance fields (verificationStatus, completedProjectCount, averageRating, createdAt)
   * while persisting user-editable practitioner fields for identity and future matching eligibility.
   */
  async updateProfessionalProfile(
    userId: string,
    data: Partial<ProfessionalProfileInput>
  ): Promise<ProfessionalProfile> {
    if (!userId) throw new Error('User ID is required.');
    const profRef = doc(db, 'professionalProfiles', userId);
    const userRef = doc(db, 'users', userId);

    const existingSnap = await getDoc(profRef);
    const existingData = existingSnap.exists() ? (existingSnap.data() as ProfessionalProfile) : null;
    const nowIso = new Date().toISOString();

    const displayName = (data.displayName !== undefined ? data.displayName : existingData?.displayName || '').trim();
    if (!displayName) {
      throw new Error('Display name is required.');
    }

    const professionalTitle = (data.professionalTitle !== undefined ? data.professionalTitle : existingData?.professionalTitle || '').trim();
    if (!professionalTitle) {
      throw new Error('Professional title is required.');
    }

    const shortBio = (data.shortBio !== undefined ? data.shortBio : existingData?.shortBio || '').trim();
    if (!shortBio) {
      throw new Error('Professional bio is required.');
    }

    const country = (data.country !== undefined ? data.country : existingData?.country || 'United Kingdom').trim();
    const timezone = (data.timezone !== undefined ? data.timezone : existingData?.timezone || 'UTC').trim();

    // Explicit allowlist construction
    const updatedProfile: ProfessionalProfile = {
      userId,
      displayName,
      professionalTitle,
      shortBio,
      country,
      timezone,
      languages: data.languages && data.languages.length > 0 ? data.languages : (existingData?.languages || ['English']),
      primaryServices: data.primaryServices && data.primaryServices.length > 0 ? data.primaryServices : (existingData?.primaryServices || []),
      skills: data.skills !== undefined ? data.skills : (existingData?.skills || []),
      yearsOfExperience: typeof data.yearsOfExperience === 'number' ? Math.max(0, data.yearsOfExperience) : (existingData?.yearsOfExperience || 1),
      minimumBudgetMinor: typeof data.minimumBudgetMinor === 'number' ? Math.max(0, Math.round(data.minimumBudgetMinor)) : (existingData?.minimumBudgetMinor || 0),
      currency: data.currency || existingData?.currency || 'EUR',
      // Strictly preserved governance fields — immune to user tampering
      verificationStatus: existingData?.verificationStatus || 'submitted',
      completedProjectCount: existingData?.completedProjectCount ?? 0,
      createdAt: existingData?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    if (typeof existingData?.averageRating === 'number') {
      updatedProfile.averageRating = existingData.averageRating;
    }

    if (data.website !== undefined) {
      if (data.website.trim()) {
        updatedProfile.website = data.website.trim();
      }
    } else if (existingData?.website) {
      updatedProfile.website = existingData.website;
    }

    if (data.industries && data.industries.length > 0) {
      updatedProfile.industries = data.industries;
    } else if (existingData?.industries && existingData.industries.length > 0) {
      updatedProfile.industries = existingData.industries;
    }

    if (data.preferredProjectTypes && data.preferredProjectTypes.length > 0) {
      updatedProfile.preferredProjectTypes = data.preferredProjectTypes;
    } else if (existingData?.preferredProjectTypes && existingData.preferredProjectTypes.length > 0) {
      updatedProfile.preferredProjectTypes = existingData.preferredProjectTypes;
    }

    if (data.portfolioItems !== undefined) {
      updatedProfile.portfolioItems = data.portfolioItems;
    } else if (existingData?.portfolioItems) {
      updatedProfile.portfolioItems = existingData.portfolioItems;
    }

    const sanitizedPayload = removeUndefinedFields({
      ...updatedProfile,
      updatedAtServer: serverTimestamp(),
    });

    await setDoc(profRef, sanitizedPayload, { merge: true });

    // Synchronize displayName to base user account
    try {
      await updateDoc(
        userRef,
        removeUndefinedFields({
          displayName,
          updatedAt: nowIso,
          updatedAtServer: serverTimestamp(),
        })
      );
    } catch (syncErr) {
      console.warn('User displayName sync warning:', syncErr);
    }

    // Append-only audit record
    try {
      await auditService.logEvent(
        userId,
        'professional',
        'PROFESSIONAL_PROFILE_UPDATED',
        'professionalProfile',
        userId,
        {
          servicesCount: updatedProfile.primaryServices.length,
          skillsCount: updatedProfile.skills.length,
          yearsOfExperience: updatedProfile.yearsOfExperience,
          hasWebsite: Boolean(updatedProfile.website),
          portfolioCount: updatedProfile.portfolioItems?.length || 0,
        }
      );
    } catch (auditErr) {
      console.warn('Audit log warning:', auditErr);
    }

    return updatedProfile;
  },

  /**
   * Admin: List all professional profiles for review and verification
   */
  async getAllProfessionals(): Promise<ProfessionalProfile[]> {
    const snap = await getDocs(collection(db, 'professionalProfiles'));
    const list: ProfessionalProfile[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ProfessionalProfile);
    });
    return list;
  },

  /**
   * Admin: Update verification status for a professional
   */
  async updateVerificationStatus(
    userId: string,
    status: VerificationStatus
  ): Promise<void> {
    const profRef = doc(db, 'professionalProfiles', userId);
    const sanitizedUpdate = removeUndefinedFields({
      verificationStatus: status,
      updatedAt: new Date().toISOString(),
      updatedAtServer: serverTimestamp(),
    });
    await updateDoc(profRef, sanitizedUpdate);
  },
};
