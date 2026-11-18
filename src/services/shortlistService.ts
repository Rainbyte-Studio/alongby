import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Project,
  ProjectMatch,
  Opportunity,
  Quote,
  ProfessionalProfile,
  ProfessionalAvailability,
  UserProfile,
  InternalShortlist,
  PublishedShortlist,
  ShortlistCandidateSnapshot,
  ProfessionalSelection,
  ShortlistEligibilityResult,
} from '../types';
import { projectService } from './projectService';
import { matchingService } from './matchingService';
import { opportunityService } from './opportunityService';
import { quoteService } from './quoteService';
import { profileService } from './profileService';
import { availabilityService } from './availabilityService';
import { shortlistEligibilityService } from './shortlistEligibilityService';
import { matchExplanationService } from './matchExplanationService';
import { notificationService } from './notificationService';
import { auditService } from './auditService';
import { removeUndefinedFields } from './firestoreUtils';

export const SHORTLIST_CONFIG = {
  targetSize: 3,
  minimumSize: 2,
  maxSize: 3,
};

export interface EvaluatedCandidateRecord {
  match: ProjectMatch;
  opportunity: Opportunity;
  quote?: Quote;
  professional: ProfessionalProfile;
  availability: ProfessionalAvailability | null;
  userAccount?: UserProfile | null;
  eligibility: ShortlistEligibilityResult;
}

export const shortlistService = {
  /**
   * Fetch all candidate responses and evaluate their shortlist eligibility
   */
  async getEligibleCandidatesForShortlist(projectId: string): Promise<EvaluatedCandidateRecord[]> {
    const project = await projectService.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    const [matches, opportunities, quotes] = await Promise.all([
      matchingService.getMatchesForProject(projectId),
      opportunityService.getOpportunitiesForProject(projectId),
      quoteService.getQuotesForProject(projectId),
    ]);

    // Opportunities map by matchId / professionalId
    const oppMap = new Map<string, Opportunity>();
    opportunities.forEach((opp) => {
      oppMap.set(opp.matchId, opp);
      oppMap.set(opp.professionalId, opp);
    });

    // Quotes map by opportunityId / professionalId
    const quoteMap = new Map<string, Quote>();
    quotes.forEach((q) => {
      quoteMap.set(q.opportunityId, q);
      quoteMap.set(q.professionalId, q);
    });

    const results: EvaluatedCandidateRecord[] = [];

    for (const match of matches) {
      if (match.status === 'admin_removed') continue;

      const opp = oppMap.get(match.id) || oppMap.get(match.professionalId);
      if (!opp) continue; // Opportunity was never dispatched

      const quote = quoteMap.get(opp.id) || quoteMap.get(match.professionalId);

      // Fetch professional profile & availability
      const [prof, avail] = await Promise.all([
        profileService.getProfessionalProfile(match.professionalId),
        availabilityService.getAvailability(match.professionalId),
      ]);

      if (!prof) continue;

      // Fetch base user record for account status
      let userAccount: UserProfile | null = null;
      try {
        const userSnap = await getDoc(doc(db, 'users', match.professionalId));
        if (userSnap.exists()) {
          userAccount = userSnap.data() as UserProfile;
        }
      } catch (err) {
        console.warn('Could not fetch user record for candidate:', err);
      }

      const eligibility = shortlistEligibilityService.evaluateEligibility({
        project,
        candidate: match,
        opportunity: opp,
        quote: quote || null,
        professional: prof,
        availability: avail,
        userAccount,
      });

      results.push({
        match,
        opportunity: opp,
        quote,
        professional: prof,
        availability: avail,
        userAccount,
        eligibility,
      });
    }

    // Sort: Eligible first, then by match score descending
    results.sort((a, b) => {
      if (a.eligibility.eligible && !b.eligibility.eligible) return -1;
      if (!a.eligibility.eligible && b.eligibility.eligible) return 1;
      return (b.match.matchScore || 0) - (a.match.matchScore || 0);
    });

    return results;
  },

  /**
   * Get draft or published internal shortlist for a project
   */
  async getInternalShortlist(projectId: string): Promise<InternalShortlist | null> {
    try {
      const q = query(
        collection(db, 'projects', projectId, 'shortlists'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as InternalShortlist;
    } catch (err) {
      console.warn('Fallback getting shortlists without index:', err);
      const snap = await getDocs(collection(db, 'projects', projectId, 'shortlists'));
      if (snap.empty) return null;
      const list = snap.docs.map((d) => d.data() as InternalShortlist);
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
    }
  },

  /**
   * Save internal shortlist draft (Admin only)
   */
  async saveDraftShortlist(
    projectId: string,
    candidateIds: string[],
    actorId: string,
    options: {
      adminNotes?: string;
      recommendedProfId?: string;
      recommendationRationale?: string;
      overrideApplied?: boolean;
      overrideReason?: string;
    } = {}
  ): Promise<InternalShortlist> {
    const project = await projectService.getProject(projectId);
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const existing = await this.getInternalShortlist(projectId);
    const shortlistId = existing ? existing.id : doc(collection(db, 'projects', projectId, 'shortlists')).id;
    const nowIso = new Date().toISOString();

    const matches = await matchingService.getMatchesForProject(projectId);
    const opps = await opportunityService.getOpportunitiesForProject(projectId);
    const quotes = await quoteService.getQuotesForProject(projectId);

    const items = candidateIds.map((profId, idx) => {
      const m = matches.find((match) => match.professionalId === profId);
      const o = opps.find((opp) => opp.professionalId === profId);
      const q = quotes.find((quote) => quote.professionalId === profId);

      return {
        professionalId: profId,
        matchId: m?.id || '',
        opportunityId: o?.id || '',
        quoteId: q?.id || '',
        matchScore: m?.matchScore || 0,
        scoreBreakdown: m?.scoreBreakdown || {
          serviceAndSkills: 0,
          relevantExperience: 0,
          availability: 0,
          budgetFit: 0,
          ratingReliability: 0,
          workload: 0,
          total: 0,
        },
        internalMatchReasons: m?.matchReasons || [],
        isRecommended: profId === options.recommendedProfId,
        recommendationRationale: profId === options.recommendedProfId ? options.recommendationRationale : undefined,
        orderIndex: idx,
      };
    });

    const internalShortlist: InternalShortlist = {
      id: shortlistId,
      projectId,
      clientId: project.clientId,
      status: existing?.status === 'published' ? 'published' : 'draft',
      candidateIds,
      items,
      adminNotes: options.adminNotes ?? existing?.adminNotes ?? '',
      overrideApplied: options.overrideApplied ?? existing?.overrideApplied ?? false,
      overrideReason: options.overrideReason ?? existing?.overrideReason ?? '',
      version: (existing?.version || 0) + 1,
      createdBy: existing?.createdBy || actorId,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      publishedAt: existing?.publishedAt,
      selectedProfessionalId: existing?.selectedProfessionalId,
      selectedAt: existing?.selectedAt,
    };

    const docRef = doc(db, 'projects', projectId, 'shortlists', shortlistId);
    await setDoc(docRef, removeUndefinedFields(internalShortlist));

    return internalShortlist;
  },

  /**
   * Publish curated shortlist to the client
   * Transitions project to 'shortlist_ready' and snapshots client-safe data
   */
  async publishShortlist(
    projectId: string,
    shortlistId: string,
    actorId: string,
    options: {
      overrideApplied?: boolean;
      overrideReason?: string;
    } = {}
  ): Promise<PublishedShortlist> {
    const project = await projectService.getProject(projectId);
    if (!project) throw new Error(`Project ${projectId} not found.`);

    const internalSnap = await getDoc(doc(db, 'projects', projectId, 'shortlists', shortlistId));
    if (!internalSnap.exists()) {
      throw new Error(`Shortlist ${shortlistId} not found.`);
    }
    const internal = internalSnap.data() as InternalShortlist;

    // Check candidate count constraints
    const candidateCount = internal.candidateIds.length;
    if (candidateCount < SHORTLIST_CONFIG.minimumSize && !options.overrideApplied) {
      throw new Error(
        `At least ${SHORTLIST_CONFIG.minimumSize} professionals are required for client shortlist comparison (currently ${candidateCount}). Admin override required.`
      );
    }

    // Build client-safe candidate snapshots
    const candidateSnapshots: ShortlistCandidateSnapshot[] = [];

    for (let i = 0; i < internal.items.length; i++) {
      const item = internal.items[i];
      const prof = await profileService.getProfessionalProfile(item.professionalId);
      const avail = await availabilityService.getAvailability(item.professionalId);
      const quote = await quoteService.getQuote(item.quoteId);

      if (!prof || !quote) {
        throw new Error(`Incomplete record for candidate ${item.professionalId}. Cannot publish.`);
      }

      const clientSafeMatchReason = matchExplanationService.generateClientSafeExplanation(
        project,
        prof,
        avail,
        quote,
        item.internalMatchReasons
      );

      const keyMatchHighlights = matchExplanationService.extractKeyHighlights(
        project,
        prof,
        avail,
        quote
      );

      const snapshot: ShortlistCandidateSnapshot = {
        professionalId: item.professionalId,
        matchId: item.matchId,
        opportunityId: item.opportunityId,
        quoteId: item.quoteId,
        professional: {
          id: prof.userId,
          displayName: prof.displayName,
          professionalTitle: prof.professionalTitle,
          shortBio: prof.shortBio,
          country: prof.country,
          timezone: prof.timezone,
          languages: prof.languages || [],
          yearsOfExperience: prof.yearsOfExperience,
          completedProjectCount: prof.completedProjectCount,
          ...(typeof prof.averageRating === 'number' ? { averageRating: prof.averageRating } : {}),
          skills: prof.skills || [],
          primaryServices: prof.primaryServices || [],
          portfolioItems: prof.portfolioItems || [],
        },
        availability: {
          availabilityStatus: avail?.availabilityStatus || 'available',
          nextAvailableDate: avail?.nextAvailableDate || new Date().toISOString().split('T')[0],
          currentActiveProjectCount: avail?.currentActiveProjectCount || 0,
        },
        quote: {
          id: quote.id,
          quoteType: quote.quoteType,
          amountMinor: quote.amountMinor,
          currency: quote.currency,
          scopeSummary: quote.scopeSummary,
          includedItems: quote.includedItems || [],
          excludedItems: quote.excludedItems || [],
          proposedStartDate: quote.proposedStartDate,
          estimatedDurationDays: quote.estimatedDurationDays,
          revisionsIncluded: quote.revisionsIncluded,
          note: quote.note || '',
          alternativeExplanation: quote.alternativeExplanation || '',
          budgetRelation: quote.budgetRelation,
          submittedAt: quote.submittedAt,
        },
        clientSafeMatchReason,
        keyMatchHighlights,
        orderIndex: i,
        isRecommended: item.isRecommended,
        recommendationRationale: item.recommendationRationale,
      };

      candidateSnapshots.push(snapshot);
    }

    const nowIso = new Date().toISOString();

    // 1. Create client-safe published shortlist record
    const publishedShortlist: PublishedShortlist = {
      id: `pub_${shortlistId}`,
      projectId,
      clientId: project.clientId,
      shortlistId,
      version: internal.version,
      status: 'published',
      publishedAt: nowIso,
      candidates: candidateSnapshots,
    };

    const sanitizedPublished = removeUndefinedFields(publishedShortlist);

    // Store at projects/{projectId}/publishedShortlist/current
    await setDoc(doc(db, 'projects', projectId, 'publishedShortlist', 'current'), sanitizedPublished);
    // Also store versioned archive
    await setDoc(doc(db, 'projects', projectId, 'publishedShortlist', publishedShortlist.id), sanitizedPublished);

    // 2. Update internal shortlist status
    await updateDoc(doc(db, 'projects', projectId, 'shortlists', shortlistId), removeUndefinedFields({
      status: 'published',
      publishedAt: nowIso,
      updatedAt: nowIso,
      overrideApplied: options.overrideApplied || false,
      overrideReason: options.overrideReason || '',
    }));

    // 3. Update project status to 'shortlist_ready'
    await updateDoc(doc(db, 'projects', projectId), {
      status: 'shortlist_ready',
      updatedAt: nowIso,
    });

    // 4. Update match records to 'shortlisted'
    for (const item of internal.items) {
      if (item.matchId) {
        await matchingService.updateMatchStatus(projectId, item.matchId, 'shortlisted');
      }
    }

    // 5. Activity event
    await projectService.logActivity(
      projectId,
      actorId,
      'admin',
      'shortlist_published',
      'Curated shortlist published to client',
      `Curated selection of ${candidateSnapshots.length} verified professionals released for client review and comparison.`,
      {
        shortlistId,
        candidateCount: candidateSnapshots.length,
        candidateIds: internal.candidateIds,
      }
    );

    // 6. In-App Notification to client
    await notificationService.dispatchNotification(
      project.clientId,
      'shortlist_ready',
      'Your matches are ready',
      'We found a curated selection of professionals matched to your project.',
      `/client/projects/${projectId}/matches`,
      { projectId }
    );

    // 7. Audit log
    await auditService.logEvent(
      actorId,
      'admin',
      'SHORTLIST_PUBLISHED',
      'shortlist',
      shortlistId,
      { projectId, candidateCount: candidateSnapshots.length }
    );

    return publishedShortlist;
  },

  /**
   * Get client-safe published shortlist
   */
  async getPublishedShortlist(projectId: string): Promise<PublishedShortlist | null> {
    const snap = await getDoc(doc(db, 'projects', projectId, 'publishedShortlist', 'current'));
    if (!snap.exists()) return null;
    return snap.data() as PublishedShortlist;
  },

  /**
   * Client selects a professional from the curated shortlist
   */
  async selectProfessional(
    projectId: string,
    professionalId: string,
    clientId: string,
    clientName?: string
  ): Promise<ProfessionalSelection> {
    const project = await projectService.getProject(projectId);
    if (!project) throw new Error(`Project ${projectId} not found.`);

    // Ownership check
    if (project.clientId !== clientId) {
      throw new Error('Unauthorized: You are not the owner of this project.');
    }

    // State check
    if (project.status !== 'shortlist_ready') {
      if (project.status === 'professional_selected') {
        throw new Error('A professional has already been selected for this project.');
      }
      throw new Error(`Cannot select professional in current project state '${project.status}'.`);
    }

    const published = await this.getPublishedShortlist(projectId);
    if (!published) {
      throw new Error('No published shortlist available for this project.');
    }

    const selectedCandidate = published.candidates.find((c) => c.professionalId === professionalId);
    if (!selectedCandidate) {
      throw new Error('Selected professional is not present on the curated shortlist.');
    }

    const nowIso = new Date().toISOString();

    // 1. Build immutable selection snapshot
    const selectionRecord: ProfessionalSelection = {
      id: `sel_${projectId}`,
      projectId,
      shortlistId: published.shortlistId,
      shortlistVersion: published.version,
      professionalId,
      quoteId: selectedCandidate.quote.id,
      matchId: selectedCandidate.matchId,
      opportunityId: selectedCandidate.opportunityId,
      selectedBy: clientId,
      selectedAt: nowIso,
      selectionSnapshot: {
        professionalName: selectedCandidate.professional.displayName,
        professionalTitle: selectedCandidate.professional.professionalTitle,
        amountMinor: selectedCandidate.quote.amountMinor,
        currency: selectedCandidate.quote.currency,
        quoteType: selectedCandidate.quote.quoteType,
        scopeSummary: selectedCandidate.quote.scopeSummary,
        includedItems: selectedCandidate.quote.includedItems,
        excludedItems: selectedCandidate.quote.excludedItems,
        proposedStartDate: selectedCandidate.quote.proposedStartDate,
        estimatedDurationDays: selectedCandidate.quote.estimatedDurationDays,
        revisionsIncluded: selectedCandidate.quote.revisionsIncluded,
        note: selectedCandidate.quote.note,
        alternativeExplanation: selectedCandidate.quote.alternativeExplanation,
      },
    };

    // Store in projects/{projectId}/selection/current and archive
    const sanitizedSelection = removeUndefinedFields(selectionRecord);
    await setDoc(doc(db, 'projects', projectId, 'selection', 'current'), sanitizedSelection);
    await setDoc(doc(db, 'projects', projectId, 'selection', selectionRecord.id), sanitizedSelection);

    // 2. Transition Project state to 'professional_selected'
    await updateDoc(doc(db, 'projects', projectId), removeUndefinedFields({
      status: 'professional_selected',
      selectedProfessionalId: professionalId,
      selectedQuoteId: selectedCandidate.quote.id,
      selectedShortlistId: published.shortlistId,
      selectedAt: nowIso,
      updatedAt: nowIso,
    }));

    // 3. Update Published Shortlist state
    await updateDoc(doc(db, 'projects', projectId, 'publishedShortlist', 'current'), removeUndefinedFields({
      status: 'selection_made',
      selectedProfessionalId: professionalId,
      selectedAt: nowIso,
    }));

    // 4. Update Internal Shortlist state
    try {
      await updateDoc(doc(db, 'projects', projectId, 'shortlists', published.shortlistId), removeUndefinedFields({
        status: 'selection_made',
        selectedProfessionalId: professionalId,
        selectedAt: nowIso,
        updatedAt: nowIso,
      }));
    } catch (e) {
      console.warn('Non-blocking: could not update internal shortlist doc:', e);
    }

    // 5. Update Quotes & Opportunities status for selected and non-selected candidates
    for (const cand of published.candidates) {
      const isSelected = cand.professionalId === professionalId;
      const quoteStatus = isSelected ? 'selected' : 'not_selected';
      const oppStatus = isSelected ? 'selected' : 'not_selected';
      const matchStatus = isSelected ? 'selected' : 'not_selected';

      try {
        if (cand.quoteId) {
          await updateDoc(doc(db, 'quotes', cand.quoteId), {
            status: quoteStatus,
            updatedAt: nowIso,
          });
        }
      } catch (err) {
        console.warn('Could not update quote status:', err);
      }

      try {
        if (cand.opportunityId) {
          await updateDoc(doc(db, 'opportunities', cand.opportunityId), {
            status: oppStatus,
            updatedAt: nowIso,
          });
        }
      } catch (err) {
        console.warn('Could not update opportunity status:', err);
      }

      try {
        if (cand.matchId) {
          await updateDoc(doc(db, 'projects', projectId, 'matches', cand.matchId), {
            status: matchStatus,
            updatedAt: nowIso,
          });
        }
      } catch (err) {
        console.warn('Could not update match status:', err);
      }
    }

    // 6. Log activity event
    await projectService.logActivity(
      projectId,
      clientId,
      'client',
      'client_selected_professional',
      'Professional selected by client',
      `Client confirmed selection of ${selectedCandidate.professional.displayName} for commercial proposal (${(selectedCandidate.quote.amountMinor / 100).toLocaleString()} ${selectedCandidate.quote.currency}).`,
      {
        professionalId,
        professionalName: selectedCandidate.professional.displayName,
        quoteId: selectedCandidate.quote.id,
        amountMinor: selectedCandidate.quote.amountMinor,
      },
      clientName || 'Client'
    );

    // 7. Dispatch Notifications
    // To Client:
    await notificationService.dispatchNotification(
      clientId,
      'professional_selected',
      'Professional Selection Confirmed',
      `You selected ${selectedCandidate.professional.displayName}. Next, we'll prepare the final project proposal based on the agreed scope and price.`,
      `/client/projects/${projectId}/matches`,
      { projectId }
    );

    // To Selected Professional:
    await notificationService.dispatchNotification(
      professionalId,
      'professional_selected',
      'You were selected for a project!',
      `Congratulations! You've been chosen by the client for "${project.title}". Our team will now prepare the project agreement.`,
      `/professional/opportunities/${selectedCandidate.opportunityId}`,
      { projectId }
    );

    // To Non-Selected Shortlisted Professionals:
    for (const cand of published.candidates) {
      if (cand.professionalId !== professionalId) {
        await notificationService.dispatchNotification(
          cand.professionalId,
          'not_selected',
          `Update on "${project.title}"`,
          `The client has chosen another proposal for this engagement. Thank you for your time and commercial submission.`,
          `/professional/opportunities/${cand.opportunityId}`,
          { projectId }
        );
      }
    }

    // To Admin:
    try {
      await notificationService.dispatchNotification(
        'admin',
        'professional_selected',
        `Specialist selected for "${project.title}"`,
        `${clientName || 'Client'} selected ${selectedCandidate.professional.displayName}. Commercial proposal preparation is now pending.`,
        `/admin/projects/${projectId}`,
        { projectId, professionalId }
      );
    } catch (e) {
      console.warn('Could not dispatch admin notification:', e);
    }

    // 8. Audit log
    await auditService.logEvent(
      clientId,
      'client',
      'PROFESSIONAL_SELECTED',
      'project',
      projectId,
      {
        professionalId,
        quoteId: selectedCandidate.quote.id,
        amountMinor: selectedCandidate.quote.amountMinor,
      }
    );

    return selectionRecord;
  },

  /**
   * Get selection record for a project
   */
  async getSelection(projectId: string): Promise<ProfessionalSelection | null> {
    const snap = await getDoc(doc(db, 'projects', projectId, 'selection', 'current'));
    if (!snap.exists()) return null;
    return snap.data() as ProfessionalSelection;
  },
};
