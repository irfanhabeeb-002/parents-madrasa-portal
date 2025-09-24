import { Recording } from '../types/recording';
import { Note } from '../types/note';
import { Exercise } from '../types/exercise';
import { _Attendance } from '../types/attendance';
import { ClassSession } from '../types/class';
import { ApiResponse, AnnouncementType } from '../types/common';
import { NotificationType } from '../types/notification';
import {
  _FirebaseAnnouncement,
  _FirebaseNotification,
  FIREBASE_COLLECTIONS,
} from '../types/firebase';
// Firebase service import - COMMENTED OUT FOR MANUAL LOGIN
// TODO: Uncomment when ready to enable Firebase
import { FirebaseService } from './firebaseService';
import { StorageService } from './storageService';
// Firebase imports - COMMENTED OUT FOR MANUAL LOGIN
// TODO: Uncomment when ready to enable Firebase
/*
import { where, orderBy, limit as firestoreLimit, Timestamp as FirestoreTimestamp } from 'firebase/firestore';
*/

// Enhanced types for dashboard data
export interface Announcement {
  id: string;
  title: string;
  message: string;
  malayalamMessage?: string;
  type: AnnouncementType;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  targetAudience: 'all' | 'students' | 'parents';
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
}

export interface DashboardNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  malayalamMessage?: string;
  timestamp: Date;
  read: boolean;
  userId: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  data?: Record<string, any>;
}

export interface ClassSession {
  id: string;
  title: string;
  description: string;
  scheduledAt: Date;
  duration: number; // in minutes
  zoomMeetingId: string;
  zoomJoinUrl: string;
  zoomPassword?: string;
  isLive: boolean;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  recordingUrl?: string;
  instructor: string;
  subject: string;
  maxParticipants?: number;
  currentParticipants?: number;
  tags: string[];
}

export interface DashboardStats {
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  totalRecordings: number;
  totalNotes: number;
  totalExercises: number;
  completedExercises: number;
  averageScore: number;
  upcomingClasses: number;
  unreadNotifications: number;
}

export interface DashboardData {
  user: {
    id: string;
    name: string;
    role: string;
    lastLoginAt: Date;
  };
  stats: DashboardStats;
  todaysClasses: ClassSession[];
  recentRecordings: Recording[];
  recentNotes: Note[];
  upcomingExercises: Exercise[];
  announcements: Announcement[];
  notifications: DashboardNotification[];
}

// Enhanced mock data for demo
const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Welcome to Parents Madrasa Portal',
    message:
      'Access your Islamic education resources easily through our comprehensive platform',
    malayalamMessage:
      'ഞങ്ങളുടെ സമഗ്ര പ്ലാറ്റ്ഫോമിലൂടെ നിങ്ങളുടെ ഇസ്ലാമിക് വിദ്യാഭ്യാസ വിഭവങ്ങൾ എളുപ്പത്തിൽ ആക്സസ് ചെയ്യുക',
    type: 'general',
    priority: 'high',
    createdAt: new Date(),
    isActive: true,
    targetAudience: 'all',
    imageUrl: '/images/welcome-banner.jpg',
    actionUrl: '/getting-started',
    actionText: 'Get Started',
  },
  {
    id: 'ann-2',
    title: 'New Class Schedule Available',
    message: 'Updated class timings for the new semester are now available',
    malayalamMessage:
      'പുതിയ സെമസ്റ്ററിനായി അപ്ഡേറ്റ് ചെയ്ത ക്ലാസ് സമയങ്ങൾ ഇപ്പോൾ ലഭ്യമാണ്',
    type: 'class',
    priority: 'medium',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    isActive: true,
    targetAudience: 'students',
  },
  {
    id: 'ann-3',
    title: 'Ramadan Schedule Changes',
    message: 'Special Ramadan class timings will be effective from next week',
    malayalamMessage:
      'അടുത്ത ആഴ്ച മുതൽ പ്രത്യേക റമദാൻ ക്ലാസ് സമയങ്ങൾ പ്രാബല്യത്തിൽ വരും',
    type: 'general',
    priority: 'high',
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    expiresAt: new Date(Date.now() + 604800000), // 1 week from now
    isActive: true,
    targetAudience: 'all',
  },
];

const mockNotifications: DashboardNotification[] = [
  {
    id: 'notif-1',
    type: 'class_reminder',
    title: 'Class Starting Soon',
    message: 'Your Islamic Studies class starts in 15 minutes',
    malayalamMessage:
      'നിങ്ങളുടെ ഇസ്ലാമിക് പഠന ക്ലാസ് 15 മിനിറ്റിനുള്ളിൽ ആരംഭിക്കുന്നു',
    timestamp: new Date(),
    read: false,
    userId: '1',
    priority: 'high',
    actionUrl: '/live-class',
    actionText: 'Join Now',
    data: { classId: 'class-1', meetingId: '123456789' },
  },
  {
    id: 'notif-2',
    type: 'new_recording',
    title: 'New Recording Available',
    message: "Yesterday's Islamic History class recording is now available",
    malayalamMessage:
      'ഇന്നലത്തെ ഇസ്ലാമിക് ചരിത്ര ക്ലാസ് റെക്കോർഡിംഗ് ഇപ്പോൾ ലഭ്യമാണ്',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    read: false,
    userId: '1',
    priority: 'medium',
    actionUrl: '/recordings',
    actionText: 'Watch Now',
    data: { recordingId: 'rec-1' },
  },
  {
    id: 'notif-3',
    type: 'new_notes',
    title: 'New Study Notes Added',
    message: 'Tajweed rules study notes have been uploaded',
    malayalamMessage:
      'തജ്വീദ് നിയമങ്ങളുടെ പഠന കുറിപ്പുകൾ അപ്‌ലോഡ് ചെയ്തിട്ടുണ്ട്',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    read: true,
    userId: '1',
    priority: 'low',
    actionUrl: '/notes',
    actionText: 'View Notes',
    data: { noteId: 'note-2' },
  },
  {
    id: 'notif-4',
    type: 'exam_reminder',
    title: 'Upcoming Assessment',
    message: 'Islamic History quiz is due tomorrow',
    malayalamMessage: 'ഇസ്ലാമിക് ചരിത്ര ക്വിസ് നാളെ അവസാന തീയതിയാണ്',
    timestamp: new Date(Date.now() - 10800000), // 3 hours ago
    read: false,
    userId: '1',
    priority: 'high',
    actionUrl: '/exams',
    actionText: 'Take Quiz',
    data: { exerciseId: 'exercise-1' },
  },
];

const mockClassSessions: ClassSession[] = [
  {
    id: 'class-1',
    title: 'Islamic History - Early Period',
    description:
      'Comprehensive study of early Islamic history including the life of Prophet Muhammad (PBUH)',
    scheduledAt: new Date(Date.now() + 900000), // 15 minutes from now
    duration: 90,
    zoomMeetingId: '123456789',
    zoomJoinUrl: 'https://zoom.us/j/123456789',
    zoomPassword: 'islam123',
    isLive: false,
    status: 'scheduled',
    instructor: 'Dr. Ahmad Hassan',
    subject: 'Islamic History',
    maxParticipants: 50,
    currentParticipants: 0,
    tags: ['history', 'early-islam', 'prophet'],
  },
  {
    id: 'class-2',
    title: 'Quran Recitation - Tajweed Basics',
    description: 'Learning proper pronunciation and basic tajweed rules',
    scheduledAt: new Date(Date.now() + 7200000), // 2 hours from now
    duration: 60,
    zoomMeetingId: '987654321',
    zoomJoinUrl: 'https://zoom.us/j/987654321',
    zoomPassword: 'tajweed456',
    isLive: false,
    status: 'scheduled',
    instructor: 'Qari Muhammad Ali',
    subject: 'Quran Recitation',
    maxParticipants: 30,
    currentParticipants: 0,
    tags: ['quran', 'tajweed', 'recitation'],
  },
  {
    id: 'class-3',
    title: 'Islamic Fundamentals - Five Pillars',
    description: 'Detailed study of the Five Pillars of Islam',
    scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
    duration: 75,
    zoomMeetingId: '456789123',
    zoomJoinUrl: 'https://zoom.us/j/456789123',
    isLive: false,
    status: 'scheduled',
    instructor: 'Sheikh Abdullah Rahman',
    subject: 'Islamic Fundamentals',
    maxParticipants: 40,
    currentParticipants: 0,
    tags: ['fundamentals', 'five-pillars', 'basics'],
  },
];

// Enhanced Dashboard Service Class
export class DashboardService {
  private static readonly NOTIFICATIONS_STORAGE_KEY = 'dashboard_notifications';
  private static readonly ANNOUNCEMENTS_STORAGE_KEY = 'dashboard_announcements';
  private static announcementsService: FirebaseService;
  private static notificationsService: FirebaseService;

  // Initialize Firebase services
  private static getAnnouncementsService(): FirebaseService {
    if (!this.announcementsService) {
      this.announcementsService = new FirebaseService(
        FIREBASE_COLLECTIONS.ANNOUNCEMENTS
      );
    }
    return this.announcementsService;
  }

  private static getNotificationsService(): FirebaseService {
    if (!this.notificationsService) {
      this.notificationsService = new FirebaseService(
        FIREBASE_COLLECTIONS.NOTIFICATIONS
      );
    }
    return this.notificationsService;
  }

  // Get comprehensive dashboard data
  static async getDashboardData(
    userId: string
  ): Promise<ApiResponse<DashboardData>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      // Mock user data
      const user = {
        id: userId,
        name: 'Ahmad Student',
        role: 'student',
        lastLoginAt: new Date(),
      };

      // Calculate stats (in real app, this would come from various services)
      const stats: DashboardStats = {
        totalClasses: 15,
        attendedClasses: 12,
        attendancePercentage: 80,
        totalRecordings: 8,
        totalNotes: 12,
        totalExercises: 6,
        completedExercises: 4,
        averageScore: 85,
        upcomingClasses: 3,
        unreadNotifications: mockNotifications.filter(
          n => n.userId === userId && !n.read
        ).length,
      };

      // Get today's classes
      const today = new Date();
      const todaysClasses = mockClassSessions.filter(cls => {
        const classDate = new Date(cls.scheduledAt);
        return (
          classDate.getDate() === today.getDate() &&
          classDate.getMonth() === today.getMonth() &&
          classDate.getFullYear() === today.getFullYear()
        );
      });

      // Mock recent data (in real app, these would come from respective services)
      const recentRecordings: Recording[] = [];
      const recentNotes: Note[] = [];
      const upcomingExercises: Exercise[] = [];

      const dashboardData: DashboardData = {
        user,
        stats,
        todaysClasses,
        recentRecordings,
        recentNotes,
        upcomingExercises,
        announcements: mockAnnouncements.filter(a => a.isActive),
        notifications: mockNotifications.filter(n => n.userId === userId),
      };

      return {
        data: dashboardData,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {} as DashboardData,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard data',
        timestamp: new Date(),
      };
    }
  }

  // Get active announcements - USING MOCK DATA (Firebase disabled)
  static async getAnnouncements(
    targetAudience?: string
  ): Promise<ApiResponse<Announcement[]>> {
    // Firebase is disabled, use mock data directly
    console.warn('Using mock announcements (Firebase disabled)');
    return this.getMockAnnouncements(targetAudience);

    /* 
    // FIREBASE VERSION - COMMENTED OUT FOR MANUAL LOGIN
    // TODO: Uncomment when ready to enable Firebase
    try {
      const service = this.getAnnouncementsService();
      const constraints = [];

      // Build Firestore query constraints
      constraints.push(where('isActive', '==', true));
      
      // Filter by expiration date
      constraints.push(where('expiresAt', '>', FirestoreTimestamp.now()));
      
      // Filter by target audience if specified
      if (targetAudience) {
        constraints.push(where('targetAudience', 'in', ['all', targetAudience]));
      }

      // Order by priority and creation date
      constraints.push(orderBy('priority', 'desc'));
      constraints.push(orderBy('createdAt', 'desc'));

      const firestoreAnnouncements = await service.getAll<FirebaseAnnouncement>(constraints);
      
      // Convert Firestore data to Announcement format
      const announcements: Announcement[] = firestoreAnnouncements.map(ann => ({
        ...ann,
        createdAt: ann.createdAt.toDate(),
        expiresAt: ann.expiresAt?.toDate(),
        type: 'general' as AnnouncementType, // Default type
        targetAudience: ann.targetAudience || 'all',
        imageUrl: ann.imageUrl,
        actionUrl: ann.actionUrl,
        actionText: ann.actionText
      }));

      return {
        data: announcements,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching announcements:', error);
      
      // Fallback to mock data
      return this.getMockAnnouncements(targetAudience);
    }
    */
  }

  // Fallback method using mock data
  private static async getMockAnnouncements(
    targetAudience?: string
  ): Promise<ApiResponse<Announcement[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const announcements = mockAnnouncements.filter(a => {
        // Check if announcement is active
        if (!a.isActive) {
          return false;
        }

        // Check if announcement has expired
        if (a.expiresAt && new Date() > a.expiresAt) {
          return false;
        }

        // Check target audience
        if (
          targetAudience &&
          a.targetAudience !== 'all' &&
          a.targetAudience !== targetAudience
        ) {
          return false;
        }

        return true;
      });

      // Sort by priority and creation date
      announcements.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];

        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ); // Newer first
      });

      return {
        data: announcements,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch announcements',
        timestamp: new Date(),
      };
    }
  }

  // Get user notifications
  static async getUserNotifications(
    userId: string,
    includeRead: boolean = true
  ): Promise<ApiResponse<DashboardNotification[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      let notifications = mockNotifications.filter(
        notif => notif.userId === userId
      );

      if (!includeRead) {
        notifications = notifications.filter(notif => !notif.read);
      }

      // Sort by priority and timestamp
      notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];

        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }

        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ); // Newer first
      });

      return {
        data: notifications,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch notifications',
        timestamp: new Date(),
      };
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(
    notificationId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const notificationIndex = mockNotifications.findIndex(
        n => n.id === notificationId
      );
      if (notificationIndex !== -1) {
        mockNotifications[notificationIndex].read = true;

        // Update in storage
        await StorageService.setArray(
          this.NOTIFICATIONS_STORAGE_KEY,
          mockNotifications
        );
      }

      return {
        data: true,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to mark notification as read',
        timestamp: new Date(),
      };
    }
  }

  // Get today's classes
  static async getTodaysClasses(): Promise<ApiResponse<ClassSession[]>> {
    try {
      // Use ClassService to get today's classes
      const { ClassService } = await import('./classService');
      return await ClassService.getTodaysClasses();
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch today's classes",
        timestamp: new Date(),
      };
    }
  }

  // Get upcoming classes
  static async getUpcomingClasses(
    limit: number = 5
  ): Promise<ApiResponse<ClassSession[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 250));

      const now = new Date();
      const upcomingClasses = mockClassSessions
        .filter(cls => new Date(cls.scheduledAt) > now)
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime()
        )
        .slice(0, limit);

      return {
        data: upcomingClasses,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch upcoming classes',
        timestamp: new Date(),
      };
    }
  }

  // Get class by ID
  static async getClassById(
    classId: string
  ): Promise<ApiResponse<ClassSession | null>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 150));

      const classSession = mockClassSessions.find(cls => cls.id === classId);

      return {
        data: classSession || null,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch class',
        timestamp: new Date(),
      };
    }
  }

  // Create notification (for admin/system use)
  static async createNotification(
    notification: Omit<DashboardNotification, 'id' | 'timestamp'>
  ): Promise<ApiResponse<DashboardNotification>> {
    try {
      const newNotification: DashboardNotification = {
        ...notification,
        id: `notif-${Date.now()}`,
        timestamp: new Date(),
      };

      mockNotifications.unshift(newNotification);
      await StorageService.setArray(
        this.NOTIFICATIONS_STORAGE_KEY,
        mockNotifications
      );

      return {
        data: newNotification,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {} as DashboardNotification,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create notification',
        timestamp: new Date(),
      };
    }
  }

  // Real-time listeners for live updates - USING MOCK DATA (Firebase disabled)
  static subscribeToAnnouncements(
    callback: (announcements: Announcement[]) => void,
    targetAudience?: string
  ): () => void {
    // Firebase is disabled, use periodic mock data updates
    console.warn('Using mock announcements subscription (Firebase disabled)');

    // Initial call
    this.getAnnouncements(targetAudience).then(response => {
      if (response.success) {
        callback(response.data);
      }
    });

    // Periodic updates with mock data
    const intervalId = setInterval(() => {
      this.getAnnouncements(targetAudience).then(response => {
        if (response.success) {
          callback(response.data);
        }
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId);

    /* 
    // FIREBASE VERSION - COMMENTED OUT FOR MANUAL LOGIN
    // TODO: Uncomment when ready to enable Firebase
    try {
      const service = this.getAnnouncementsService();
      const constraints = [];

      // Build constraints for real-time listener
      constraints.push(where('isActive', '==', true));
      constraints.push(where('expiresAt', '>', FirestoreTimestamp.now()));
      
      if (targetAudience) {
        constraints.push(where('targetAudience', 'in', ['all', targetAudience]));
      }

      constraints.push(orderBy('priority', 'desc'));
      constraints.push(orderBy('createdAt', 'desc'));

      return service.setupListener<FirebaseAnnouncement>((firestoreAnnouncements) => {
        const announcements: Announcement[] = firestoreAnnouncements.map(ann => ({
          ...ann,
          createdAt: ann.createdAt.toDate(),
          expiresAt: ann.expiresAt?.toDate(),
          type: 'general' as AnnouncementType,
          targetAudience: ann.targetAudience || 'all',
          imageUrl: ann.imageUrl,
          actionUrl: ann.actionUrl,
          actionText: ann.actionText
        }));
        callback(announcements);
      }, constraints);
    } catch (error) {
      console.error('Error setting up announcements listener:', error);
      
      // Fallback to periodic updates
      const intervalId = setInterval(() => {
        this.getAnnouncements(targetAudience).then(response => {
          if (response.success) {
            callback(response.data);
          }
        });
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(intervalId);
    }
    */
  }

  static subscribeToUserNotifications(
    userId: string,
    callback: (notifications: DashboardNotification[]) => void
  ): () => void {
    // Firebase is disabled, use periodic mock data updates
    console.warn('Using mock notifications subscription (Firebase disabled)');

    // Initial call
    this.getUserNotifications(userId).then(response => {
      if (response.success) {
        callback(response.data);
      }
    });

    // Periodic updates with mock data
    const intervalId = setInterval(() => {
      this.getUserNotifications(userId).then(response => {
        if (response.success) {
          callback(response.data);
        }
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId);

    /* 
    // FIREBASE VERSION - COMMENTED OUT FOR MANUAL LOGIN
    // TODO: Uncomment when ready to enable Firebase
    try {
      const service = this.getNotificationsService();
      const constraints = [];

      // Build constraints for real-time listener
      constraints.push(where('userId', '==', userId));
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(firestoreLimit(50)); // Limit to recent notifications

      return service.setupListener<FirebaseNotification>((firestoreNotifications) => {
        const notifications: DashboardNotification[] = firestoreNotifications.map(notif => ({
          ...notif,
          timestamp: notif.createdAt.toDate(),
          createdAt: notif.createdAt.toDate(),
          priority: 'medium' as 'low' | 'medium' | 'high', // Default priority
          actionUrl: notif.data?.actionUrl,
          actionText: notif.data?.actionText,
          imageUrl: notif.data?.imageUrl
        }));
        callback(notifications);
      }, constraints);
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      
      // Fallback to periodic updates
      const intervalId = setInterval(() => {
        this.getUserNotifications(userId).then(response => {
          if (response.success) {
            callback(response.data);
          }
        });
      }, 10000); // Update every 10 seconds
      
      return () => clearInterval(intervalId);
    }
    */
  }

  static subscribeToTodaysClasses(
    callback: (classes: ClassSession[]) => void
  ): () => void {
    // Firebase is disabled, use mock data
    console.warn('Using mock classes subscription (Firebase disabled)');

    // Initial call with mock data
    const mockClasses: ClassSession[] = [
      {
        id: 'class-today-1',
        title: 'Arabic Grammar',
        description: 'Basic Arabic grammar lesson',
        scheduledAt: new Date(),
        duration: 60,
        instructor: 'Ustadh Ahmad',
        zoomMeetingId: '123-456-789',
        zoomPassword: 'arabic123',
        isRecorded: true,
        maxParticipants: 30,
        currentParticipants: 15,
        status: 'scheduled',
        tags: ['arabic', 'grammar'],
        materials: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    callback(mockClasses);

    // Return empty cleanup function
    return () => {};

    /* 
    // FIREBASE VERSION - COMMENTED OUT FOR MANUAL LOGIN
    // TODO: Uncomment when ready to enable Firebase
    // Use ClassService's real-time subscription
    // import { ClassService } from './classService';
    // return ClassService.subscribeToTodaysClasses(callback);
    */
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
