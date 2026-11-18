import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { InAppNotification, NotificationType } from '../types';

export const notificationService = {
  /**
   * Dispatch an in-app notification to a user
   */
  async dispatchNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata?: Record<string, unknown>
  ): Promise<InAppNotification> {
    const notifRef = doc(collection(db, 'notifications'));
    const notif: InAppNotification = {
      id: notifRef.id,
      userId,
      type,
      title,
      message,
      link,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: metadata || {},
    };

    await setDoc(notifRef, notif);
    return notif;
  },

  /**
   * Fetch all notifications for a user (ordered newest first)
   */
  async getUserNotifications(userId: string): Promise<InAppNotification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as InAppNotification);
    } catch (err) {
      console.warn('Fallback querying notifications without index:', err);
      const fallbackQ = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const snap = await getDocs(fallbackQ);
      const list = snap.docs.map((d) => d.data() as InAppNotification);
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const ref = doc(db, 'notifications', notificationId);
    await updateDoc(ref, { read: true });
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifs = await this.getUserNotifications(userId);
    const unread = notifs.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }))
    );
  },
};
