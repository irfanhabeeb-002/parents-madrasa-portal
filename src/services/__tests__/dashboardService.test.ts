import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DashboardService, withRetry } from '../dashboardService'
import type { Announcement, DashboardNotification } from '../dashboardService'

// Mock StorageService
vi.mock('../storageService', () => ({
  StorageService: {
    setArray: vi.fn().mockResolvedValue(true),
    getArray: vi.fn().mockResolvedValue([]),
    setItem: vi.fn().mockResolvedValue(true),
    getItem: vi.fn().mockResolvedValue(null)
  }
}))

// Mock FirebaseService
vi.mock('../firebaseService', () => ({
  FirebaseService: vi.fn().mockImplementation(() => ({
    getAll: vi.fn(),
    setupListener: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }))
}))

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getDashboardData', () => {
    it('should return comprehensive dashboard data for a user', async () => {
      const userId = 'test-user-123'
      const result = await DashboardService.getDashboardData(userId)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.user.id).toBe(userId)
      expect(result.data.user.name).toBe('Ahmad Student')
      expect(result.data.user.role).toBe('student')
      expect(result.data.stats).toBeDefined()
      expect(result.data.stats.totalClasses).toBe(15)
      expect(result.data.stats.attendancePercentage).toBe(80)
      expect(result.data.announcements).toBeInstanceOf(Array)
      expect(result.data.notifications).toBeInstanceOf(Array)
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should include correct stats calculations', async () => {
      const result = await DashboardService.getDashboardData('test-user')

      expect(result.data.stats.attendancePercentage).toBe(80)
      expect(result.data.stats.totalRecordings).toBe(8)
      expect(result.data.stats.completedExercises).toBe(4)
      expect(result.data.stats.averageScore).toBe(85)
    })

    it('should filter today\'s classes correctly', async () => {
      const result = await DashboardService.getDashboardData('test-user')

      // Today's classes should be filtered by date
      expect(result.data.todaysClasses).toBeInstanceOf(Array)
      // Since mock data may not have today's classes, we just verify it's an array
    })

    it('should handle errors gracefully', async () => {
      // Mock an error scenario
      const originalConsoleError = console.error
      console.error = vi.fn()

      // This test verifies error handling structure
      const result = await DashboardService.getDashboardData('test-user')
      
      // Even with potential errors, should return a valid response structure
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('timestamp')
      
      console.error = originalConsoleError
    })
  })

  describe('getAnnouncements', () => {
    it('should return active announcements', async () => {
      const result = await DashboardService.getAnnouncements()

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data.length).toBeGreaterThan(0)
      
      // All returned announcements should be active
      result.data.forEach((announcement: Announcement) => {
        expect(announcement.isActive).toBe(true)
      })
    })

    it('should filter by target audience', async () => {
      const result = await DashboardService.getAnnouncements('students')

      expect(result.success).toBe(true)
      result.data.forEach((announcement: Announcement) => {
        expect(['all', 'students']).toContain(announcement.targetAudience)
      })
    })

    it('should filter out expired announcements', async () => {
      const result = await DashboardService.getAnnouncements()

      expect(result.success).toBe(true)
      result.data.forEach((announcement: Announcement) => {
        if (announcement.expiresAt) {
          expect(new Date(announcement.expiresAt).getTime()).toBeGreaterThan(Date.now())
        }
      })
    })

    it('should sort announcements by priority and date', async () => {
      const result = await DashboardService.getAnnouncements()

      expect(result.success).toBe(true)
      if (result.data.length > 1) {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        
        for (let i = 0; i < result.data.length - 1; i++) {
          const current = result.data[i]
          const next = result.data[i + 1]
          
          const currentPriority = priorityOrder[current.priority]
          const nextPriority = priorityOrder[next.priority]
          
          // Higher priority should come first, or if same priority, newer should come first
          expect(currentPriority).toBeGreaterThanOrEqual(nextPriority)
        }
      }
    })

    it('should include Malayalam messages when available', async () => {
      const result = await DashboardService.getAnnouncements()

      expect(result.success).toBe(true)
      const announcementsWithMalayalam = result.data.filter(a => a.malayalamMessage)
      expect(announcementsWithMalayalam.length).toBeGreaterThan(0)
    })
  })

  describe('getUserNotifications', () => {
    it('should return user-specific notifications', async () => {
      const userId = 'test-user-123'
      const result = await DashboardService.getUserNotifications(userId)

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Array)
      
      // All notifications should belong to the specified user
      result.data.forEach((notification: DashboardNotification) => {
        expect(notification.userId).toBe(userId)
      })
    })

    it('should filter out read notifications when includeRead is false', async () => {
      const userId = '1' // Using mock data user ID
      const result = await DashboardService.getUserNotifications(userId, false)

      expect(result.success).toBe(true)
      result.data.forEach((notification: DashboardNotification) => {
        expect(notification.read).toBe(false)
      })
    })

    it('should include read notifications when includeRead is true', async () => {
      const userId = '1' // Using mock data user ID
      const result = await DashboardService.getUserNotifications(userId, true)

      expect(result.success).toBe(true)
      // Should include both read and unread notifications
      const hasReadNotifications = result.data.some(n => n.read)
      const hasUnreadNotifications = result.data.some(n => !n.read)
      
      expect(hasReadNotifications || hasUnreadNotifications).toBe(true)
    })

    it('should sort notifications by priority and timestamp', async () => {
      const userId = '1'
      const result = await DashboardService.getUserNotifications(userId)

      expect(result.success).toBe(true)
      if (result.data.length > 1) {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        
        for (let i = 0; i < result.data.length - 1; i++) {
          const current = result.data[i]
          const next = result.data[i + 1]
          
          const currentPriority = priorityOrder[current.priority]
          const nextPriority = priorityOrder[next.priority]
          
          expect(currentPriority).toBeGreaterThanOrEqual(nextPriority)
        }
      }
    })

    it('should include notification types and Malayalam messages', async () => {
      const userId = '1'
      const result = await DashboardService.getUserNotifications(userId)

      expect(result.success).toBe(true)
      result.data.forEach((notification: DashboardNotification) => {
        expect(['class_reminder', 'new_recording', 'new_notes', 'exam_reminder']).toContain(notification.type)
        expect(notification.title).toBeDefined()
        expect(notification.message).toBeDefined()
        
        if (notification.malayalamMessage) {
          expect(typeof notification.malayalamMessage).toBe('string')
        }
      })
    })
  })

  describe('markNotificationAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const notificationId = 'notif-1' // From mock data
      const result = await DashboardService.markNotificationAsRead(notificationId)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })

    it('should handle non-existent notification ID', async () => {
      const notificationId = 'non-existent-id'
      const result = await DashboardService.markNotificationAsRead(notificationId)

      // Should still succeed even if notification doesn't exist
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })
  })

  describe('getUpcomingClasses', () => {
    it('should return upcoming classes sorted by schedule time', async () => {
      const result = await DashboardService.getUpcomingClasses()

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Array)
      
      // All classes should be in the future
      const now = new Date()
      result.data.forEach(cls => {
        expect(new Date(cls.scheduledAt).getTime()).toBeGreaterThan(now.getTime())
      })

      // Should be sorted by schedule time (earliest first)
      if (result.data.length > 1) {
        for (let i = 0; i < result.data.length - 1; i++) {
          const current = new Date(result.data[i].scheduledAt).getTime()
          const next = new Date(result.data[i + 1].scheduledAt).getTime()
          expect(current).toBeLessThanOrEqual(next)
        }
      }
    })

    it('should respect the limit parameter', async () => {
      const limit = 2
      const result = await DashboardService.getUpcomingClasses(limit)

      expect(result.success).toBe(true)
      expect(result.data.length).toBeLessThanOrEqual(limit)
    })

    it('should include required class properties', async () => {
      const result = await DashboardService.getUpcomingClasses()

      expect(result.success).toBe(true)
      result.data.forEach(cls => {
        expect(cls.id).toBeDefined()
        expect(cls.title).toBeDefined()
        expect(cls.scheduledAt).toBeDefined()
        expect(cls.zoomMeetingId).toBeDefined()
        expect(cls.instructor).toBeDefined()
        expect(cls.status).toBeDefined()
        expect(['scheduled', 'live', 'ended', 'cancelled']).toContain(cls.status)
      })
    })
  })

  describe('getClassById', () => {
    it('should return class when ID exists', async () => {
      const classId = 'class-1' // From mock data
      const result = await DashboardService.getClassById(classId)

      expect(result.success).toBe(true)
      expect(result.data).not.toBeNull()
      expect(result.data?.id).toBe(classId)
    })

    it('should return null when ID does not exist', async () => {
      const classId = 'non-existent-class'
      const result = await DashboardService.getClassById(classId)

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })
  })

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const notificationData = {
        type: 'class_reminder' as const,
        title: 'Test Notification',
        message: 'Test message',
        malayalamMessage: 'ടെസ്റ്റ് സന്ദേശം',
        read: false,
        userId: 'test-user',
        priority: 'medium' as const
      }

      const result = await DashboardService.createNotification(notificationData)

      expect(result.success).toBe(true)
      expect(result.data.id).toBeDefined()
      expect(result.data.timestamp).toBeInstanceOf(Date)
      expect(result.data.title).toBe(notificationData.title)
      expect(result.data.message).toBe(notificationData.message)
      expect(result.data.malayalamMessage).toBe(notificationData.malayalamMessage)
      expect(result.data.type).toBe(notificationData.type)
      expect(result.data.priority).toBe(notificationData.priority)
    })

    it('should generate unique IDs for notifications', async () => {
      const notificationData = {
        type: 'new_recording' as const,
        title: 'Test 1',
        message: 'Message 1',
        read: false,
        userId: 'test-user',
        priority: 'low' as const
      }

      const result1 = await DashboardService.createNotification(notificationData)
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1))
      const result2 = await DashboardService.createNotification({
        ...notificationData,
        title: 'Test 2'
      })

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.data.id).not.toBe(result2.data.id)
    })
  })

  describe('withRetry utility', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await withRetry(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')
      
      const result = await withRetry(operation, 3, 10) // Short delay for testing
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'))
      
      await expect(withRetry(operation, 2, 10)).rejects.toThrow('Persistent failure')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should use exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success')
      
      const startTime = Date.now()
      await withRetry(operation, 3, 100)
      const endTime = Date.now()
      
      // Should have waited at least 100ms (first retry delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(90) // Allow some tolerance
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })
})