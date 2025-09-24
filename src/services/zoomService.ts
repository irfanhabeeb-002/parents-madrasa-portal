// Dynamic import for Zoom SDK to avoid build issues
import type {
  ZoomMeetingConfig,
  ZoomInitConfig,
  ZoomMeetingInfo,
  ZoomRecordingInfo,
  ZoomError,
  ZoomAuthConfig,
  ZoomServiceResponse,
  ZoomMeetingListResponse,
  ZoomRecordingListResponse,
  ZoomAttendanceRecord,
  ZoomSDKEvents,
  ZoomMeetingSDKStatus,
  ZoomRole,
} from '../types/zoom';

/**
 * ZoomService - Handles all Zoom Meeting SDK integration
 * Provides meeting join functionality, recording management, and attendance tracking
 */
export class ZoomService {
  private static instance: ZoomService;
  private client: any | null = null;
  private isInitialized = false;
  private authConfig: ZoomAuthConfig | null = null;
  private currentMeetingId: string | null = null;
  private eventHandlers: Partial<ZoomSDKEvents> = {};

  // Singleton pattern
  public static getInstance(): ZoomService {
    if (!ZoomService.instance) {
      ZoomService.instance = new ZoomService();
    }
    return ZoomService.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Initialize the Zoom SDK with configuration
   */
  public async initialize(
    config: ZoomInitConfig
  ): Promise<ZoomServiceResponse<boolean>> {
    try {
      if (this.isInitialized) {
        return {
          success: true,
          data: true,
          message: 'Zoom SDK already initialized',
        };
      }

      // Initialize the Zoom Meeting SDK with dynamic import
      const ZoomModule = await import('@zoom/meetingsdk/embedded');
      const ZoomMtgEmbedded =
        ZoomModule.default || ZoomModule.ZoomMtgEmbedded || ZoomModule;
      this.client = ZoomMtgEmbedded.createClient();

      const initResult = await new Promise<boolean>((resolve, reject) => {
        if (!this.client) {
          reject(new Error('Failed to create Zoom client'));
          return;
        }

        this.client
          .init({
            debug: config.debug || false,
            leaveOnPageUnload: config.leaveOnPageUnload ?? true,
            showMeetingHeader: config.showMeetingHeader ?? false,
            disableInvite: config.disableInvite ?? true,
            disableCallOut: config.disableCallOut ?? true,
            disableRecord: config.disableRecord ?? true,
            disableJoinAudio: config.disableJoinAudio ?? false,
            audioPanelAlwaysOpen: config.audioPanelAlwaysOpen ?? false,
            showPureSharingContent: config.showPureSharingContent ?? false,
            isSupportAV: config.isSupportAV ?? true,
            isSupportChat: config.isSupportChat ?? true,
            isSupportQA: config.isSupportQA ?? false,
            isSupportCC: config.isSupportCC ?? false,
            screenShare: config.screenShare ?? false,
            rwcBackup: config.rwcBackup || '',
            videoDrag: config.videoDrag ?? false,
            sharingMode: config.sharingMode || 'both',
            videoHeader: config.videoHeader ?? false,
            isShowJoiningErrorDialog: config.isShowJoiningErrorDialog ?? true,
            disablePreview: config.disablePreview ?? false,
            disableSetting: config.disableSetting ?? true,
            disableShareAudioVideo: config.disableShareAudioVideo ?? true,
            meetingInfo: config.meetingInfo || [
              'topic',
              'host',
              'mn',
              'pwd',
              'telPwd',
              'invite',
              'participant',
              'dc',
              'enctype',
            ],
            disableReport: config.disableReport ?? true,
            meetingInfoDescription: config.meetingInfoDescription || '',
            disableVoIP: config.disableVoIP ?? false,
            disablePhoneAudio: config.disablePhoneAudio ?? false,
          })
          .then(() => {
            resolve(true);
          })
          .catch((error: any) => {
            reject(error);
          });
      });

      if (initResult) {
        this.isInitialized = true;
        this.setupEventListeners();
        return {
          success: true,
          data: true,
          message: 'Zoom SDK initialized successfully',
        };
      } else {
        throw new Error('Failed to initialize Zoom SDK');
      }
    } catch (error) {
      const zoomError: ZoomError = {
        _type: 'INITIALIZATION_ERROR',
        reason: 'Failed to initialize Zoom SDK',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
      return { success: false, error: zoomError };
    }
  }

  /**
   * Set up event listeners for Zoom SDK events
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // Meeting status events
    this.client.on(
      'meeting-status',
      (payload: { meetingStatus: ZoomMeetingSDKStatus }) => {
        if (this.eventHandlers.onMeetingStatus) {
          this.eventHandlers.onMeetingStatus(payload.meetingStatus);
        }
      }
    );

    // Connection change events
    this.client.on(
      'connection-change',
      (payload: { state: string; reason: string }) => {
        if (this.eventHandlers.onConnectionChange) {
          this.eventHandlers.onConnectionChange(payload);
        }
      }
    );

    // User events
    this.client.on('user-added', (payload: any) => {
      if (this.eventHandlers.onUserJoin) {
        this.eventHandlers.onUserJoin(payload);
      }
    });

    this.client.on('user-removed', (payload: any) => {
      if (this.eventHandlers.onUserLeave) {
        this.eventHandlers.onUserLeave(payload);
      }
    });

    this.client.on('user-updated', (payload: any) => {
      if (this.eventHandlers.onUserUpdate) {
        this.eventHandlers.onUserUpdate(payload);
      }
    });

    // Host change events
    this.client.on('host-change', (payload: { userId: string }) => {
      if (this.eventHandlers.onHostChange) {
        this.eventHandlers.onHostChange(payload);
      }
    });

    // Meeting end events
    this.client.on('meeting-ended', (payload: { reason: string }) => {
      this.currentMeetingId = null;
      if (this.eventHandlers.onMeetingEnd) {
        this.eventHandlers.onMeetingEnd(payload);
      }
    });

    // Recording events
    this.client.on('recording-start', () => {
      if (this.eventHandlers.onRecordingStart) {
        this.eventHandlers.onRecordingStart();
      }
    });

    this.client.on('recording-end', () => {
      if (this.eventHandlers.onRecordingEnd) {
        this.eventHandlers.onRecordingEnd();
      }
    });
  }

  /**
   * Set authentication configuration
   */
  public setAuthConfig(config: ZoomAuthConfig): void {
    this.authConfig = config;
  }

  /**
   * Register event handlers
   */
  public on<K extends keyof ZoomSDKEvents>(
    event: K,
    handler: ZoomSDKEvents[K]
  ): void {
    this.eventHandlers[event] = handler;
  }

  /**
   * Remove event handlers
   */
  public off<K extends keyof ZoomSDKEvents>(event: K): void {
    delete this.eventHandlers[event];
  }

  /**
   * Join a Zoom meeting
   */
  public async joinMeeting(
    config: ZoomMeetingConfig
  ): Promise<ZoomServiceResponse<boolean>> {
    try {
      if (!this.isInitialized || !this.client) {
        throw new Error('Zoom SDK not initialized. Call initialize() first.');
      }

      // Validate required parameters
      if (
        !config.meetingNumber ||
        !config.signature ||
        !config.apiKey ||
        !config.userName
      ) {
        throw new Error('Missing required meeting parameters');
      }

      const joinResult = await new Promise<boolean>((resolve, reject) => {
        if (!this.client) {
          reject(new Error('Zoom client not available'));
          return;
        }

        this.client.join({
          meetingNumber: config.meetingNumber,
          password: config.password || '',
          userName: config.userName,
          userEmail: config.userEmail || '',
          signature: config.signature,
          apiKey: config.apiKey,
          role: config.role || 0, // Default to attendee
          leaveUrl: config.leaveUrl || window.location.origin,
          success: (result: any) => {
            this.currentMeetingId = config.meetingNumber;
            if (config.success) config.success(result);
            resolve(true);
          },
          error: (error: any) => {
            if (config.error) config.error(error);
            reject(error);
          },
        });
      });

      return {
        success: true,
        data: joinResult,
        message: 'Successfully joined meeting',
      };
    } catch (error) {
      const zoomError: ZoomError = {
        _type: 'JOIN_MEETING_ERROR',
        reason: 'Failed to join meeting',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
      return { success: false, error: zoomError };
    }
  }

  /**
   * Leave the current meeting
   */
  public async leaveMeeting(): Promise<ZoomServiceResponse<boolean>> {
    try {
      if (!this.client || !this.currentMeetingId) {
        return {
          success: true,
          data: true,
          message: 'No active meeting to leave',
        };
      }

      await new Promise<void>((resolve, reject) => {
        if (!this.client) {
          reject(new Error('Zoom client not available'));
          return;
        }

        this.client.leave({
          success: () => {
            this.currentMeetingId = null;
            resolve();
          },
          error: (error: any) => {
            reject(error);
          },
        });
      });

      return {
        success: true,
        data: true,
        message: 'Successfully left meeting',
      };
    } catch (error) {
      const zoomError: ZoomError = {
        _type: 'LEAVE_MEETING_ERROR',
        reason: 'Failed to leave meeting',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
      return { success: false, error: zoomError };
    }
  }

  /**
   * Generate JWT signature for meeting authentication
   * Note: In production, this should be done on the server side for security
   */
  public generateSignature(meetingNumber: string, role: ZoomRole): string {
    if (!this.authConfig?.apiKey || !this.authConfig?.apiSecret) {
      throw new Error('API Key and Secret required for signature generation');
    }

    // This is a simplified version - in production, use proper JWT library
    // and generate signatures on the server side
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const payload = {
      iss: this.authConfig.apiKey,
      exp: exp,
      iat: iat,
      aud: 'zoom',
      appKey: this.authConfig.apiKey,
      tokenExp: exp,
      alg: 'HS256',
      mn: meetingNumber,
      role: role,
    };

    // Note: This is a placeholder - implement proper JWT signing
    // In production, call your backend API to generate the signature
    return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.signature`;
  }

  /**
   * Get current meeting status
   */
  public getCurrentMeetingId(): string | null {
    return this.currentMeetingId;
  }

  /**
   * Check if currently in a meeting
   */
  public isInMeeting(): boolean {
    return this.currentMeetingId !== null;
  }

  /**
   * Get SDK initialization status
   */
  public isSDKInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup and destroy the Zoom client
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.currentMeetingId) {
        await this.leaveMeeting();
      }

      if (this.client) {
        // Clear event handlers
        this.eventHandlers = {};
        this.client = null;
      }

      this.isInitialized = false;
      this.currentMeetingId = null;
    } catch (error) {
      console.error('Error during Zoom service cleanup:', error);
    }
  }

  // Mock API methods for Zoom REST API integration
  // These would typically call your backend API which then calls Zoom's REST API

  /**
   * Get list of meetings (mock implementation)
   * In production, this should call your backend API
   */
  public async getMeetings(
    userId: string,
    _type: 'scheduled' | 'live' | 'upcoming' = 'scheduled'
  ): Promise<ZoomServiceResponse<ZoomMeetingListResponse>> {
    try {
      // Mock implementation - replace with actual API call
      const mockMeetings: ZoomMeetingInfo[] = [
        {
          meetingId: '123456789',
          meetingNumber: '123456789',
          meetingTopic: 'Arabic Grammar Class',
          hostId: 'host123',
          hostName: 'Teacher Ahmad',
          startTime: new Date(),
          duration: 60,
          timezone: 'Asia/Kolkata',
          joinUrl: 'https://zoom.us/j/123456789',
          status: 'scheduled',
          participants: [],
          settings: {
            hostVideo: true,
            participantVideo: true,
            cnMeeting: false,
            inMeeting: false,
            joinBeforeHost: false,
            muteUponEntry: true,
            watermark: false,
            usePmi: false,
            approvalType: 2,
            registrationType: 1,
            audio: 'both',
            autoRecording: 'none',
            enforceLogin: false,
            closeRegistration: false,
            showShareButton: true,
            allowMultipleDevices: false,
            requestPermissionToUnmuteParticipants: false,
            showJoinInfo: false,
            deviceTesting: false,
            focusMode: false,
            enableDedicatedGalleryView: false,
            privateChat: true,
            autoSaveChat: false,
            entryExitChime: 'host',
            recordPlayOwnVoice: false,
            enableLiveStream: false,
          },
        },
      ];

      const response: ZoomMeetingListResponse = {
        page_count: 1,
        page_number: 1,
        page_size: 30,
        total_records: mockMeetings.length,
        meetings: mockMeetings,
      };

      return { success: true, data: response };
    } catch (error) {
      const zoomError: ZoomError = {
        _type: 'API_ERROR',
        reason: 'Failed to fetch meetings',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
      return { success: false, error: zoomError };
    }
  }

  /**
   * Get meeting recordings from Zoom Cloud API
   * Fetches recordings for a specific meeting or all recordings for the account
   */
  public async getRecordings(
    meetingId?: string,
    options?: {
      from?: Date;
      to?: Date;
      pageSize?: number;
      pageNumber?: number;
    }
  ): Promise<ZoomServiceResponse<ZoomRecordingListResponse>> {
    try {
      // In production, this should call your backend API which then calls Zoom REST API
      // For now, we'll use enhanced mock data with more realistic scenarios

      const mockRecordings: ZoomRecordingInfo[] = [
        {
          id: 'rec-zoom-001',
          meetingId: '123456789',
          meetingUuid: 'uuid-123-456-789',
          accountId: 'acc123',
          hostId: 'host123',
          topic: 'Arabic Grammar Class - Introduction',
          startTime: new Date(Date.now() - 86400000), // Yesterday
          duration: 55,
          totalSize: 1024 * 1024 * 150, // 150MB
          recordingCount: 2,
          shareUrl: 'https://zoom.us/rec/share/recording123',
          recordingFiles: [
            {
              id: 'file-video-123',
              meetingId: '123456789',
              recordingStart: new Date(Date.now() - 86400000),
              recordingEnd: new Date(Date.now() - 86400000 + 3300000), // 55 minutes later
              fileType: 'MP4',
              fileExtension: 'mp4',
              fileSize: 1024 * 1024 * 120, // 120MB
              playUrl: 'https://zoom.us/rec/play/video123',
              downloadUrl: 'https://zoom.us/rec/download/video123',
              status: 'completed',
              recordingType: 'shared_screen_with_speaker_view',
            },
            {
              id: 'file-audio-123',
              meetingId: '123456789',
              recordingStart: new Date(Date.now() - 86400000),
              recordingEnd: new Date(Date.now() - 86400000 + 3300000),
              fileType: 'M4A',
              fileExtension: 'm4a',
              fileSize: 1024 * 1024 * 30, // 30MB
              playUrl: 'https://zoom.us/rec/play/audio123',
              downloadUrl: 'https://zoom.us/rec/download/audio123',
              status: 'completed',
              recordingType: 'audio_only',
            },
          ],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000),
        },
        {
          id: 'rec-zoom-002',
          meetingId: '987654321',
          meetingUuid: 'uuid-987-654-321',
          accountId: 'acc123',
          hostId: 'host123',
          topic: 'Quran Recitation - Tajweed Rules',
          startTime: new Date(Date.now() - 172800000), // 2 days ago
          duration: 45,
          totalSize: 1024 * 1024 * 200, // 200MB
          recordingCount: 1,
          shareUrl: 'https://zoom.us/rec/share/recording456',
          recordingFiles: [
            {
              id: 'file-video-456',
              meetingId: '987654321',
              recordingStart: new Date(Date.now() - 172800000),
              recordingEnd: new Date(Date.now() - 172800000 + 2700000), // 45 minutes later
              fileType: 'MP4',
              fileExtension: 'mp4',
              fileSize: 1024 * 1024 * 200,
              playUrl: 'https://zoom.us/rec/play/video456',
              downloadUrl: 'https://zoom.us/rec/download/video456',
              status: 'completed',
              recordingType: 'speaker_view',
            },
          ],
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 172800000),
        },
        {
          id: 'rec-zoom-003',
          meetingId: '555666777',
          meetingUuid: 'uuid-555-666-777',
          accountId: 'acc123',
          hostId: 'host123',
          topic: 'Islamic History - Early Caliphate',
          startTime: new Date(Date.now() - 259200000), // 3 days ago
          duration: 60,
          totalSize: 1024 * 1024 * 180, // 180MB
          recordingCount: 1,
          shareUrl: 'https://zoom.us/rec/share/recording789',
          recordingFiles: [
            {
              id: 'file-video-789',
              meetingId: '555666777',
              recordingStart: new Date(Date.now() - 259200000),
              recordingEnd: new Date(Date.now() - 259200000 + 3600000), // 60 minutes later
              fileType: 'MP4',
              fileExtension: 'mp4',
              fileSize: 1024 * 1024 * 180,
              playUrl: 'https://zoom.us/rec/play/video789',
              downloadUrl: 'https://zoom.us/rec/download/video789',
              status: 'completed',
              recordingType: 'shared_screen_with_gallery_view',
            },
          ],
          createdAt: new Date(Date.now() - 259200000),
          updatedAt: new Date(Date.now() - 259200000),
        },
      ];

      // Filter by meetingId if provided
      const filteredRecordings = meetingId
        ? mockRecordings.filter(rec => rec.meetingId === meetingId)
        : mockRecordings;

      // Apply date filters if provided
      if (options?.from) {
        filteredRecordings = filteredRecordings.filter(
          rec => new Date(rec.startTime) >= options.from!
        );
      }
      if (options?.to) {
        filteredRecordings = filteredRecordings.filter(
          rec => new Date(rec.startTime) <= options.to!
        );
      }

      // Apply pagination
      const pageSize = options?.pageSize || 30;
      const pageNumber = options?.pageNumber || 1;
      const startIndex = (pageNumber - 1) * pageSize;
      const paginatedRecordings = filteredRecordings.slice(
        startIndex,
        startIndex + pageSize
      );

      const response: ZoomRecordingListResponse = {
        page_count: Math.ceil(filteredRecordings.length / pageSize),
        page_number: pageNumber,
        page_size: pageSize,
        total_records: filteredRecordings.length,
        meetings: paginatedRecordings,
      };

      return { success: true, data: response };
    } catch (error) {
      const zoomError: ZoomError = {
        _type: 'API_ERROR',
        reason: 'Failed to fetch recordings',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
      return { success: false, error: zoomError };
    }
  }

  /**
   * Get recording details by recording ID
   */
  public async getRecordingById(
    recordingId: string
  ): Promise<ZoomServiceResponse<ZoomRecordingInfo | null>> {
    try {
      const recordingsResponse = await this.getRecordings();
      if (!recordingsResponse.success || !recordingsResponse.data) {
        return { success: false, error: recordingsResponse.error };
      }

      const recording = recordingsResponse.data.meetings.find(
        rec => rec.id === recordingId
      );
      return {
        success: true,
        data: recording || null,
        message: recording ? 'Recording found' : 'Recording not found',
      };
    } catch (error) {
      const zoomError: ZoomError = {
        _type: 'API_ERROR',
        reason: 'Failed to fetch recording details',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
      return { success: false, error: zoomError };
    }
  }

  /**
   * Search recordings by topic or meeting ID
   */
  public async searchRecordings(
    query: string,
    options?: {
      from?: Date;
      to?: Date;
      pageSize?: number;
      pageNumber?: number;
    }
  ): Promise<ZoomServiceResponse<ZoomRecordingListResponse>> {
    try {
      const recordingsResponse = await this.getRecordings(undefined, options);
      if (!recordingsResponse.success || !recordingsResponse.data) {
        return recordingsResponse;
      }

      const searchTerm = query.toLowerCase();
      const filteredRecordings = recordingsResponse.data.meetings.filter(
        recording =>
          recording.topic.toLowerCase().includes(searchTerm) ||
          recording.meetingId.includes(query) ||
          recording.id.toLowerCase().includes(searchTerm)
      );

      const response: ZoomRecordingListResponse = {
        ...recordingsResponse.data,
        meetings: filteredRecordings,
        total_records: filteredRecordings.length,
        page_count: Math.ceil(
          filteredRecordings.length / (options?.pageSize || 30)
        ),
      };

      return { success: true, data: response };
    } catch (error) {
      const zoomError: ZoomError = {
        _type: 'API_ERROR',
        reason: 'Failed to search recordings',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
      return { success: false, error: zoomError };
    }
  }

  /**
   * Track attendance for a meeting
   */
  public async trackAttendance(
    meetingId: string,
    userId: string,
    action: 'join' | 'leave'
  ): Promise<ZoomServiceResponse<ZoomAttendanceRecord>> {
    try {
      const attendanceRecord: ZoomAttendanceRecord = {
        meetingId,
        meetingUuid: `uuid-${meetingId}`,
        userId,
        userName: 'Student Name', // This would come from user context
        joinTime:
          action === 'join' ? new Date() : new Date(Date.now() - 1800000), // 30 minutes ago if leaving
        leaveTime: action === 'leave' ? new Date() : undefined,
        duration: action === 'leave' ? 1800 : 0, // 30 minutes if leaving
        isHost: false,
        deviceType: 'web',
      };

      // In production, save this to your database
      console.warn('Attendance tracked:', attendanceRecord);

      return { success: true, data: attendanceRecord };
    } catch (error) {
      const zoomError: ZoomError = {
        _type: 'ATTENDANCE_ERROR',
        reason: 'Failed to track attendance',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
      return { success: false, error: zoomError };
    }
  }
}

// Export singleton instance
export const zoomService = ZoomService.getInstance();

// Export default
export default zoomService;
