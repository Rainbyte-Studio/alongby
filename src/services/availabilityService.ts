import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProfessionalAvailability, AvailabilityStatus } from '../types';
import { removeUndefinedFields } from './firestoreUtils';

export const availabilityService = {
  /**
   * Get availability configuration for a professional
   */
  async getAvailability(userId: string): Promise<ProfessionalAvailability | null> {
    const snap = await getDoc(doc(db, 'availability', userId));
    if (!snap.exists()) return null;
    return snap.data() as ProfessionalAvailability;
  },

  /**
   * Save or update availability with domain validation
   */
  async saveAvailability(
    userId: string,
    data: {
      availabilityStatus: AvailabilityStatus;
      nextAvailableDate: string;
      maximumConcurrentProjects: number;
    }
  ): Promise<ProfessionalAvailability> {
    // Validation
    const validStatuses: AvailabilityStatus[] = [
      'available',
      'limited',
      'fully_booked',
      'unavailable',
    ];
    if (!validStatuses.includes(data.availabilityStatus)) {
      throw new Error(`Invalid availability status: ${data.availabilityStatus}`);
    }

    if (
      typeof data.maximumConcurrentProjects !== 'number' ||
      data.maximumConcurrentProjects < 1 ||
      data.maximumConcurrentProjects > 20
    ) {
      throw new Error('Maximum concurrent projects must be between 1 and 20.');
    }

    if (!data.nextAvailableDate) {
      throw new Error('Next available date is required.');
    }

    const availRef = doc(db, 'availability', userId);
    const existingSnap = await getDoc(availRef);
    const existing = existingSnap.exists()
      ? (existingSnap.data() as ProfessionalAvailability)
      : null;

    const record: ProfessionalAvailability = {
      userId,
      availabilityStatus: data.availabilityStatus,
      nextAvailableDate: data.nextAvailableDate,
      maximumConcurrentProjects: data.maximumConcurrentProjects,
      currentActiveProjectCount: existing?.currentActiveProjectCount ?? 0,
      updatedAt: new Date().toISOString(),
    };

    const sanitizedPayload = removeUndefinedFields({
      ...record,
      updatedAtServer: serverTimestamp(),
    });

    await setDoc(availRef, sanitizedPayload, { merge: true });

    return record;
  },
};
