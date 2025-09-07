import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  where,
  Timestamp,
  QuerySnapshot
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';

// Types for dashboard data
export interface Announcement {
  id: string;
  title: string;
  message: string;
  malayalamMessage?: string;
  type: 'general' | 'class' | 'exam' | 'holiday';
  createdAt: Timestamp;
  isActive: boolean;
}

export interface DashboardNotification {
  id: string;
  type: 'new_recording' | 'new_notes' | 'class_reminder' | 'exam_reminder';
  title: string;
  message: string;
  malayalamMessage?: string;
  timestamp: Timestamp;
  read: boolean;
  userId: string;
}

export interface ClassSession {
  id: string;
  title: string;
  description: string;
  scheduledAt: Timestamp;
  zoomMeetingId: string;
  zoomJoinUrl: string;
  isLive: boolean;
  recordingUrl?: string;
}

// Dashboard Service Class
export class DashboardService {
  // Get active announcements
  static async getAnnouncements(): Promise<Announcement[]> {
    try {
      const announcementsRef = collection(db, 'announcements');
      const q = query(
        announcementsRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Announcement));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw new Error('Failed to fetch announcements');
    }
  }

  // Real-time listener for announcements
  static subscribeToAnnouncements(
    callback: (announcements: Announcement[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const announcementsRef = collection(db, 'announcements');
    const q = query(
      announcementsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const announcements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Announcement));
        callback(announcements);
      },
      (error) => {
        console.error('Error in announcements subscription:', error);
        if (onError) {
          onError(new Error('Failed to subscribe to announcements'));
        }
      }
    );
  }

  // Get user notifications
  static async getUserNotifications(userId: string): Promise<DashboardNotification[]> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DashboardNotification));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  // Real-time listener for user notifications
  static subscribeToUserNotifications(
    userId: string,
    callback: (notifications: DashboardNotification[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DashboardNotification));
        callback(notifications);
      },
      (error) => {
        console.error('Error in notifications subscription:', error);
        if (onError) {
          onError(new Error('Failed to subscribe to notifications'));
        }
      }
    );
  }

  // Get today's class session
  static async getTodaysClass(): Promise<ClassSession | null> {
    try {
      const classesRef = collection(db, 'classes');
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const q = query(
        classesRef,
        where('scheduledAt', '>=', Timestamp.fromDate(startOfDay)),
        where('scheduledAt', '<', Timestamp.fromDate(endOfDay)),
        orderBy('scheduledAt', 'asc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as ClassSession;
    } catch (error) {
      console.error('Error fetching today\'s class:', error);
      throw new Error('Failed to fetch today\'s class');
    }
  }

  // Real-time listener for today's class
  static subscribeToTodaysClass(
    callback: (classSession: ClassSession | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    const classesRef = collection(db, 'classes');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const q = query(
      classesRef,
      where('scheduledAt', '>=', Timestamp.fromDate(startOfDay)),
      where('scheduledAt', '<', Timestamp.fromDate(endOfDay)),
      orderBy('scheduledAt', 'asc'),
      limit(1)
    );

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (snapshot.empty) {
          callback(null);
          return;
        }
        
        const doc = snapshot.docs[0];
        const classSession = {
          id: doc.id,
          ...doc.data()
        } as ClassSession;
        callback(classSession);
      },
      (error) => {
        console.error('Error in today\'s class subscription:', error);
        if (onError) {
          onError(new Error('Failed to subscribe to today\'s class'));
        }
      }
    );
  }
}

// Utility function for retry mechanism
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
};