import {
  Recording,
  RecordingView,
  VideoQuality,
  _ProcessingStatus,
} from '../types/recording';
import {
  ApiResponse,
  PaginationOptions,
  SearchOptions,
  FilterOptions,
} from '../types/common';
import { FirebaseRecording, FIREBASE_COLLECTIONS } from '../types/firebase';
import { FirebaseService } from './firebaseService';
import { StorageService } from './storageService';
import { zoomRecordingService } from './zoomRecordingService';
import {
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp as FirestoreTimestamp,
} from 'firebase/firestore';

export class RecordingService extends FirebaseService {
  private static instance: RecordingService;
  private static readonly STORAGE_KEY = 'recordings';
  private static readonly VIEWS_STORAGE_KEY = 'recording_views';

  constructor() {
    super(FIREBASE_COLLECTIONS.RECORDINGS);
  }

  static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  // Mock data for development
  private static mockRecordings: Recording[] = [
    {
      id: 'rec-1',
      classSessionId: 'class-1',
      title: 'Introduction to Islamic History',
      description:
        'Overview of early Islamic civilization and key historical events',
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
          description: 'Context before Islam',
        },
        {
          id: 'ch-2',
          title: 'The Prophet Muhammad (PBUH)',
          startTime: 900,
          endTime: 2100,
          description: 'Life and teachings',
        },
        {
          id: 'ch-3',
          title: 'Early Caliphate',
          startTime: 2100,
          endTime: 3600,
          description: 'Expansion and governance',
        },
      ],
      captions: [
        {
          id: 'cap-1',
          language: 'en',
          url: '/captions/islamic-history-intro-en.vtt',
          format: 'vtt',
        },
        {
          id: 'cap-2',
          language: 'ml',
          url: '/captions/islamic-history-intro-ml.vtt',
          format: 'vtt',
        },
      ],
      metadata: {
        resolution: '1920x1080',
        bitrate: 2500,
        fps: 30,
        codec: 'H.264',
        uploadedBy: 'admin',
        originalFileName: 'islamic_history_lesson_1.mp4',
        zoomRecordingId: 'zoom-rec-123',
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
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
          description: 'Basic Arabic letters and sounds',
        },
        {
          id: 'ch-4',
          title: 'Tajweed Rules',
          startTime: 600,
          endTime: 1800,
          description: 'Proper pronunciation rules',
        },
        {
          id: 'ch-5',
          title: 'Practice Session',
          startTime: 1800,
          endTime: 2700,
          description: 'Guided recitation practice',
        },
      ],
      captions: [
        {
          id: 'cap-3',
          language: 'en',
          url: '/captions/quran-recitation-en.vtt',
          format: 'vtt',
        },
      ],
      metadata: {
        resolution: '1280x720',
        bitrate: 1800,
        fps: 30,
        codec: 'H.264',
        uploadedBy: 'admin',
        originalFileName: 'quran_recitation_lesson_1.mp4',
      },
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
  ];

  // Get all recordings with pagination and filtering (includes Zoom recordings)
  static async getRecordings(
    options?: PaginationOptions &
      FilterOptions & {
        includeZoom?: boolean;
        zoomOnly?: boolean;
      }
  ): Promise<ApiResponse<Recording[]>> {
    try {
      let allRecordings: Recording[] = [];

      // Get Zoom recordings if requested (default: true)
      if (options?.includeZoom !== false) {
        try {
          const zoomResponse = await zoomRecordingService.getZoomRecordings({
            autoSync: true,
            meetingId: options?.classSessionId,
            orderBy: options?.orderBy,
            orderDirection: options?.orderDirection,
            limit: options?.zoomOnly ? options.limit : undefined,
          });

          if (zoomResponse.success) {
            allRecordings = [...zoomResponse.data];
          }
        } catch (zoomError) {
          console.warn(
            'Failed to fetch Zoom recordings, continuing with local recordings:',
            zoomError
          );
        }
      }

      // Get local/Firebase recordings if not Zoom-only
      if (!options?.zoomOnly) {
        try {
          const service = RecordingService.getInstance();
          const constraints = [];

          // Build Firestore query constraints
          if (options?.classSessionId) {
            constraints.push(
              where('classSessionId', '==', options.classSessionId)
            );
          }
          if (options?.quality) {
            constraints.push(where('quality', '==', options.quality));
          }
          if (options?.isProcessed !== undefined) {
            constraints.push(where('isProcessed', '==', options.isProcessed));
          }

          // Add ordering
          const orderField = options?.orderBy || 'createdAt';
          const orderDirection = options?.orderDirection || 'desc';
          constraints.push(orderBy(orderField, orderDirection));

          // Add limit
          if (options?.limit) {
            constraints.push(firestoreLimit(options.limit));
          }

          const firestoreRecordings =
            await service.getAll<FirebaseRecording>(constraints);

          // Convert Firestore data to Recording format
          const localRecordings: Recording[] = firestoreRecordings.map(rec => ({
            ...rec,
            uploadedAt: rec.uploadedAt.toDate(),
            createdAt: rec.createdAt.toDate(),
            updatedAt: rec.updatedAt?.toDate() || rec.createdAt.toDate(),
            // Add default values for fields that might not exist in Firestore
            fileSize: rec.fileSize || 0,
            quality: rec.quality || 'hd',
            format: rec.format || 'mp4',
            isProcessed: rec.isProcessed ?? true,
            processingStatus: rec.processingStatus || 'completed',
            viewCount: rec.viewCount || 0,
            downloadCount: rec.downloadCount || 0,
            tags: rec.tags || [],
            chapters: rec.chapters || [],
            captions: rec.captions || [],
            metadata: rec.metadata || {},
          }));

          // Merge with Zoom recordings (avoid duplicates)
          const existingIds = new Set(allRecordings.map(r => r.id));
          const newLocalRecordings = localRecordings.filter(
            r => !existingIds.has(r.id)
          );
          allRecordings = [...allRecordings, ...newLocalRecordings];
        } catch (firestoreError) {
          console.warn(
            'Failed to fetch local recordings, using Zoom recordings only:',
            firestoreError
          );

          // If both Zoom and local fail, fallback to mock data
          if (allRecordings.length === 0) {
            return this.getMockRecordings(options);
          }
        }
      }

      // Apply additional filtering
      const filteredRecordings = allRecordings;

      if (options?.classSessionId) {
        filteredRecordings = filteredRecordings.filter(
          r => r.classSessionId === options.classSessionId
        );
      }
      if (options?.quality) {
        filteredRecordings = filteredRecordings.filter(
          r => r.quality === options.quality
        );
      }
      if (options?.isProcessed !== undefined) {
        filteredRecordings = filteredRecordings.filter(
          r => r.isProcessed === options.isProcessed
        );
      }

      // Apply sorting if not already sorted
      if (options?.orderBy && !options?.zoomOnly) {
        filteredRecordings.sort((a, b) => {
          const aValue = a[options.orderBy as keyof Recording];
          const bValue = b[options.orderBy as keyof Recording];
          const direction = options.orderDirection === 'desc' ? -1 : 1;

          if (aValue < bValue) return -1 * direction;
          if (aValue > bValue) return 1 * direction;
          return 0;
        });
      }

      // Apply client-side pagination if offset is specified
      const paginatedRecordings = filteredRecordings;
      if (options?.offset) {
        const offset = options.offset;
        const limit = options.limit || 10;
        paginatedRecordings = filteredRecordings.slice(offset, offset + limit);
      } else if (options?.limit && !options?.zoomOnly) {
        paginatedRecordings = filteredRecordings.slice(0, options.limit);
      }

      return {
        data: paginatedRecordings,
        success: true,

        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching recordings:', error);

      // Fallback to mock data
      return this.getMockRecordings(options);
    }
  }

  // Fallback method using mock data
  private static async getMockRecordings(
    options?: PaginationOptions & FilterOptions
  ): Promise<ApiResponse<Recording[]>> {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const recordings = [...this.mockRecordings];

      // Apply filters
      if (options?.classSessionId) {
        recordings = recordings.filter(
          r => r.classSessionId === options.classSessionId
        );
      }
      if (options?.quality) {
        recordings = recordings.filter(r => r.quality === options.quality);
      }
      if (options?.isProcessed !== undefined) {
        recordings = recordings.filter(
          r => r.isProcessed === options.isProcessed
        );
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
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch recordings',
        timestamp: new Date(),
      };
    }
  }

  // Get recording by ID
  static async getRecordingById(
    id: string
  ): Promise<ApiResponse<Recording | null>> {
    try {
      const service = RecordingService.getInstance();
      const firestoreRecording = await service.getById<FirebaseRecording>(id);

      if (!firestoreRecording) {
        // Fallback to mock data
        const recording = this.mockRecordings.find(r => r.id === id);
        return {
          data: recording || null,
          success: !!recording,
          error: recording ? undefined : 'Recording not found',
          timestamp: new Date(),
        };
      }

      // Convert Firestore data to Recording format
      const recording: Recording = {
        ...firestoreRecording,
        uploadedAt: firestoreRecording.uploadedAt.toDate(),
        createdAt: firestoreRecording.createdAt.toDate(),
        updatedAt:
          firestoreRecording.updatedAt?.toDate() ||
          firestoreRecording.createdAt.toDate(),
        // Add default values for fields that might not exist in Firestore
        fileSize: firestoreRecording.fileSize || 0,
        quality: firestoreRecording.quality || 'hd',
        format: firestoreRecording.format || 'mp4',
        isProcessed: firestoreRecording.isProcessed ?? true,
        processingStatus: firestoreRecording.processingStatus || 'completed',
        viewCount: firestoreRecording.viewCount || 0,
        downloadCount: firestoreRecording.downloadCount || 0,
        tags: firestoreRecording.tags || [],
        chapters: firestoreRecording.chapters || [],
        captions: firestoreRecording.captions || [],
        metadata: firestoreRecording.metadata || {},
      };

      return {
        data: recording,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching recording by ID:', error);

      // Fallback to mock data
      const recording = this.mockRecordings.find(r => r.id === id);
      return {
        data: recording || null,
        success: !!recording,
        error: recording ? undefined : 'Failed to fetch recording',
        timestamp: new Date(),
      };
    }
  }

  // Search recordings (includes Zoom recordings)
  static async searchRecordings(
    searchOptions: SearchOptions,
    paginationOptions?: PaginationOptions & {
      includeZoom?: boolean;
      zoomOnly?: boolean;
    }
  ): Promise<ApiResponse<Recording[]>> {
    try {
      let allRecordings: Recording[] = [];

      // Search Zoom recordings if requested (default: true)
      if (paginationOptions?.includeZoom !== false) {
        try {
          const zoomResponse = await zoomRecordingService.searchZoomRecordings(
            searchOptions,
            paginationOptions
          );

          if (zoomResponse.success) {
            allRecordings = [...zoomResponse.data];
          }
        } catch (zoomError) {
          console.warn(
            'Failed to search Zoom recordings, continuing with local search:',
            zoomError
          );
        }
      }

      // Search local recordings if not Zoom-only
      if (!paginationOptions?.zoomOnly) {
        const {
          query,
          fields = ['title', 'description', 'tags'],
          caseSensitive = false,
        } = searchOptions;
        const searchTerm = caseSensitive ? query : query.toLowerCase();

        // Get all local recordings first
        const localRecordingsResponse = await this.getRecordings({
          includeZoom: false, // Only local recordings
          limit: 100, // Get more for better search results
        });

        if (localRecordingsResponse.success) {
          const filteredLocalRecordings = localRecordingsResponse.data.filter(
            recording => {
              return fields.some(field => {
                const fieldValue = recording[field as keyof Recording];
                if (Array.isArray(fieldValue)) {
                  return fieldValue.some(item =>
                    caseSensitive
                      ? item.includes(searchTerm)
                      : item.toLowerCase().includes(searchTerm)
                  );
                }
                if (typeof fieldValue === 'string') {
                  return caseSensitive
                    ? fieldValue.includes(searchTerm)
                    : fieldValue.toLowerCase().includes(searchTerm);
                }
                return false;
              });
            }
          );

          // Merge with Zoom results (avoid duplicates)
          const existingIds = new Set(allRecordings.map(r => r.id));
          const newLocalRecordings = filteredLocalRecordings.filter(
            r => !existingIds.has(r.id)
          );
          allRecordings = [...allRecordings, ...newLocalRecordings];
        }
      }

      // If no results from either source, fallback to mock search
      if (allRecordings.length === 0 && !paginationOptions?.zoomOnly) {
        const {
          query,
          fields = ['title', 'description', 'tags'],
          caseSensitive = false,
        } = searchOptions;
        const searchTerm = caseSensitive ? query : query.toLowerCase();

        const filteredMockRecordings = this.mockRecordings.filter(recording => {
          return fields.some(field => {
            const fieldValue = recording[field as keyof Recording];
            if (Array.isArray(fieldValue)) {
              return fieldValue.some(item =>
                caseSensitive
                  ? item.includes(searchTerm)
                  : item.toLowerCase().includes(searchTerm)
              );
            }
            if (typeof fieldValue === 'string') {
              return caseSensitive
                ? fieldValue.includes(searchTerm)
                : fieldValue.toLowerCase().includes(searchTerm);
            }
            return false;
          });
        });

        allRecordings = filteredMockRecordings;
      }

      // Apply pagination
      const offset = paginationOptions?.offset || 0;
      const limit = paginationOptions?.limit || 10;
      const paginatedRecordings = allRecordings.slice(offset, offset + limit);

      return {
        data: paginatedRecordings,
        success: true,

        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        timestamp: new Date(),
      };
    }
  }

  // Track recording view
  static async trackView(
    recordingId: string,
    userId: string,
    duration: number
  ): Promise<ApiResponse<boolean>> {
    try {
      const view: RecordingView = {
        id: `view-${Date.now()}`,
        recordingId,
        userId,
        viewedAt: new Date(),
        duration,
        completed: duration > 0,
        lastPosition: duration,
      };

      // Store view data
      await StorageService.appendToArray(this.VIEWS_STORAGE_KEY, view);

      // Update view count in Firestore
      try {
        const service = RecordingService.getInstance();
        const recording = await service.getById<FirebaseRecording>(recordingId);

        if (recording) {
          await service.update<Partial<FirebaseRecording>>(recordingId, {
            viewCount: (recording.viewCount || 0) + 1,
            updatedAt: FirestoreTimestamp.now(),
          });
        }
      } catch (firestoreError) {
        console.warn(
          'Failed to update view count in Firestore, using fallback:',
          firestoreError
        );

        // Fallback to mock data update
        const recordingIndex = this.mockRecordings.findIndex(
          r => r.id === recordingId
        );
        if (recordingIndex !== -1) {
          this.mockRecordings[recordingIndex].viewCount += 1;
        }
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
        error: error instanceof Error ? error.message : 'Failed to track view',
        timestamp: new Date(),
      };
    }
  }

  // Set up real-time listener for recordings
  static subscribeToRecordings(
    callback: (recordings: Recording[]) => void,
    options?: {
      classSessionId?: string;
      isProcessed?: boolean;
      limit?: number;
    }
  ): () => void {
    try {
      const service = RecordingService.getInstance();
      const constraints = [];

      // Build constraints for real-time listener
      if (options?.classSessionId) {
        constraints.push(where('classSessionId', '==', options.classSessionId));
      }
      if (options?.isProcessed !== undefined) {
        constraints.push(where('isProcessed', '==', options.isProcessed));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      if (options?.limit) {
        constraints.push(firestoreLimit(options.limit));
      }

      return service.setupListener<FirebaseRecording>(firestoreRecordings => {
        const recordings: Recording[] = firestoreRecordings.map(rec => ({
          ...rec,
          uploadedAt: rec.uploadedAt.toDate(),
          createdAt: rec.createdAt.toDate(),
          updatedAt: rec.updatedAt?.toDate() || rec.createdAt.toDate(),
          // Add default values for fields that might not exist in Firestore
          fileSize: rec.fileSize || 0,
          quality: rec.quality || 'hd',
          format: rec.format || 'mp4',
          isProcessed: rec.isProcessed ?? true,
          processingStatus: rec.processingStatus || 'completed',
          viewCount: rec.viewCount || 0,
          downloadCount: rec.downloadCount || 0,
          tags: rec.tags || [],
          chapters: rec.chapters || [],
          captions: rec.captions || [],
          metadata: rec.metadata || {},
        }));
        callback(recordings);
      }, constraints);
    } catch (error) {
      console.error('Error setting up recordings listener:', error);
      // Return empty unsubscribe function
      return () => {};
    }
  }

  // Subscribe to recordings by class with real-time updates
  static subscribeToRecordingsByClass(
    classSessionId: string,
    callback: (recordings: Recording[]) => void
  ): () => void {
    return this.subscribeToRecordings(callback, { classSessionId });
  }

  // Get user's viewing history
  static async getUserViews(
    userId: string
  ): Promise<ApiResponse<RecordingView[]>> {
    try {
      const allViews = await StorageService.getArray<RecordingView>(
        this.VIEWS_STORAGE_KEY
      );
      const userViews = allViews.filter(view => view.userId === userId);

      return {
        data: userViews,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch user views',
        timestamp: new Date(),
      };
    }
  }

  // Update recording metadata (admin function)
  static async updateRecording(
    id: string,
    updates: Partial<Recording>
  ): Promise<ApiResponse<Recording | null>> {
    try {
      const recordingIndex = this.mockRecordings.findIndex(r => r.id === id);
      if (recordingIndex === -1) {
        return {
          data: null,
          success: false,
          error: 'Recording not found',
          timestamp: new Date(),
        };
      }

      this.mockRecordings[recordingIndex] = {
        ...this.mockRecordings[recordingIndex],
        ...updates,
        updatedAt: new Date(),
      };

      return {
        data: this.mockRecordings[recordingIndex],
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update recording',
        timestamp: new Date(),
      };
    }
  }

  // Get recordings by class session
  static async getRecordingsByClass(
    classSessionId: string
  ): Promise<ApiResponse<Recording[]>> {
    return this.getRecordings({ classSessionId });
  }

  // Get popular recordings
  static async getPopularRecordings(
    limit: number = 5
  ): Promise<ApiResponse<Recording[]>> {
    try {
      // Get all recordings including Zoom
      const allRecordingsResponse = await this.getRecordings({
        includeZoom: true,
        limit: 50, // Get more to find popular ones
      });

      if (!allRecordingsResponse.success) {
        // Fallback to mock data
        const sortedRecordings = [...this.mockRecordings]
          .sort((a, b) => b.viewCount - a.viewCount)
          .slice(0, limit);

        return {
          data: sortedRecordings,
          success: true,
          timestamp: new Date(),
        };
      }

      const sortedRecordings = allRecordingsResponse.data
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, limit);

      return {
        data: sortedRecordings,
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
            : 'Failed to fetch popular recordings',
        timestamp: new Date(),
      };
    }
  }

  // Zoom-specific methods

  /**
   * Sync Zoom cloud recordings
   */
  static async syncZoomRecordings(options?: {
    from?: Date;
    to?: Date;
    forceSync?: boolean;
  }): Promise<ApiResponse<Recording[]>> {
    try {
      return await zoomRecordingService.syncZoomRecordings(options);
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to sync Zoom recordings',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get only Zoom recordings
   */
  static async getZoomRecordings(
    options?: PaginationOptions & {
      meetingId?: string;
    }
  ): Promise<ApiResponse<Recording[]>> {
    return this.getRecordings({
      ...options,
      zoomOnly: true,
      includeZoom: true,
    });
  }

  /**
   * Get Zoom recording by Zoom recording ID
   */
  static async getZoomRecordingById(
    zoomRecordingId: string
  ): Promise<ApiResponse<Recording | null>> {
    try {
      return await zoomRecordingService.getZoomRecordingById(zoomRecordingId);
    } catch (error) {
      return {
        data: null,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get Zoom recording',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Clear Zoom recordings cache
   */
  static clearZoomCache(): void {
    zoomRecordingService.clearCache();
  }

  /**
   * Get Zoom sync status
   */
  static getZoomSyncStatus(): {
    lastSync: Date | null;
    recordingCount: number;
    cacheSize: number;
  } {
    return zoomRecordingService.getSyncStatus();
  }

  /**
   * Search recordings with metadata management
   */
  static async searchRecordingsWithMetadata(
    query: string,
    options?: {
      includeZoom?: boolean;
      tags?: string[];
      quality?: VideoQuality;
      dateRange?: { from: Date; to: Date };
    }
  ): Promise<ApiResponse<Recording[]>> {
    try {
      const searchOptions: SearchOptions = {
        query,
        fields: ['title', 'description', 'tags'],
        caseSensitive: false,
      };

      const paginationOptions = {
        includeZoom: options?.includeZoom !== false,
        limit: 50,
      };

      const searchResponse = await this.searchRecordings(
        searchOptions,
        paginationOptions
      );

      if (!searchResponse.success) {
        return searchResponse;
      }

      const filteredRecordings = searchResponse.data;

      // Apply additional filters
      if (options?.tags && options.tags.length > 0) {
        filteredRecordings = filteredRecordings.filter(recording =>
          options.tags!.some(tag => recording.tags.includes(tag))
        );
      }

      if (options?.quality) {
        filteredRecordings = filteredRecordings.filter(
          recording => recording.quality === options.quality
        );
      }

      if (options?.dateRange) {
        filteredRecordings = filteredRecordings.filter(recording => {
          const recordingDate = new Date(recording.createdAt);
          return (
            recordingDate >= options.dateRange!.from &&
            recordingDate <= options.dateRange!.to
          );
        });
      }

      return {
        data: filteredRecordings,
        success: true,

        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error ? error.message : 'Advanced search failed',
        timestamp: new Date(),
      };
    }
  }
}
