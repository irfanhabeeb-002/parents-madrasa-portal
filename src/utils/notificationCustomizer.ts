// Notification customization utilities

import { notificationService } from '../services/notificationService';

export class NotificationCustomizer {
  // Schedule class reminder with custom timing (instead of default 15 minutes)
  static scheduleCustomClassReminder(
    classId: string,
    classTitle: string,
    classTime: Date,
    reminderMinutes: number = 15
  ): void {
    const reminderTime = new Date(
      classTime.getTime() - reminderMinutes * 60 * 1000
    );

    console.warn(
      `⏰ Scheduling reminder ${reminderMinutes} minutes before class`
    );
    console.warn(`Class time: ${classTime.toLocaleString()}`);
    console.warn(`Reminder time: ${reminderTime.toLocaleString()}`);

    // Create custom notification
    const notification = {
      id: `custom_reminder_${classId}`,
      type: 'class_reminder' as const,
      title: `Class Starting in ${reminderMinutes} Minutes`,
      message: `${classTitle} starts at ${classTime.toLocaleTimeString()}`,
      malayalamTitle: `${reminderMinutes} മിനിറ്റിനുള്ളിൽ ക്ലാസ്`,
      malayalamMessage: `${classTitle} ${classTime.toLocaleTimeString()} ന് ആരംഭിക്കും`,
      timestamp: new Date(),
      read: false,
      scheduledFor: reminderTime,
      priority: 'high' as const,
      data: {
        classId,
        action: 'join_class',
        url: '/live-class',
      },
    };

    // Schedule it
    const timeUntilReminder = reminderTime.getTime() - Date.now();
    if (timeUntilReminder > 0) {
      setTimeout(() => {
        notificationService.sendPushNotification(notification);
        notificationService.addNotification(notification);
      }, timeUntilReminder);

      console.warn(
        `✅ Custom reminder scheduled for ${timeUntilReminder}ms from now`
      );
    }
  }

  // Create notification with custom sound/vibration
  static sendCustomNotification(
    title: string,
    message: string,
    options: {
      sound?: boolean;
      vibration?: boolean;
      priority?: 'low' | 'medium' | 'high';
      autoClose?: number; // seconds
      malayalam?: { title: string; message: string };
    } = {}
  ): void {
    const notification = {
      id: `custom_${Date.now()}`,
      type: 'general' as const,
      title,
      message,
      malayalamTitle: options.malayalam?.title,
      malayalamMessage: options.malayalam?.message,
      timestamp: new Date(),
      read: false,
      priority: options.priority || 'medium',
      data: {},
    };

    // Custom browser notification with specific options
    if (Notification.permission === 'granted') {
      const browserNotif = new Notification(title, {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: notification.id,
        requireInteraction: options.priority === 'high',
        silent: !options.sound,
        vibrate: options.vibration ? [200, 100, 200] : undefined,
      });

      // Auto-close if specified
      if (options.autoClose && options.priority !== 'high') {
        setTimeout(() => {
          browserNotif.close();
        }, options.autoClose * 1000);
      }

      browserNotif.onclick = () => {
        console.warn('Custom notification clicked!');
        browserNotif.close();
      };
    }

    // Add to app notifications
    notificationService.addNotification(notification);
  }

  // Batch schedule multiple reminders
  static scheduleMultipleReminders(
    classId: string,
    classTitle: string,
    classTime: Date,
    reminderTimes: number[] = [30, 15, 5] // minutes before
  ): void {
    console.warn(
      `📅 Scheduling ${reminderTimes.length} reminders for: ${classTitle}`
    );

    reminderTimes.forEach((minutes, index) => {
      setTimeout(() => {
        this.scheduleCustomClassReminder(
          `${classId}_${index}`,
          classTitle,
          classTime,
          minutes
        );
      }, index * 1000); // Stagger by 1 second to avoid conflicts
    });
  }

  // Test different notification styles
  static testNotificationStyles(): void {
    console.warn('🎨 Testing different notification styles...');

    // Urgent notification (red, persistent)
    this.sendCustomNotification(
      '🚨 Urgent: Class Starting Now!',
      'Your Arabic class is starting. Join immediately.',
      {
        priority: 'high',
        sound: true,
        vibration: true,
        malayalam: {
          title: '🚨 അടിയന്തിരം: ക്ലാസ് ഇപ്പോൾ ആരംഭിക്കുന്നു!',
          message: 'നിങ്ങളുടെ അറബിക് ക്ലാസ് ആരംഭിക്കുന്നു. ഉടൻ ചേരുക.',
        },
      }
    );

    setTimeout(() => {
      // Info notification (blue, auto-close)
      this.sendCustomNotification(
        'ℹ️ New Study Material Available',
        'Check out the latest Quran recitation guide.',
        {
          priority: 'medium',
          sound: false,
          vibration: false,
          autoClose: 5,
          malayalam: {
            title: 'ℹ️ പുതിയ പഠന സാമഗ്രി ലഭ്യമാണ്',
            message: 'ഏറ്റവും പുതിയ ഖുർആൻ പാരായണ ഗൈഡ് പരിശോധിക്കുക.',
          },
        }
      );
    }, 2000);

    setTimeout(() => {
      // Success notification (green, quiet)
      this.sendCustomNotification(
        '✅ Assignment Submitted Successfully',
        'Your homework has been received and will be reviewed.',
        {
          priority: 'low',
          sound: false,
          vibration: false,
          autoClose: 3,
          malayalam: {
            title: '✅ അസൈൻമെന്റ് വിജയകരമായി സമർപ്പിച്ചു',
            message: 'നിങ്ങളുടെ ഗൃഹപാഠം ലഭിച്ചു, അവലോകനം ചെയ്യും.',
          },
        }
      );
    }, 4000);
  }
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).NotificationCustomizer = NotificationCustomizer;
}
