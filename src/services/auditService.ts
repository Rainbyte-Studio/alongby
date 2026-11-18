import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AuditEvent, UserRole } from '../types';

export const auditService = {
  /**
   * Log an audit / activity event (append-only record)
   */
  async logEvent(
    actorId: string,
    actorRole: UserRole,
    eventType: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'auditEvents'), {
      actorId,
      actorRole,
      eventType,
      targetType,
      targetId,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      timestampServer: serverTimestamp(),
    });
    return docRef.id;
  },
};
