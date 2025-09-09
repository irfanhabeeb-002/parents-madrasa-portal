// Notification types and interfaces for the Parents Madrasa Portal

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  malayalamTitle?: string;
  malayalamMessage?: string;
  timestamp: Date;
  read: boolean;
  scheduledFor?: Date; // For class reminders 15 minutes before
  data?: NotificationData;
  userId?: string;
  priority: 'high' | 'medium' | 'low';
  expiresAt?: Date;
}

export interface NotificationData {
  classId?: string;
  recordingId?: string;
  noteId?: string;
  examId?: string;
  url?: string;
  action?: string;
}

export type NotificationType = 
  | 'class_reminder' 
  | 'new_recording' 
  | 'new_notes' 
  | 'exam_reminder'
  | 'general'
  | 'announcement';

export interface NotificationPreferences {
  classReminders: boolean;
  newContent: boolean;
  examReminders: boolean;
  announcements: boolean;
  vibration: boolean;
  sound: boolean;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: NotificationData;
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
  silent?: boolean;
}

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
  supported: boolean;
}

export interface ScheduledNotification {
  id: string;
  notification: AppNotification;
  scheduledTime: Date;
  timeoutId?: number;
}

export interface NotificationBadge {
  count: number;
  type: NotificationType;
  visible: boolean;
}

export interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  badges: Record<string, NotificationBadge>;
  preferences: NotificationPreferences;
  permission: NotificationPermissionState;
  scheduled: ScheduledNotification[];
}

// Malayalam translations for notification messages
export const NOTIFICATION_TRANSLATIONS = {
  class_reminder: {
    title: 'Class Reminder',
    malayalamTitle: 'ക്ലാസ് ഓർമ്മപ്പെടുത്തൽ',
    template: 'Your class starts in 15 minutes',
    malayalamTemplate: 'നിങ്ങളുടെ ക്ലാസ് 15 മിനിറ്റിനുള്ളിൽ ആരംഭിക്കും'
  },
  new_recording: {
    title: 'New Recording Available',
    malayalamTitle: 'പുതിയ റെക്കോർഡിംഗ് ലഭ്യമാണ്',
    template: 'A new class recording has been uploaded',
    malayalamTemplate: 'ഒരു പുതിയ ക്ലാസ് റെക്കോർഡിംഗ് അപ്‌ലോഡ് ചെയ്തിട്ടുണ്ട്'
  },
  new_notes: {
    title: 'New Notes Available',
    malayalamTitle: 'പുതിയ കുറിപ്പുകൾ ലഭ്യമാണ്',
    template: 'New study materials have been added',
    malayalamTemplate: 'പുതിയ പഠന സാമഗ്രികൾ ചേർത്തിട്ടുണ്ട്'
  },
  exam_reminder: {
    title: 'Exam Reminder',
    malayalamTitle: 'പരീക്ഷാ ഓർമ്മപ്പെടുത്തൽ',
    template: 'You have an upcoming exam',
    malayalamTemplate: 'നിങ്ങൾക്ക് ഒരു പരീക്ഷ വരാനുണ്ട്'
  },
  general: {
    title: 'Notification',
    malayalamTitle: 'അറിയിപ്പ്',
    template: 'You have a new notification',
    malayalamTemplate: 'നിങ്ങൾക്ക് ഒരു പുതിയ അറിയിപ്പുണ്ട്'
  },
  announcement: {
    title: 'Announcement',
    malayalamTitle: 'പ്രഖ്യാപനം',
    template: 'New announcement available',
    malayalamTemplate: 'പുതിയ പ്രഖ്യാപനം ലഭ്യമാണ്'
  }
} as const;