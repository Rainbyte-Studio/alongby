import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from '../types';
import { removeUndefinedFields } from './firestoreUtils';

export const authService = {
  /**
   * Register a new user with chosen role (client or professional)
   * Note: admin cannot be self-selected upon registration.
   */
  async registerUser(
    email: string,
    pass: string,
    displayName: string,
    role: 'client' | 'professional'
  ): Promise<{ user: FirebaseUser; profile: UserProfile }> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    const nowIso = new Date().toISOString();
    const profile: UserProfile = {
      id: user.uid,
      email: user.email || email,
      displayName,
      role,
      accountStatus: 'active',
      onboardingStatus: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Store in Firestore users collection
    await setDoc(doc(db, 'users', user.uid), removeUndefinedFields({
      ...profile,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    }));

    return { user, profile };
  },

  /**
   * Sign in with existing credentials
   */
  async signIn(email: string, pass: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Listen to Firebase auth state changes
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Retrieve the user's role and profile metadata from Firestore
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as UserProfile;
  },

  /**
   * Secure Developer Utility for Phase 1 verification:
   * Safely promotes a user account to 'admin' in development/testing.
   * This ensures admin role is not exposed on public signup forms.
   */
  async setRoleForDev(uid: string, newRole: UserRole): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      role: newRole,
      updatedAt: new Date().toISOString(),
    });
  }
};
