import type {
  ClassSession,
  ClassSchedule,
  ClassStatus,
  ClassMaterial,
} from '../types/class';
import type {
  ApiResponse,
  PaginationOptions,
  FilterOptions,
  Timestamp,
} from '../types/common';
import { FirebaseClassSession, FIREBASE_COLLECTIONS } from '../types/firebase';
import { FirebaseService } from './firebaseService';
import { _StorageService } from './storageService';
import {
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp as FirestoreTimestamp,
} from 'firebase/firestore';

export class ClassService extends FirebaseService {
  private static instance: ClassService;
  private static readonly STORAGE_KEY = 'classes';
  private static readonly SCHEDULE_STORAGE_KEY = 'class_schedules';

  constructor() {
    super(FIREBASE_COLLECTIONS.CLASSES);
  }

  static getInstance(): ClassService {
    if (!ClassService.instance) {
      ClassService.instance = new ClassService();
    }
    return ClassService.instance;
  }

  // Utility function to handle Date | Timestamp conversion
  private static toDate(dateValue: Date | Timestamp): Date {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    // Handle Firestore Timestamp
    return new Date(dateValue.seconds * 1000 + dateValue.nanoseconds / 1000000);
  }

  // Mock data for development
  private static mockClasses: ClassSession[] = [
    {
      id: 'class-1',
      title: 'Introduction to Islamic History',
      description:
        'Learn about the early history of Islam and the life of Prophet Muhammad (PBUH)',
      subject: 'Islamic History',
      instructor: 'Ustadh Ahmed',
      scheduledAt: new Date('2024-01-15T10:00:00'),
      duration: 90, // 1.5 hours
      zoomMeetingId: '123456789',
      zoomJoinUrl: 'https://zoom.us/j/123456789?pwd=example',
      zoomPassword: 'islam123',
      isLive: false,
      isRecorded: true,
      recordingUrl: 'https://example.com/recording1.mp4',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      maxParticipants: 50,
      tags: ['history', 'prophet', 'beginner'],
      materials: [
        {
          id: 'mat-1',
          name: 'Class Notes - Islamic History.pdf',
          type: 'pdf',
          url: 'https://example.com/notes1.pdf',
          size: 2048000,
          description: 'Comprehensive notes covering the lesson',
        },
      ],
      status: 'completed',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'class-2',
      title: 'Quran Recitation - Surah Al-Fatiha',
      description:
        'Learn proper pronunciation and tajweed rules for Surah Al-Fatiha',
      subject: 'Quran Recitation',
      instructor: 'Qari Yusuf',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      duration: 60,
      zoomMeetingId: '987654321',
      zoomJoinUrl: 'https://zoom.us/j/987654321?pwd=example2',
      zoomPassword: 'quran456',
      isLive: true,
      isRecorded: true,
      maxParticipants: 30,
      tags: ['quran', 'recitation', 'tajweed'],
      materials: [
        {
          id: 'mat-2',
          name: 'Tajweed Rules Guide.pdf',
          type: 'pdf',
          url: 'https://example.com/tajweed.pdf',
          size: 1024000,
          description: 'Basic tajweed rules for beginners',
        },
      ],
      status: 'live',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date(),
    },
    {
      id: 'class-3',
      title: 'Islamic Ethics and Morals',
      description:
        'Understanding Islamic principles of ethics and moral conduct',
      subject: 'Islamic Ethics',
      instructor: 'Dr. Fatima',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 75,
      zoomMeetingId: '456789123',
      zoomJoinUrl: 'https://zoom.us/j/456789123?pwd=example3',
      zoomPassword: 'ethics789',
      isLive: false,
      isRecorded: true,
      maxParticipants: 40,
      tags: ['ethics', 'morals', 'conduct'],
      materials: [],
      status: 'scheduled',
      createdAt: new Date('2024-01-13'),
      updatedAt: new Date('2024-01-13'),
    },
  ];

  // Get all classes with filtering and pagination
  static async getClasses(
    options?: PaginationOptions &
      FilterOptions & {
        status?: ClassStatus;
        subject?: string;
        instructor?: string;
        isLive?: boolean;
        startDate?: Date;
        endDate?: Date;
      }
  ): Promise<ApiResponse<ClassSession[]>> {
    try {
      const service = ClassService.getInstance();
      const constraints = [];

      // Build Firestore query constraints
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }
      if (options?.subject) {
        constraints.push(where('subject', '==', options.subject));
      }
      if (options?.instructor) {
        constraints.push(where('instructor', '==', options.instructor));
      }
      if (options?.isLive !== undefined) {
        constraints.push(where('isLive', '==', options.isLive));
      }
      if (options?.startDate) {
        constraints.push(
          where(
            'scheduledAt',
            '>=',
            FirestoreTimestamp.fromDate(options.startDate)
          )
        );
      }
      if (options?.endDate) {
        constraints.push(
          where(
            'scheduledAt',
            '<=',
            FirestoreTimestamp.fromDate(options.endDate)
          )
        );
      }

      // Add ordering
      const orderField = options?.orderBy || 'scheduledAt';
      const orderDirection = options?.orderDirection || 'asc';
      constraints.push(orderBy(orderField, orderDirection));

      // Add limit
      if (options?.limit) {
        constraints.push(firestoreLimit(options.limit));
      }

      const firestoreClasses =
        await service.getAll<FirebaseClassSession>(constraints);

      // Convert Firestore data to ClassSession format
      const classes: ClassSession[] = firestoreClasses.map(cls => ({
        ...cls,
        scheduledAt: cls.scheduledAt.toDate(),
        createdAt: cls.createdAt.toDate(),
        updatedAt: cls.updatedAt.toDate(),
        duration: cls.duration || 60,
        maxParticipants: cls.maxParticipants || 50,
        tags: cls.tags || [],
        materials: cls.materials || [],
      }));

      // Apply client-side search filter if needed (Firestore doesn't support full-text search)
      let filteredClasses = classes;
      if (options?.search) {
        const searchTerm = options.search.toLowerCase();
        filteredClasses = classes.filter(
          cls =>
            cls.title.toLowerCase().includes(searchTerm) ||
            cls.description.toLowerCase().includes(searchTerm) ||
            cls.subject.toLowerCase().includes(searchTerm) ||
            cls.instructor.toLowerCase().includes(searchTerm) ||
            cls.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply client-side pagination if offset is specified
      if (options?.offset) {
        const offset = options.offset;
        const limit = options.limit || 20;
        filteredClasses = filteredClasses.slice(offset, offset + limit);
      }

      return {
        data: filteredClasses,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching classes:', error);

      // Fallback to mock data if Firestore fails
      return this.getMockClasses(options);
    }
  }

  // Fallback method using mock data
  private static async getMockClasses(
    options?: PaginationOptions &
      FilterOptions & {
        status?: ClassStatus;
        subject?: string;
        instructor?: string;
        isLive?: boolean;
        startDate?: Date;
        endDate?: Date;
      }
  ): Promise<ApiResponse<ClassSession[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      let filteredClasses = [...this.mockClasses];

      // Apply filters
      if (options?.status) {
        filteredClasses = filteredClasses.filter(
          cls => cls.status === options.status
        );
      }
      if (options?.subject) {
        filteredClasses = filteredClasses.filter(cls =>
          cls.subject.toLowerCase().includes(options.subject!.toLowerCase())
        );
      }
      if (options?.instructor) {
        filteredClasses = filteredClasses.filter(cls =>
          cls.instructor
            .toLowerCase()
            .includes(options.instructor!.toLowerCase())
        );
      }
      if (options?.isLive !== undefined) {
        filteredClasses = filteredClasses.filter(
          cls => cls.isLive === options.isLive
        );
      }
      if (options?.startDate) {
        filteredClasses = filteredClasses.filter(
          cls => this.toDate(cls.scheduledAt) >= options.startDate!
        );
      }
      if (options?.endDate) {
        filteredClasses = filteredClasses.filter(
          cls => this.toDate(cls.scheduledAt) <= options.endDate!
        );
      }
      if (options?.search) {
        const searchTerm = options.search.toLowerCase();
        filteredClasses = filteredClasses.filter(
          cls =>
            cls.title.toLowerCase().includes(searchTerm) ||
            cls.description.toLowerCase().includes(searchTerm) ||
            cls.subject.toLowerCase().includes(searchTerm) ||
            cls.instructor.toLowerCase().includes(searchTerm) ||
            cls.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      if (options?.orderBy) {
        filteredClasses.sort((a, b) => {
          const aValue = a[options.orderBy as keyof ClassSession];
          const bValue = b[options.orderBy as keyof ClassSession];
          const direction = options.orderDirection === 'desc' ? -1 : 1;

          if (aValue && bValue) {
            if (aValue < bValue) {
              return -1 * direction;
            }
            if (aValue > bValue) {
              return 1 * direction;
            }
          }
          return 0;
        });
      } else {
        // Default sort by scheduledAt ascending
        filteredClasses.sort(
          (a, b) =>
            this.toDate(a.scheduledAt).getTime() -
            this.toDate(b.scheduledAt).getTime()
        );
      }

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 20;
      const paginatedClasses = filteredClasses.slice(offset, offset + limit);

      return {
        data: paginatedClasses,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch classes',
        timestamp: new Date(),
      };
    }
  }

  // Get a specific class by ID
  static async getClassById(
    classId: string
  ): Promise<ApiResponse<ClassSession | null>> {
    try {
      const service = ClassService.getInstance();
      const firestoreClass =
        await service.getById<FirebaseClassSession>(classId);

      if (!firestoreClass) {
        // Fallback to mock data
        const classSession = this.mockClasses.find(cls => cls.id === classId);
        return {
          data: classSession || null,
          success: !!classSession,
          error: classSession ? undefined : 'Class not found',
          timestamp: new Date(),
        };
      }

      // Convert Firestore data to ClassSession format
      const classSession: ClassSession = {
        ...firestoreClass,
        scheduledAt: firestoreClass.scheduledAt.toDate(),
        createdAt: firestoreClass.createdAt.toDate(),
        updatedAt: firestoreClass.updatedAt.toDate(),
        duration: firestoreClass.duration || 60,
        maxParticipants: firestoreClass.maxParticipants || 50,
        tags: firestoreClass.tags || [],
        materials: firestoreClass.materials || [],
      };

      return {
        data: classSession,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching class by ID:', error);

      // Fallback to mock data
      const classSession = this.mockClasses.find(cls => cls.id === classId);
      return {
        data: classSession || null,
        success: !!classSession,
        error: classSession ? undefined : 'Failed to fetch class',
        timestamp: new Date(),
      };
    }
  }

  // Get live classes
  static async getLiveClasses(): Promise<ApiResponse<ClassSession[]>> {
    return this.getClasses({ isLive: true, status: 'live' });
  }

  // Get scheduled classes for today
  static async getTodaysClasses(): Promise<ApiResponse<ClassSession[]>> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    return this.getClasses({
      startDate: startOfDay,
      endDate: endOfDay,
      orderBy: 'scheduledAt',
      orderDirection: 'asc',
    });
  }

  // Get upcoming classes
  static async getUpcomingClasses(
    limit: number = 5
  ): Promise<ApiResponse<ClassSession[]>> {
    const now = new Date();

    return this.getClasses({
      startDate: now,
      status: 'scheduled',
      limit,
      orderBy: 'scheduledAt',
      orderDirection: 'asc',
    });
  }

  // Set up real-time listener for classes
  static subscribeToClasses(
    callback: (classes: ClassSession[]) => void,
    options?: {
      status?: ClassStatus;
      isLive?: boolean;
      startDate?: Date;
      endDate?: Date;
    }
  ): () => void {
    try {
      const service = ClassService.getInstance();
      const constraints = [];

      // Build constraints for real-time listener
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }
      if (options?.isLive !== undefined) {
        constraints.push(where('isLive', '==', options.isLive));
      }
      if (options?.startDate) {
        constraints.push(
          where(
            'scheduledAt',
            '>=',
            FirestoreTimestamp.fromDate(options.startDate)
          )
        );
      }
      if (options?.endDate) {
        constraints.push(
          where(
            'scheduledAt',
            '<=',
            FirestoreTimestamp.fromDate(options.endDate)
          )
        );
      }

      constraints.push(orderBy('scheduledAt', 'asc'));

      return service.setupListener<FirebaseClassSession>(firestoreClasses => {
        const classes: ClassSession[] = firestoreClasses.map(cls => ({
          ...cls,
          scheduledAt: cls.scheduledAt.toDate(),
          createdAt: cls.createdAt.toDate(),
          updatedAt: cls.updatedAt.toDate(),
          duration: cls.duration || 60,
          maxParticipants: cls.maxParticipants || 50,
          tags: cls.tags || [],
          materials: cls.materials || [],
        }));
        callback(classes);
      }, constraints);
    } catch (error) {
      console.error('Error setting up classes listener:', error);
      // Return empty unsubscribe function
      return () => {};
    }
  }

  // Subscribe to today's classes with real-time updates
  static subscribeToTodaysClasses(
    callback: (classes: ClassSession[]) => void
  ): () => void {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    return this.subscribeToClasses(callback, {
      startDate: startOfDay,
      endDate: endOfDay,
    });
  }

  // Subscribe to live classes with real-time updates
  static subscribeToLiveClasses(
    callback: (classes: ClassSession[]) => void
  ): () => void {
    return this.subscribeToClasses(callback, {
      isLive: true,
      status: 'live',
    });
  }

  // Join a class (simulate Zoom join)
  static async joinClass(
    classId: string,
    _userId: string
  ): Promise<ApiResponse<{ joinUrl: string; meetingId: string }>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const classSession = this.mockClasses.find(cls => cls.id === classId);

      if (!classSession) {
        return {
          data: { joinUrl: '', meetingId: '' },
          success: false,
          error: 'Class not found',
          timestamp: new Date(),
        };
      }

      if (classSession.status === 'cancelled') {
        return {
          data: { joinUrl: '', meetingId: '' },
          success: false,
          error: 'Class has been cancelled',
          timestamp: new Date(),
        };
      }

      if (classSession.status === 'completed') {
        return {
          data: { joinUrl: '', meetingId: '' },
          success: false,
          error: 'Class has already ended',
          timestamp: new Date(),
        };
      }

      // Check if class is starting soon (within 15 minutes) or is live
      const now = new Date();
      const classTime = this.toDate(classSession.scheduledAt);
      const timeDiff = classTime.getTime() - now.getTime();
      const minutesUntilClass = Math.floor(timeDiff / (1000 * 60));

      if (minutesUntilClass > 15 && classSession.status !== 'live') {
        return {
          data: { joinUrl: '', meetingId: '' },
          success: false,
          error: `Class starts in ${minutesUntilClass} minutes. You can join 15 minutes before the scheduled time.`,
          timestamp: new Date(),
        };
      }

      // Update class status to live if it's time
      if (minutesUntilClass <= 0 && classSession.status === 'scheduled') {
        classSession.status = 'live';
        classSession.isLive = true;
        classSession.updatedAt = new Date();
      }

      return {
        data: {
          joinUrl: classSession.zoomJoinUrl,
          meetingId: classSession.zoomMeetingId,
        },
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: { joinUrl: '', meetingId: '' },
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join class',
        timestamp: new Date(),
      };
    }
  }

  // Get class schedule for a user
  static async getUserClassSchedule(
    _userId: string
  ): Promise<ApiResponse<ClassSchedule[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 250));

      // Mock user schedules - in real app, this would be fetched from database
      const mockSchedules: ClassSchedule[] = this.mockClasses.map(cls => ({
        id: `schedule-${userId}-${cls.id}`,
        userId,
        classSessionId: cls.id,
        isEnrolled: true,
        enrolledAt: this.toDate(cls.createdAt),
        reminderSent: false,
      }));

      return {
        data: mockSchedules,
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
            : 'Failed to fetch class schedule',
        timestamp: new Date(),
      };
    }
  }

  // Update class status (for admin/system use)
  static async updateClassStatus(
    classId: string,
    status: ClassStatus
  ): Promise<ApiResponse<ClassSession | null>> {
    try {
      const service = ClassService.getInstance();

      // Update in Firestore
      await service.update<Partial<FirebaseClassSession>>(classId, {
        status,
        isLive: status === 'live',
        updatedAt: FirestoreTimestamp.now(),
      });

      // Get updated class
      const updatedClass = await service.getById<FirebaseClassSession>(classId);

      if (!updatedClass) {
        return {
          data: null,
          success: false,
          error: 'Class not found after update',
          timestamp: new Date(),
        };
      }

      // Convert to ClassSession format
      const classSession: ClassSession = {
        ...updatedClass,
        scheduledAt: updatedClass.scheduledAt.toDate(),
        createdAt: updatedClass.createdAt.toDate(),
        updatedAt: updatedClass.updatedAt.toDate(),
        duration: updatedClass.duration || 60,
        maxParticipants: updatedClass.maxParticipants || 50,
        tags: updatedClass.tags || [],
        materials: updatedClass.materials || [],
      };

      // Also update mock data for fallback
      const classIndex = this.mockClasses.findIndex(cls => cls.id === classId);
      if (classIndex !== -1) {
        this.mockClasses[classIndex].status = status;
        this.mockClasses[classIndex].isLive = status === 'live';
        this.mockClasses[classIndex].updatedAt = new Date();
      }

      return {
        data: classSession,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error updating class status:', error);

      // Fallback to mock data update
      const classIndex = this.mockClasses.findIndex(cls => cls.id === classId);

      if (classIndex === -1) {
        return {
          data: null,
          success: false,
          error: 'Class not found',
          timestamp: new Date(),
        };
      }

      this.mockClasses[classIndex].status = status;
      this.mockClasses[classIndex].isLive = status === 'live';
      this.mockClasses[classIndex].updatedAt = new Date();

      return {
        data: this.mockClasses[classIndex],
        success: true,
        timestamp: new Date(),
      };
    }
  }

  // Get class materials
  static async getClassMaterials(
    classId: string
  ): Promise<ApiResponse<ClassMaterial[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const classSession = this.mockClasses.find(cls => cls.id === classId);

      if (!classSession) {
        return {
          data: [],
          success: false,
          error: 'Class not found',
          timestamp: new Date(),
        };
      }

      return {
        data: classSession.materials,
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
            : 'Failed to fetch class materials',
        timestamp: new Date(),
      };
    }
  }

  // Check if user can join class
  static async canJoinClass(
    classId: string,
    _userId: string
  ): Promise<ApiResponse<{ canJoin: boolean; reason?: string }>> {
    try {
      const classSession = this.mockClasses.find(cls => cls.id === classId);

      if (!classSession) {
        return {
          data: { canJoin: false, reason: 'Class not found' },
          success: true,
          timestamp: new Date(),
        };
      }

      if (classSession.status === 'cancelled') {
        return {
          data: { canJoin: false, reason: 'Class has been cancelled' },
          success: true,
          timestamp: new Date(),
        };
      }

      if (classSession.status === 'completed') {
        return {
          data: { canJoin: false, reason: 'Class has already ended' },
          success: true,
          timestamp: new Date(),
        };
      }

      const now = new Date();
      const classTime = this.toDate(classSession.scheduledAt);
      const timeDiff = classTime.getTime() - now.getTime();
      const minutesUntilClass = Math.floor(timeDiff / (1000 * 60));

      if (minutesUntilClass > 15 && classSession.status !== 'live') {
        return {
          data: {
            canJoin: false,
            reason: `Class starts in ${minutesUntilClass} minutes. You can join 15 minutes before the scheduled time.`,
          },
          success: true,
          timestamp: new Date(),
        };
      }

      return {
        data: { canJoin: true },
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: { canJoin: false, reason: 'Error checking class availability' },
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check class availability',
        timestamp: new Date(),
      };
    }
  }
}
