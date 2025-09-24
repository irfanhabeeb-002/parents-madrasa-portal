import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '../../services/dashboardService';
import { StorageService } from '../../services/storageService';

// Mock StorageService
vi.mock('../../services/storageService', () => ({
  StorageService: {
    setArray: vi.fn().mockResolvedValue(true),
    getArray: vi.fn().mockResolvedValue([]),
    setItem: vi.fn().mockResolvedValue(true),
    getItem: vi.fn().mockResolvedValue(null),
    removeItem: vi.fn().mockResolvedValue(true),
    clear: vi.fn().mockResolvedValue(true),
  },
}));

describe('Data Operations Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Data Flow', () => {
    it('should fetch and process dashboard data correctly', async () => {
      const userId = 'test-user-123';
      const result = await DashboardService.getDashboardData(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.user.id).toBe(userId);
      expect(result.data.stats).toBeDefined();
      expect(result.data.announcements).toBeInstanceOf(Array);
      expect(result.data.notifications).toBeInstanceOf(Array);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle dashboard data with proper error handling', async () => {
      // Test with invalid user ID
      const result = await DashboardService.getDashboardData('');

      // Should still return a valid response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Announcements Data Flow', () => {
    it('should fetch and filter announcements correctly', async () => {
      const result = await DashboardService.getAnnouncements();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);

      // All announcements should be active
      result.data.forEach(announcement => {
        expect(announcement.isActive).toBe(true);
        expect(announcement.id).toBeDefined();
        expect(announcement.title).toBeDefined();
        expect(announcement.message).toBeDefined();
        expect(announcement.type).toBeDefined();
        expect(announcement.priority).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(announcement.priority);
      });
    });

    it('should filter announcements by target audience', async () => {
      const studentsResult =
        await DashboardService.getAnnouncements('students');
      const parentsResult = await DashboardService.getAnnouncements('parents');

      expect(studentsResult.success).toBe(true);
      expect(parentsResult.success).toBe(true);

      studentsResult.data.forEach(announcement => {
        expect(['all', 'students']).toContain(announcement.targetAudience);
      });

      parentsResult.data.forEach(announcement => {
        expect(['all', 'parents']).toContain(announcement.targetAudience);
      });
    });

    it('should sort announcements by priority and date', async () => {
      const result = await DashboardService.getAnnouncements();

      expect(result.success).toBe(true);

      if (result.data.length > 1) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };

        for (let i = 0; i < result.data.length - 1; i++) {
          const current = result.data[i];
          const next = result.data[i + 1];

          const currentPriority = priorityOrder[current.priority];
          const nextPriority = priorityOrder[next.priority];

          // Higher priority should come first
          expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
        }
      }
    });
  });

  describe('Notifications Data Flow', () => {
    it('should fetch user notifications correctly', async () => {
      const userId = '1'; // Using mock data user ID
      const result = await DashboardService.getUserNotifications(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);

      result.data.forEach(notification => {
        expect(notification.userId).toBe(userId);
        expect(notification.id).toBeDefined();
        expect(notification.type).toBeDefined();
        expect([
          'class_reminder',
          'new_recording',
          'new_notes',
          'exam_reminder',
        ]).toContain(notification.type);
        expect(notification.title).toBeDefined();
        expect(notification.message).toBeDefined();
        expect(typeof notification.read).toBe('boolean');
        expect(notification.timestamp).toBeInstanceOf(Date);
        expect(['high', 'medium', 'low']).toContain(notification.priority);
      });
    });

    it('should filter notifications by read status', async () => {
      const userId = '1';
      const allNotifications = await DashboardService.getUserNotifications(
        userId,
        true
      );
      const unreadOnly = await DashboardService.getUserNotifications(
        userId,
        false
      );

      expect(allNotifications.success).toBe(true);
      expect(unreadOnly.success).toBe(true);

      // Unread notifications should only contain unread items
      unreadOnly.data.forEach(notification => {
        expect(notification.read).toBe(false);
      });

      // All notifications should include both read and unread
      const hasRead = allNotifications.data.some(n => n.read);
      const hasUnread = allNotifications.data.some(n => !n.read);
      expect(hasRead || hasUnread).toBe(true);
    });

    it('should mark notifications as read', async () => {
      const notificationId = 'notif-1'; // From mock data
      const result =
        await DashboardService.markNotificationAsRead(notificationId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);

      // Verify storage was called
      expect(StorageService.setArray).toHaveBeenCalled();
    });

    it('should create new notifications', async () => {
      const notificationData = {
        type: 'class_reminder' as const,
        title: 'Test Notification',
        message: 'Test message',
        malayalamMessage: 'ടെസ്റ്റ് സന്ദേശം',
        read: false,
        userId: 'test-user',
        priority: 'medium' as const,
      };

      const result =
        await DashboardService.createNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.data.id).toBeDefined();
      expect(result.data.timestamp).toBeInstanceOf(Date);
      expect(result.data.title).toBe(notificationData.title);
      expect(result.data.message).toBe(notificationData.message);
      expect(result.data.malayalamMessage).toBe(
        notificationData.malayalamMessage
      );
      expect(result.data.type).toBe(notificationData.type);
      expect(result.data.priority).toBe(notificationData.priority);

      // Verify storage was called
      expect(StorageService.setArray).toHaveBeenCalled();
    });
  });

  describe('Class Data Flow', () => {
    it('should fetch upcoming classes correctly', async () => {
      const result = await DashboardService.getUpcomingClasses();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);

      const now = new Date();
      result.data.forEach(classSession => {
        // All classes should be in the future
        expect(new Date(classSession.scheduledAt).getTime()).toBeGreaterThan(
          now.getTime()
        );

        // Required properties should be present
        expect(classSession.id).toBeDefined();
        expect(classSession.title).toBeDefined();
        expect(classSession.scheduledAt).toBeDefined();
        expect(classSession.zoomMeetingId).toBeDefined();
        expect(classSession.instructor).toBeDefined();
        expect(classSession.status).toBeDefined();
        expect(['scheduled', 'live', 'ended', 'cancelled']).toContain(
          classSession.status
        );
      });

      // Should be sorted by schedule time (earliest first)
      if (result.data.length > 1) {
        for (let i = 0; i < result.data.length - 1; i++) {
          const current = new Date(result.data[i].scheduledAt).getTime();
          const next = new Date(result.data[i + 1].scheduledAt).getTime();
          expect(current).toBeLessThanOrEqual(next);
        }
      }
    });

    it('should respect limit parameter for upcoming classes', async () => {
      const limit = 2;
      const result = await DashboardService.getUpcomingClasses(limit);

      expect(result.success).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(limit);
    });

    it('should fetch class by ID', async () => {
      const classId = 'class-1'; // From mock data
      const result = await DashboardService.getClassById(classId);

      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data?.id).toBe(classId);
    });

    it('should return null for non-existent class ID', async () => {
      const classId = 'non-existent-class';
      const result = await DashboardService.getClassById(classId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('Data Persistence Integration', () => {
    it('should integrate with storage service for notifications', async () => {
      const notificationData = {
        type: 'new_recording' as const,
        title: 'Storage Test',
        message: 'Testing storage integration',
        read: false,
        userId: 'test-user',
        priority: 'low' as const,
      };

      await DashboardService.createNotification(notificationData);

      // Verify storage service was called with correct parameters
      expect(StorageService.setArray).toHaveBeenCalledWith(
        'dashboard_notifications',
        expect.any(Array)
      );
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage to throw error
      vi.mocked(StorageService.setArray).mockRejectedValue(
        new Error('Storage error')
      );

      const notificationData = {
        type: 'exam_reminder' as const,
        title: 'Error Test',
        message: 'Testing error handling',
        read: false,
        userId: 'test-user',
        priority: 'high' as const,
      };

      const result =
        await DashboardService.createNotification(notificationData);

      // Should still return a response structure even with storage errors
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('Real-time Data Subscriptions', () => {
    it('should set up announcement subscriptions', () => {
      const callback = vi.fn();
      const unsubscribe = DashboardService.subscribeToAnnouncements(callback);

      expect(typeof unsubscribe).toBe('function');

      // Clean up
      unsubscribe();
    });

    it('should set up user notification subscriptions', () => {
      const callback = vi.fn();
      const userId = 'test-user';
      const unsubscribe = DashboardService.subscribeToUserNotifications(
        userId,
        callback
      );

      expect(typeof unsubscribe).toBe('function');

      // Clean up
      unsubscribe();
    });

    it("should set up today's classes subscriptions", () => {
      const callback = vi.fn();
      const unsubscribe = DashboardService.subscribeToTodaysClasses(callback);

      expect(typeof unsubscribe).toBe('function');

      // Clean up
      unsubscribe();
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should retry failed operations', async () => {
      const { withRetry } = await import('../../services/dashboardService');

      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await withRetry(operation, 3, 10);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const { withRetry } = await import('../../services/dashboardService');

      const operation = vi
        .fn()
        .mockRejectedValue(new Error('Persistent failure'));

      await expect(withRetry(operation, 2, 10)).rejects.toThrow(
        'Persistent failure'
      );
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});
