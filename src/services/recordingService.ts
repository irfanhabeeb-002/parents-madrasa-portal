import { Recording, RecordingView, VideoQuality, ProcessingStatus } from '../types/recording';
import { ApiResponse, PaginationOptions, SearchOptions, FilterOptions } from '../types/common';
import { StorageService } from './storageService';

export class RecordingService {
  private static readonly STORAGE_KEY = 'recordings';
  private static readonly VIEWS_STORAGE_KEY = 'recording_views';

  // Mock data for development
  private static mockRecordings: Recording[] = [
    {
      id: 'rec-1',
      classSessionId: 'class-1',
      title: 'Introduction to Islamic History',
      description: 'Overview of early Islamic civilization and key historical events',
      thumbnailUrl: '/thumbnails/islamic-history-intro.jpg',
      videoUrl: '/videos/islamic-history-intro.mp4',
      duration: 3600, // 1 hour
      fileSize: 524288000, // 500MB
      quality: 'hd',
      format: 'mp4',
      isProcessed: true,
      processingStatus: 'completed',
      viewCount: 45,
      downloadCount: 12,
      tags: ['history', 'introduction', 'islamic-civilization'],
      chapters: [
        {
          id: 'ch-1',
          title: 'Pre-Islamic Arabia',
          startTime: 0,
          endTime: 900,
          description: 'Context before Islam'
        },
        {
          id: 'ch-2',
          title: 'The Prophet Muhammad (PBUH)',
          startTime: 900,
          endTime: 2100,
          description: 'Life and teachings'
        },
        {
          id: 'ch-3',
          title: 'Early Caliphate',
          startTime: 2100,
          endTime: 3600,
          description: 'Expansion and governance'
        }
      ],
      captions: [
        {
          id: 'cap-1',
          language: 'en',
          url: '/captions/islamic-history-intro-en.vtt',
          format: 'vtt'
        },
        {
          id: 'cap-2',
          language: 'ml',
          url: '/captions/islamic-history-intro-ml.vtt',
          format: 'vtt'
        }
      ],
      metadata: {
        resolution: '1920x1080',
        bitrate: 2500,
        fps: 30,
        codec: 'H.264',
        uploadedBy: 'admin',
        originalFileName: 'islamic_history_lesson_1.mp4',
        zoomRecordingId: 'zoom-rec-123'
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'rec-2',
      classSessionId: 'class-2',
      title: 'Quran Recitation Basics',
      description: 'Learning proper pronunciation and tajweed rules',
      thumbnailUrl: '/thumbnails/quran-recitation.jpg',
      videoUrl: '/videos/quran-recitation.mp4',
      duration: 2700, // 45 minutes
      fileSize: 367001600, // 350MB
      quality: 'high',
      format: 'mp4',
      isProcessed: true,
      processingStatus: 'completed',
      viewCount: 78,
      downloadCount: 23,
      tags: ['quran', 'recitation', 'tajweed', 'pronunciation'],
      chapters: [
        {
          id: 'ch-3',
          title: 'Arabic Alphabet Review',
          startTime: 0,
          endTime: 600,
          description: 'Basic Arabic letters and sounds'
        },
        {
          id: 'ch-4',
          title: 'Tajweed Rules',
          startTime: 600,
          endTime: 1800,
          description: 'Proper pronunciation rules'
        },
        {
          id: 'ch-5',
          title: 'Practice Session',
          startTime: 1800,
          endTime: 2700,
          description: 'Guided recitation practice'
        }
      ],
      captions: [
        {
          id: 'cap-3',
          language: 'en',
          url: '/captions/quran-recitation-en.vtt',
          format: 'vtt'
        }
      ],
      metadata: {
        resolution: '1280x720',
        bitrate: 1800,
        fps: 30,
        codec: 'H.264',
        uploadedBy: 'admin',
        originalFileName: 'quran_recitation_lesson_1.mp4'
      },
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    }
  ];

  // Get all recordings with pagination and filtering
  static async getRecordings(
    options?: PaginationOptions & FilterOptions
  ): Promise<ApiResponse<Recording[]>> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let recordings = [...this.mockRecordings];

      // Apply filters
      if (options?.classSessionId) {
        recordings = recordings.filter(r => r.classSessionId === options.classSessionId);
      }
      if (options?.quality) {
        recordings = recordings.filter(r => r.quality === options.quality);
      }
      if (options?.isProcessed !== undefined) {
        recordings = recordings.filter(r => r.isProcessed === options.isProcessed);
      }

      // Apply sorting
      if (options?.orderBy) {
        recordings.sort((a, b) => {
          const aValue = a[options.orderBy as keyof Recording];
          const bValue = b[options.orderBy as keyof Recording];
          const direction = options.orderDirection === 'desc' ? -1 : 1;
          
          if (aValue < bValue) return -1 * direction;
          if (aValue > bValue) return 1 * direction;
          return 0;
        });
      }

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 10;
      const paginatedRecordings = recordings.slice(offset, offset + limit);

      return {
        data: paginatedRecordings,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recordings',
        timestamp: new Date()
      };
    }
  }

  // Get recording by ID
  static async getRecordingById(id: string): Promise<ApiResponse<Recording | null>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const recording = this.mockRecordings.find(r => r.id === id);
      
      return {
        data: recording || null,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recording',
        timestamp: new Date()
      };
    }
  }

  // Search recordings
  static async searchRecordings(
    searchOptions: SearchOptions,
    paginationOptions?: PaginationOptions
  ): Promise<ApiResponse<Recording[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 250));

      const { query, fields = ['title', 'description', 'tags'], caseSensitive = false } = searchOptions;
      const searchTerm = caseSensitive ? query : query.toLowerCase();

      let filteredRecordings = this.mockRecordings.filter(recording => {
        return fields.some(field => {
          const fieldValue = recording[field as keyof Recording];
          if (Array.isArray(fieldValue)) {
            return fieldValue.some(item => 
              caseSensitive ? item.includes(searchTerm) : item.toLowerCase().includes(searchTerm)
            );
          }
          if (typeof fieldValue === 'string') {
            return caseSensitive ? fieldValue.includes(searchTerm) : fieldValue.toLowerCase().includes(searchTerm);
          }
          return false;
        });
      });

      // Apply pagination
      const offset = paginationOptions?.offset || 0;
      const limit = paginationOptions?.limit || 10;
      filteredRecordings = filteredRecordings.slice(offset, offset + limit);

      return {
        data: filteredRecordings,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        timestamp: new Date()
      };
    }
  }

  // Track recording view
  static async trackView(recordingId: string, userId: string, duration: number): Promise<ApiResponse<boolean>> {
    try {
      const view: RecordingView = {
        id: `view-${Date.now()}`,
        recordingId,
        userId,
        viewedAt: new Date(),
        duration,
        completed: duration > 0,
        lastPosition: duration
      };

      // Store view data
      await StorageService.appendToArray(this.VIEWS_STORAGE_KEY, view);

      // Update view count
      const recordingIndex = this.mockRecordings.findIndex(r => r.id === recordingId);
      if (recordingIndex !== -1) {
        this.mockRecordings[recordingIndex].viewCount += 1;
      }

      return {
        data: true,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track view',
        timestamp: new Date()
      };
    }
  }

  // Get user's viewing history
  static async getUserViews(userId: string): Promise<ApiResponse<RecordingView[]>> {
    try {
      const allViews = await StorageService.getArray<RecordingView>(this.VIEWS_STORAGE_KEY);
      const userViews = allViews.filter(view => view.userId === userId);

      return {
        data: userViews,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user views',
        timestamp: new Date()
      };
    }
  }

  // Update recording metadata (admin function)
  static async updateRecording(id: string, updates: Partial<Recording>): Promise<ApiResponse<Recording | null>> {
    try {
      const recordingIndex = this.mockRecordings.findIndex(r => r.id === id);
      if (recordingIndex === -1) {
        return {
          data: null,
          success: false,
          error: 'Recording not found',
          timestamp: new Date()
        };
      }

      this.mockRecordings[recordingIndex] = {
        ...this.mockRecordings[recordingIndex],
        ...updates,
        updatedAt: new Date()
      };

      return {
        data: this.mockRecordings[recordingIndex],
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update recording',
        timestamp: new Date()
      };
    }
  }

  // Get recordings by class session
  static async getRecordingsByClass(classSessionId: string): Promise<ApiResponse<Recording[]>> {
    return this.getRecordings({ classSessionId });
  }

  // Get popular recordings
  static async getPopularRecordings(limit: number = 5): Promise<ApiResponse<Recording[]>> {
    try {
      const sortedRecordings = [...this.mockRecordings]
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, limit);

      return {
        data: sortedRecordings,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch popular recordings',
        timestamp: new Date()
      };
    }
  }
}