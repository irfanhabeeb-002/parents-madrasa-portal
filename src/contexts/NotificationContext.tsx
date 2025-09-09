// Notification context for managing notification state across the app
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  AppNotification, 
  NotificationPreferences, 
  NotificationPermissionState,
  NotificationBadge
} from '../types/notification';
import { notificationService } from '../services/notificationService';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  badges: Record<string, NotificationBadge>;
  preferences: NotificationPreferences;
  permission: NotificationPermissionState;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  
  // Notification methods
  scheduleClassReminder: (classId: string, classTitle: string, scheduledTime: Date) => void;
  notifyNewRecording: (recordingId: string, recordingTitle: string) => void;
  notifyNewNotes: (noteId: string, noteTitle: string) => void;
  notifyExamReminder: (examId: string, examTitle: string, examDate: Date) => void;
  notifyAnnouncement: (title: string, message: string, malayalamTitle?: string, malayalamMessage?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    classReminders: true,
    newContent: true,
    examReminders: true,
    announcements: true,
    vibration: true,
    sound: true
  });
  const [permission, setPermission] = useState<NotificationPermissionState>({
    granted: false,
    denied: false,
    default: true,
    supported: false
  });

  // Initialize notification service and subscribe to updates
  useEffect(() => {
    // Load initial data
    setNotifications(notificationService.getNotifications());
    setPreferences(notificationService.getPreferences());
    setPermission(notificationService.getPermissionState());

    // Subscribe to notification updates
    const unsubscribeNotifications = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    // Subscribe to permission updates
    const unsubscribePermission = notificationService.subscribeToPermission((updatedPermission) => {
      setPermission(updatedPermission);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeNotifications();
      unsubscribePermission();
    };
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Calculate badges for different notification types
  const badges: Record<string, NotificationBadge> = {
    class_reminder: {
      count: notifications.filter(n => n.type === 'class_reminder' && !n.read).length,
      type: 'class_reminder',
      visible: notifications.some(n => n.type === 'class_reminder' && !n.read)
    },
    new_recording: {
      count: notifications.filter(n => n.type === 'new_recording' && !n.read).length,
      type: 'new_recording',
      visible: notifications.some(n => n.type === 'new_recording' && !n.read)
    },
    new_notes: {
      count: notifications.filter(n => n.type === 'new_notes' && !n.read).length,
      type: 'new_notes',
      visible: notifications.some(n => n.type === 'new_notes' && !n.read)
    },
    exam_reminder: {
      count: notifications.filter(n => n.type === 'exam_reminder' && !n.read).length,
      type: 'exam_reminder',
      visible: notifications.some(n => n.type === 'exam_reminder' && !n.read)
    }
  };

  // Action methods
  const requestPermission = async (): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    setPermission(notificationService.getPermissionState());
    return granted;
  };

  const markAsRead = (notificationId: string): void => {
    notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = (): void => {
    notificationService.markAllAsRead();
  };

  const removeNotification = (notificationId: string): void => {
    notificationService.removeNotification(notificationId);
  };

  const clearAll = (): void => {
    notificationService.clearAll();
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>): void => {
    notificationService.updatePreferences(newPreferences);
    setPreferences(notificationService.getPreferences());
  };

  // Notification methods
  const scheduleClassReminder = (classId: string, classTitle: string, scheduledTime: Date): void => {
    notificationService.scheduleClassReminder(classId, classTitle, scheduledTime);
  };

  const notifyNewRecording = (recordingId: string, recordingTitle: string): void => {
    notificationService.notifyNewRecording(recordingId, recordingTitle);
  };

  const notifyNewNotes = (noteId: string, noteTitle: string): void => {
    notificationService.notifyNewNotes(noteId, noteTitle);
  };

  const notifyExamReminder = (examId: string, examTitle: string, examDate: Date): void => {
    notificationService.notifyExamReminder(examId, examTitle, examDate);
  };

  const notifyAnnouncement = (title: string, message: string, malayalamTitle?: string, malayalamMessage?: string): void => {
    notificationService.notifyAnnouncement(title, message, malayalamTitle, malayalamMessage);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    badges,
    preferences,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updatePreferences,
    scheduleClassReminder,
    notifyNewRecording,
    notifyNewNotes,
    notifyExamReminder,
    notifyAnnouncement
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Hook for getting notification badge count for specific type
export const useNotificationBadge = (type: string): NotificationBadge => {
  const { badges } = useNotifications();
  return badges[type] || { count: 0, type: type as any, visible: false };
};