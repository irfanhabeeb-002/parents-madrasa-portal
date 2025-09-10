import { Recording, RecordingMetadata, VideoQuality, ProcessingStatus } from '../types/recording';
import { ZoomRecordingInfo, ZoomRecordingFile, ZoomServiceResponse } from '../types/zoom';
import { ApiResponse, PaginationOptions, SearchOptions } from '../types/common';
import { zoomService } from './zoomService';
import { StorageService } from './storageService';
import { FirebaseService } from './firebaseService';
import { FIREBASE_COLLECTIONS } from '../types/firebase';

/**
 * ZoomRecordingService - Integrates Zoom cloud recordings with the application
 * Handles fetching, syncing, and managing Zoom recordings
 */
export class ZoomRecordingService extends FirebaseService {
  private static instance: ZoomRecordingService;
  private static readonly SYNC_CACHE_KEY = 'zoom_recordings_sync';
  private static readonly METADATA_CACHE_KEY = 'zoom_recordings_metadata';

  constructor() {
    super(FIREBASE_COLLECTIONS.RECORDINGS);
  }

  static getInstance(): ZoomRecordingService {
    if (!ZoomRecordingService.instance) {
      ZoomRecordingService.instance = new ZoomRecordingService();
    }
    return ZoomRecordingService.instance;
  }

  /**
   * Sync Zoom cloud recordings with local database
   * Fetches latest recordings from Zoom and updates local storage
   */
  public async syncZoomRecordings(options?: {
    from?: Date;
    to?: Date;
    forceSync?: boolean;
  }): Promise<ApiResponse<Recording[]>> {
    try {
      // Check if we need to sync (avoid frequent API calls)
      const lastSync = StorageService.get<number>(`${ZoomRecordingService.SYNC_CACHE_KEY}_timestamp`);
      const syncInterval = 5 * 60 * 1000; // 5 minutes
      
      if (!options?.forceSync && lastSync && (Date.now() - lastSync) < syncInterval) {
        // Return cached recordings if sync is recent
        const cachedRecordings = StorageService.getArray<Recording>(`${ZoomRecordingService.SYNC_CACHE_KEY}_data`);
        if (cachedRecordings.length > 0) {
          return {
            data: cachedRecordings,
            success: true,
            timestamp: new Date()
          };
        }
      }

      // Fetch recordings from Zoom
      const zoomResponse = await zoomService.getRecordings(undefined, {
        from: options?.from,
        to: options?.to,
        pageSize: 100 // Get more recordings in one call
      });

      if (!zoomResponse.success || !zoomResponse.data) {
        return {
          data: [],
          success: false,
          error: zoomResponse.error?.errorMessage || 'Failed to fetch Zoom recordings',
          timestamp: new Date()
        };
      }

      // Convert Zoom recordings to application format
      const recordings: Recording[] = await Promise.all(
        zoomResponse.data.meetings.map(zoomRec => this.convertZoomRecordingToRecording(zoomRec))
      );

      // Cache the results
      StorageService.set(`${ZoomRecordingService.SYNC_CACHE_KEY}_data`, recordings);
      StorageService.set(`${ZoomRecordingService.SYNC_CACHE_KEY}_timestamp`, Date.now());

      // Store metadata for search and filtering
      const metadata = recordings.map(rec => ({
        id: rec.id,
        title: rec.title,
        tags: rec.tags,
        duration: rec.duration,
        createdAt: rec.createdAt
      }));
      StorageService.set(ZoomRecordingService.METADATA_CACHE_KEY, metadata);

      return {
        data: recordings,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Zoom recordings',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get Zoom recordings with automatic sync
   */
  public async getZoomRecordings(options?: PaginationOptions & {
    autoSync?: boolean;
    meetingId?: string;
  }): Promise<ApiResponse<Recording[]>> {
    try {
      // Auto-sync if requested (default: true)
      if (options?.autoSync !== false) {
        await this.syncZoomRecordings();
      }

      // Get cached recordings
      let recordings = StorageService.getArray<Recording>(`${ZoomRecordingService.SYNC_CACHE_KEY}_data`);

      // Filter by meeting ID if provided
      if (options?.meetingId) {
        recordings = recordings.filter(rec => 
          rec.metadata?.zoomRecordingId === options.meetingId ||
          rec.classSessionId === options.meetingId
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
      const limit = options?.limit || 20;
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
        error: error instanceof Error ? error.message : 'Failed to get Zoom recordings',
        timestamp: new Date()
      };
    }
  }

  /**
   * Search Zoom recordings
   */
  public async searchZoomRecordings(
    searchOptions: SearchOptions,
    paginationOptions?: PaginationOptions
  ): Promise<ApiResponse<Recording[]>> {
    try {
      // Ensure we have fresh data
      await this.syncZoomRecordings();

      const { query, fields = ['title', 'description', 'tags'], caseSensitive = false } = searchOptions;
      const searchTerm = caseSensitive ? query : query.toLowerCase();

      let recordings = StorageService.getArray<Recording>(`${ZoomRecordingService.SYNC_CACHE_KEY}_data`);

      // Filter recordings based on search criteria
      const filteredRecordings = recordings.filter(recording => {
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
      const limit = paginationOptions?.limit || 20;
      const paginatedRecordings = filteredRecordings.slice(offset, offset + limit);

      return {
        data: paginatedRecordings,
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

  /**
   * Get recording by Zoom recording ID
   */
  public async getZoomRecordingById(zoomRecordingId: string): Promise<ApiResponse<Recording | null>> {
    try {
      const zoomResponse = await zoomService.getRecordingById(zoomRecordingId);
      
      if (!zoomResponse.success || !zoomResponse.data) {
        return {
          data: null,
          success: false,
          error: zoomResponse.error?.errorMessage || 'Recording not found',
          timestamp: new Date()
        };
      }

      const recording = await this.convertZoomRecordingToRecording(zoomResponse.data);
      
      return {
        data: recording,
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get recording',
        timestamp: new Date()
      };
    }
  }



  /**
   * Convert Zoom recording to application Recording format
   */
  private async convertZoomRecordingToRecording(zoomRec: ZoomRecordingInfo): Promise<Recording> {
    // Find the main video file (prefer MP4 with speaker view)
    const mainVideoFile = this.findMainVideoFile(zoomRec.recordingFiles);
    
    const recording: Recording = {
      id: `zoom-${zoomRec.id}`,
      classSessionId: zoomRec.meetingId,
      title: zoomRec.topic,
      description: `Zoom recording from ${zoomRec.startTime instanceof Date ? zoomRec.startTime.toLocaleDateString() : new Date(zoomRec.startTime).toLocaleDateString()}`,
      thumbnailUrl: this.generateThumbnailUrl(zoomRec.id),
      videoUrl: mainVideoFile?.playUrl || zoomRec.shareUrl,
      duration: zoomRec.duration * 60, // Convert minutes to seconds
      fileSize: zoomRec.totalSize,
      quality: this.determineQualityFromSize(zoomRec.totalSize, zoomRec.duration),
      format: this.getFormatFromFile(mainVideoFile),
      isProcessed: true,
      processingStatus: 'completed',
      viewCount: 0,
      downloadCount: 0,
      tags: this.extractTagsFromTopic(zoomRec.topic),
      chapters: [], // Could be extracted from recording if available
      captions: [], // Could be generated from Zoom transcripts
      metadata: {
        resolution: this.estimateResolution(zoomRec.totalSize, zoomRec.duration),
        bitrate: Math.round((zoomRec.totalSize * 8) / (zoomRec.duration * 60 * 1000)), // Estimate bitrate
        fps: 30, // Default assumption
        codec: 'H.264', // Default for Zoom
        uploadedBy: 'zoom',
        originalFileName: `${zoomRec.topic}.mp4`,
        zoomRecordingId: zoomRec.id,
        zoomMeetingId: zoomRec.meetingId,
        zoomMeetingUuid: zoomRec.meetingUuid,
        zoomShareUrl: zoomRec.shareUrl
      } as RecordingMetadata & {
        zoomRecordingId?: string;
        zoomMeetingId?: string;
        zoomMeetingUuid?: string;
        zoomShareUrl?: string;
      },
      createdAt: zoomRec.startTime instanceof Date ? zoomRec.startTime : new Date(zoomRec.startTime),
      updatedAt: zoomRec.updatedAt instanceof Date ? zoomRec.updatedAt : new Date(zoomRec.updatedAt)
    };

    return recording;
  }

  /**
   * Find the main video file from Zoom recording files
   */
  private findMainVideoFile(files: ZoomRecordingFile[]): ZoomRecordingFile | undefined {
    // Priority order: MP4 with speaker view > MP4 with gallery view > any MP4 > any video
    const priorities = [
      'shared_screen_with_speaker_view',
      'speaker_view',
      'shared_screen_with_gallery_view',
      'gallery_view',
      'shared_screen'
    ];

    for (const priority of priorities) {
      const file = files.find(f => 
        f.fileType === 'MP4' && 
        f.recordingType === priority &&
        f.status === 'completed'
      );
      if (file) return file;
    }

    // Fallback to any MP4 file
    return files.find(f => f.fileType === 'MP4' && f.status === 'completed');
  }

  /**
   * Generate thumbnail URL for Zoom recording
   */
  private generateThumbnailUrl(recordingId: string): string {
    // In production, this would generate actual thumbnails
    return `/api/zoom/thumbnails/${recordingId}.jpg`;
  }

  /**
   * Determine video quality based on file size and duration
   */
  private determineQualityFromSize(sizeBytes: number, durationMinutes: number): VideoQuality {
    const sizeMB = sizeBytes / (1024 * 1024);
    const mbPerMinute = sizeMB / durationMinutes;

    if (mbPerMinute > 15) return 'hd';
    if (mbPerMinute > 8) return 'high';
    if (mbPerMinute > 4) return 'medium';
    return 'low';
  }

  /**
   * Get video format from file
   */
  private getFormatFromFile(file?: ZoomRecordingFile): 'mp4' | 'webm' | 'mov' {
    if (!file) return 'mp4';
    
    const extension = file.fileExtension.toLowerCase();
    if (extension === 'webm') return 'webm';
    if (extension === 'mov') return 'mov';
    return 'mp4';
  }

  /**
   * Estimate resolution based on file size and duration
   */
  private estimateResolution(sizeBytes: number, durationMinutes: number): string {
    const sizeMB = sizeBytes / (1024 * 1024);
    const mbPerMinute = sizeMB / durationMinutes;

    if (mbPerMinute > 20) return '1920x1080';
    if (mbPerMinute > 10) return '1280x720';
    if (mbPerMinute > 5) return '854x480';
    return '640x360';
  }

  /**
   * Extract tags from meeting topic
   */
  private extractTagsFromTopic(topic: string): string[] {
    const tags: string[] = [];
    const topicLower = topic.toLowerCase();

    // Common Islamic education topics
    if (topicLower.includes('quran') || topicLower.includes('qur\'an')) tags.push('quran');
    if (topicLower.includes('arabic')) tags.push('arabic');
    if (topicLower.includes('grammar')) tags.push('grammar');
    if (topicLower.includes('history')) tags.push('history');
    if (topicLower.includes('islamic')) tags.push('islamic');
    if (topicLower.includes('recitation')) tags.push('recitation');
    if (topicLower.includes('tajweed')) tags.push('tajweed');
    if (topicLower.includes('hadith')) tags.push('hadith');
    if (topicLower.includes('fiqh')) tags.push('fiqh');
    if (topicLower.includes('seerah')) tags.push('seerah');

    // Add 'zoom' tag to identify source
    tags.push('zoom');

    return tags;
  }



  /**
   * Clear cached recordings (force refresh)
   */
  public clearCache(): void {
    StorageService.remove(`${ZoomRecordingService.SYNC_CACHE_KEY}_data`);
    StorageService.remove(`${ZoomRecordingService.SYNC_CACHE_KEY}_timestamp`);
    StorageService.remove(ZoomRecordingService.METADATA_CACHE_KEY);
  }

  /**
   * Get sync status
   */
  public getSyncStatus(): {
    lastSync: Date | null;
    recordingCount: number;
    cacheSize: number;
  } {
    const lastSync = StorageService.get<number>(`${ZoomRecordingService.SYNC_CACHE_KEY}_timestamp`);
    const recordings = StorageService.getArray<Recording>(`${ZoomRecordingService.SYNC_CACHE_KEY}_data`);
    
    return {
      lastSync: lastSync ? new Date(lastSync) : null,
      recordingCount: recordings.length,
      cacheSize: StorageService.getStorageSize()
    };
  }
}

// Export singleton instance
export const zoomRecordingService = ZoomRecordingService.getInstance();