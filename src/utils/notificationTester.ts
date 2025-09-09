// Notification testing utilities for development and debugging

import { notificationService } from '../services/notificationService';

export class NotificationTester {
  
  // Test browser notification permission
  static async testPermission(): Promise<void> {
    console.log('🔔 Testing Notification Permission...');
    
    const permission = Notification.permission;
    console.log(`Current permission: ${permission}`);
    
    if (permission === 'default') {
      console.log('Requesting permission...');
      const result = await Notification.requestPermission();
      console.log(`Permission result: ${result}`);
    }
    
    // Test if notifications are supported
    if ('Notification' in window) {
      console.log('✅ Browser supports notifications');
    } else {
      console.log('❌ Browser does not support notifications');
    }
  }

  // Test a simple browser notification
  static testBrowserNotification(): void {
    console.log('🔔 Testing Browser Notification...');
    
    if (Notification.permission === 'granted') {
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from Parents Madrasa Portal',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'test',
        requireInteraction: false
      });

      notification.onclick = () => {
        console.log('Notification clicked!');
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
      
      console.log('✅ Test notification sent');
    } else {
      console.log('❌ Notification permission not granted');
    }
  }

  // Test app notification service
  static testAppNotifications(): void {
    console.log('🔔 Testing App Notification Service...');
    
    // Test class reminder
    notificationService.scheduleClassReminder(
      'test-class-123',
      'Test Islamic Studies Class',
      new Date(Date.now() + 2000) // 2 seconds from now
    );
    console.log('✅ Class reminder scheduled');

    // Test new recording notification
    notificationService.notifyNewRecording(
      'test-recording-456',
      'Introduction to Arabic Grammar'
    );
    console.log('✅ New recording notification sent');

    // Test new notes notification
    notificationService.notifyNewNotes(
      'test-notes-789',
      'Quran Recitation Guidelines'
    );
    console.log('✅ New notes notification sent');

    // Test exam reminder
    notificationService.notifyExamReminder(
      'test-exam-101',
      'Monthly Assessment',
      new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    );
    console.log('✅ Exam reminder sent');

    // Test announcement
    notificationService.notifyAnnouncement(
      'Test Announcement',
      'This is a test announcement for the notification system',
      'പരീക്ഷണ പ്രഖ്യാപനം',
      'ഇത് അറിയിപ്പ് സിസ്റ്റത്തിനുള്ള ഒരു പരീക്ഷണ പ്രഖ്യാപനമാണ്'
    );
    console.log('✅ Announcement sent');
  }

  // Check notification service status
  static checkNotificationStatus(): void {
    console.log('📊 Notification Service Status:');
    console.log('─'.repeat(40));
    
    const notifications = notificationService.getNotifications();
    console.log(`Total notifications: ${notifications.length}`);
    console.log(`Unread count: ${notificationService.getUnreadCount()}`);
    
    const preferences = notificationService.getPreferences();
    console.log('Preferences:', preferences);
    
    const permission = notificationService.getPermissionState();
    console.log('Permission state:', permission);
    
    console.log('\nRecent notifications:');
    notifications.slice(0, 5).forEach((notif, index) => {
      console.log(`${index + 1}. [${notif.type}] ${notif.title} - ${notif.read ? 'Read' : 'Unread'}`);
    });
  }

  // Test notification preferences
  static testPreferences(): void {
    console.log('⚙️ Testing Notification Preferences...');
    
    const currentPrefs = notificationService.getPreferences();
    console.log('Current preferences:', currentPrefs);
    
    // Toggle class reminders
    notificationService.updatePreferences({
      classReminders: !currentPrefs.classReminders
    });
    
    console.log('Updated preferences:', notificationService.getPreferences());
  }

  // Run all tests
  static async runAllTests(): Promise<void> {
    console.log('🚀 Running All Notification Tests...');
    console.log('='.repeat(50));
    
    await this.testPermission();
    console.log('');
    
    this.testBrowserNotification();
    console.log('');
    
    this.testAppNotifications();
    console.log('');
    
    this.checkNotificationStatus();
    console.log('');
    
    this.testPreferences();
    console.log('');
    
    console.log('✅ All tests completed!');
  }
}

// Make it available globally for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).NotificationTester = NotificationTester;
}