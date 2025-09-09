// Comprehensive notification service for the Parents Madrasa Portal
import { 
  Notification, 
  NotificationType, 
  NotificationPreferences, 
  PushNotificationPayload,
  NotificationPermissionState,
  ScheduledNotification,
  NotificationData,
  NOTIFICATION_TRANSLATIONS
} from '../types/notification';

// Firebase Cloud Messaging imports - COMMENTED OUT FOR MANUAL MODE
// TODO: Uncomment when Firebase is enabled
/*
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../config/firebase';
*/

class NotificationService {
  private notifications: Notification[] = [];
  private scheduledNotifications: ScheduledNotification[] = [];
  private preferences: NotificationPreferences = {
    classReminders: true,
    newContent: true,
    examReminders: true,
    announcements: true,
    vibration: true,
    sound: true
  };
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private permissionListeners: Array<(permission: NotificationPermissionState) => void> = [];

  constructor() {
    this.loadPreferences();
    this.loadNotifications();
    this.initializeServiceWorker();
  }

  // Initialize service worker for background notifications
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Request notification permission from user
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const permissionState = this.getPermissionState();
      
      // Notify listeners about permission change
      this.permissionListeners.forEach(listener => listener(permissionState));
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        await this.initializeFirebaseMessaging();
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Get current permission state
  getPermissionState(): NotificationPermissionState {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'denied';
    
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default',
      supported
    };
  }

  // Initialize Firebase Cloud Messaging - COMMENTED OUT FOR MANUAL MODE
  // TODO: Uncomment when Firebase is enabled
  private async initializeFirebaseMessaging(): Promise<void> {
    /*
    try {
      const messaging = getMessaging(app);
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.VITE_FIREBASE_VAPID_KEY
      });
      
      if (token) {
        console.log('FCM token:', token);
        // Store token for server-side notifications
        localStorage.setItem('fcm_token', token);
      }
      
      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        this.handleForegroundMessage(payload);
      });
    } catch (error) {
      console.error('Error initializing Firebase messaging:', error);
    }
    */
    console.log('Firebase messaging disabled - using browser notifications only');
  }

  // Handle foreground FCM messages
  private handleForegroundMessage(payload: any): void {
    const notification: Notification = {
      id: Date.now().toString(),
      type: payload.data?.type || 'general',
      title: payload.notification?.title || 'Notification',
      message: payload.notification?.body || '',
      malayalamTitle: payload.data?.malayalamTitle,
      malayalamMessage: payload.data?.malayalamMessage,
      timestamp: new Date(),
      read: false,
      priority: payload.data?.priority || 'medium',
      data: payload.data
    };

    this.addNotification(notification);
    this.showBrowserNotification(notification);
  }

  // Schedule class reminder notification (15 minutes before)
  scheduleClassReminder(classId: string, classTitle: string, scheduledTime: Date): void {
    if (!this.preferences.classReminders) return;

    const reminderTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000); // 15 minutes before
    const now = new Date();

    if (reminderTime <= now) return; // Don't schedule past reminders

    const notification: Notification = {
      id: `class_reminder_${classId}`,
      type: 'class_reminder',
      title: NOTIFICATION_TRANSLATIONS.class_reminder.title,
      message: `${classTitle} starts in 15 minutes`,
      malayalamTitle: NOTIFICATION_TRANSLATIONS.class_reminder.malayalamTitle,
      malayalamMessage: `${classTitle} 15 മിനിറ്റിനുള്ളിൽ ആരംഭിക്കും`,
      timestamp: new Date(),
      read: false,
      scheduledFor: reminderTime,
      priority: 'high',
      data: {
        classId,
        action: 'join_class',
        url: '/live-class'
      }
    };

    const timeoutId = window.setTimeout(() => {
      this.sendPushNotification(notification);
      this.addNotification(notification);
      this.removeScheduledNotification(notification.id);
    }, reminderTime.getTime() - now.getTime());

    const scheduledNotification: ScheduledNotification = {
      id: notification.id,
      notification,
      scheduledTime: reminderTime,
      timeoutId
    };

    this.scheduledNotifications.push(scheduledNotification);
    this.saveScheduledNotifications();
  }

  // Send notification for new recording
  notifyNewRecording(recordingId: string, recordingTitle: string): void {
    if (!this.preferences.newContent) return;

    const notification: Notification = {
      id: `new_recording_${recordingId}`,
      type: 'new_recording',
      title: NOTIFICATION_TRANSLATIONS.new_recording.title,
      message: `New recording: ${recordingTitle}`,
      malayalamTitle: NOTIFICATION_TRANSLATIONS.new_recording.malayalamTitle,
      malayalamMessage: `പുതിയ റെക്കോർഡിംഗ്: ${recordingTitle}`,
      timestamp: new Date(),
      read: false,
      priority: 'medium',
      data: {
        recordingId,
        action: 'view_recording',
        url: '/recordings'
      }
    };

    this.sendPushNotification(notification);
    this.addNotification(notification);
  }

  // Send notification for new notes
  notifyNewNotes(noteId: string, noteTitle: string): void {
    if (!this.preferences.newContent) return;

    const notification: Notification = {
      id: `new_notes_${noteId}`,
      type: 'new_notes',
      title: NOTIFICATION_TRANSLATIONS.new_notes.title,
      message: `New notes: ${noteTitle}`,
      malayalamTitle: NOTIFICATION_TRANSLATIONS.new_notes.malayalamTitle,
      malayalamMessage: `പുതിയ കുറിപ്പുകൾ: ${noteTitle}`,
      timestamp: new Date(),
      read: false,
      priority: 'medium',
      data: {
        noteId,
        action: 'view_notes',
        url: '/notes-exercises'
      }
    };

    this.sendPushNotification(notification);
    this.addNotification(notification);
  }

  // Send exam reminder notification
  notifyExamReminder(examId: string, examTitle: string, examDate: Date): void {
    if (!this.preferences.examReminders) return;

    const notification: Notification = {
      id: `exam_reminder_${examId}`,
      type: 'exam_reminder',
      title: NOTIFICATION_TRANSLATIONS.exam_reminder.title,
      message: `Exam reminder: ${examTitle} on ${examDate.toLocaleDateString()}`,
      malayalamTitle: NOTIFICATION_TRANSLATIONS.exam_reminder.malayalamTitle,
      malayalamMessage: `പരീക്ഷാ ഓർമ്മപ്പെടുത്തൽ: ${examTitle} ${examDate.toLocaleDateString()} ന്`,
      timestamp: new Date(),
      read: false,
      priority: 'high',
      data: {
        examId,
        action: 'view_exam',
        url: '/exams-attendance'
      }
    };

    this.sendPushNotification(notification);
    this.addNotification(notification);
  }

  // Send general announcement notification
  notifyAnnouncement(title: string, message: string, malayalamTitle?: string, malayalamMessage?: string): void {
    if (!this.preferences.announcements) return;

    const notification: Notification = {
      id: `announcement_${Date.now()}`,
      type: 'announcement',
      title: title || NOTIFICATION_TRANSLATIONS.announcement.title,
      message: message || NOTIFICATION_TRANSLATIONS.announcement.template,
      malayalamTitle: malayalamTitle || NOTIFICATION_TRANSLATIONS.announcement.malayalamTitle,
      malayalamMessage: malayalamMessage || NOTIFICATION_TRANSLATIONS.announcement.malayalamTemplate,
      timestamp: new Date(),
      read: false,
      priority: 'medium'
    };

    this.sendPushNotification(notification);
    this.addNotification(notification);
  }

  // Send push notification using browser API
  private async sendPushNotification(notification: Notification): Promise<void> {
    const permissionState = this.getPermissionState();
    
    if (!permissionState.granted) {
      console.warn('Cannot send push notification: permission not granted');
      return;
    }

    try {
      const payload: PushNotificationPayload = {
        title: notification.title,
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: notification.data,
        tag: notification.type,
        requireInteraction: notification.priority === 'high',
        vibrate: this.preferences.vibration ? [200, 100, 200] : undefined,
        silent: !this.preferences.sound
      };

      const browserNotification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
        vibrate: payload.vibrate,
        silent: payload.silent
      });

      // Handle notification click
      browserNotification.onclick = () => {
        this.handleNotificationClick(notification);
        browserNotification.close();
      };

      // Auto-close after 5 seconds for non-high priority notifications
      if (notification.priority !== 'high') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Show browser notification for foreground messages
  private showBrowserNotification(notification: Notification): void {
    this.sendPushNotification(notification);
  }

  // Handle notification click - deep linking
  private handleNotificationClick(notification: Notification): void {
    // Focus the window if it's not already focused
    if (window.focus) {
      window.focus();
    }

    // Navigate to relevant page based on notification data
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }

    // Mark notification as read
    this.markAsRead(notification.id);
  }

  // Add notification to local storage and notify listeners
  private addNotification(notification: Notification): void {
    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveNotifications();
    this.notifyListeners();
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // Get unread notifications count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Remove specific notification
  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Update notification preferences
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
  }

  // Get current preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Subscribe to notification updates
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Subscribe to permission updates
  subscribeToPermission(listener: (permission: NotificationPermissionState) => void): () => void {
    this.permissionListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.permissionListeners = this.permissionListeners.filter(l => l !== listener);
    };
  }

  // Private helper methods
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  private removeScheduledNotification(notificationId: string): void {
    const index = this.scheduledNotifications.findIndex(sn => sn.id === notificationId);
    if (index !== -1) {
      const scheduledNotification = this.scheduledNotifications[index];
      if (scheduledNotification.timeoutId) {
        clearTimeout(scheduledNotification.timeoutId);
      }
      this.scheduledNotifications.splice(index, 1);
      this.saveScheduledNotifications();
    }
  }

  // Persistence methods
  private saveNotifications(): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : undefined,
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('notification_preferences');
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  private saveScheduledNotifications(): void {
    try {
      const toSave = this.scheduledNotifications.map(sn => ({
        id: sn.id,
        notification: sn.notification,
        scheduledTime: sn.scheduledTime
      }));
      localStorage.setItem('scheduled_notifications', JSON.stringify(toSave));
    } catch (error) {
      console.error('Error saving scheduled notifications:', error);
    }
  }

  // Cleanup method
  cleanup(): void {
    // Clear all scheduled notifications
    this.scheduledNotifications.forEach(sn => {
      if (sn.timeoutId) {
        clearTimeout(sn.timeoutId);
      }
    });
    this.scheduledNotifications = [];
    this.listeners = [];
    this.permissionListeners = [];
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;