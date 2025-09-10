import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';
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
  ZoomRole
} from '../types/zoom';

/**
 * ZoomService - Handles all Zoom Meeting SDK integration
 * Provides meeting join functionality, recording management, and attendance tracking
 */
export class ZoomService {
  private static instance: ZoomService;
  private client: typeof ZoomMtgEmbedded | null = null;
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
  public async initialize(config: ZoomInitConfig): Promise<ZoomServiceResponse<boolean>> {
    try {
      if (this.isInitialized) {
        return { success: true, data: true, message: 'Zoom SDK already initialized' };
      }

      // Initialize the Zoom Meeting SDK
      this.client = ZoomMtgEmbedded.createClient();

      const initResult = await new Promise<boolean>((resolve, reject) => {
        if (!this.client) {
          reject(new Error('Failed to create Zoom client'));
          return;
        }

        this.client.init({
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
          meetingInfo: config.meetingInfo || ['topic', 'host', 'mn', 'pwd', 'telPwd', 'invite', 'participant', 'dc', 'enctype'],
          disableReport: config.disableReport ?? true,
          meetingInfoDescription: config.meetingInfoDescription || '',
          disableVoIP: config.disableVoIP ?? false,
          disablePhoneAudio: config.disablePhoneAudio ?? false,
        }).then(() => {
          resolve(true);
        }).catch((error: any) => {
          reject(error);
        });
      });

      if (initResult) {
        this.isInitialized = true;
        this.setupEventListeners();
        return { success: true, data: true, message: 'Zoom SDK initialized successfully' };
      } else {
        throw new Error('Failed to initialize Zoom SDK');
      }
    } catch (error) {
      const zoomError: ZoomError = {
        type: 'INITIALIZATION_ERROR',
        reason: 'Failed to initialize Zoom SDK',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
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
    this.client.on('meeting-status', (payload: { meetingStatus: ZoomMeetingSDKStatus }) => {
      if (this.eventHandlers.onMeetingStatus) {
        this.eventHandlers.onMeetingStatus(payload.meetingStatus);
      }
    });

    // Connection change events
    this.client.on('connection-change', (payload: { state: string; reason: string }) => {
      if (this.eventHandlers.onConnectionChange) {
        this.eventHandlers.onConnectionChange(payload);
      }
    });

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
  public on<K extends keyof ZoomSDKEvents>(event: K, handler: ZoomSDKEvents[K]): void {
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
  public async joinMeeting(config: ZoomMeetingConfig): Promise<ZoomServiceResponse<boolean>> {
    try {
      if (!this.isInitialized || !this.client) {
        throw new Error('Zoom SDK not initialized. Call initialize() first.');
      }

      // Validate required parameters
      if (!config.meetingNumber || !config.signature || !config.apiKey || !config.userName) {
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
          }
        });
      });

      return { success: true, data: joinResult, message: 'Successfully joined meeting' };
    } catch (error) {
      const zoomError: ZoomError = {
        type: 'JOIN_MEETING_ERROR',
        reason: 'Failed to join meeting',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
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
        return { success: true, data: true, message: 'No active meeting to leave' };
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
          }
        });
      });

      return { success: true, data: true, message: 'Successfully left meeting' };
    } catch (error) {
      const zoomError: ZoomError = {
        type: 'LEAVE_MEETING_ERROR',
        reason: 'Failed to leave meeting',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
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
      typ: 'JWT'
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
      role: role
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
  public async getMeetings(userId: string, type: 'scheduled' | 'live' | 'upcoming' = 'scheduled'): Promise<ZoomServiceResponse<ZoomMeetingListResponse>> {
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
            enableLiveStream: false
          }
        }
      ];

      const response: ZoomMeetingListResponse = {
        page_count: 1,
        page_number: 1,
        page_size: 30,
        total_records: mockMeetings.length,
        meetings: mockMeetings
      };

      return { success: true, data: response };
    } catch (error) {
      const zoomError: ZoomError = {
        type: 'API_ERROR',
        reason: 'Failed to fetch meetings',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      return { success: false, error: zoomError };
    }
  }

  /**
   * Get meeting recordings (mock implementation)
   * In production, this should call your backend API
   */
  public async getRecordings(meetingId?: string): Promise<ZoomServiceResponse<ZoomRecordingListResponse>> {
    try {
      // Mock implementation - replace with actual API call
      const mockRecordings: ZoomRecordingInfo[] = [
        {
          id: 'rec123',
          meetingId: '123456789',
          meetingUuid: 'uuid123',
          accountId: 'acc123',
          hostId: 'host123',
          topic: 'Arabic Grammar Class Recording',
          startTime: new Date(Date.now() - 86400000), // Yesterday
          duration: 55,
          totalSize: 1024 * 1024 * 100, // 100MB
          recordingCount: 1,
          shareUrl: 'https://zoom.us/rec/share/recording123',
          recordingFiles: [
            {
              id: 'file123',
              meetingId: '123456789',
              recordingStart: new Date(Date.now() - 86400000),
              recordingEnd: new Date(Date.now() - 86400000 + 3300000), // 55 minutes later
              fileType: 'MP4',
              fileExtension: 'mp4',
              fileSize: 1024 * 1024 * 100,
              playUrl: 'https://zoom.us/rec/play/recording123',
              downloadUrl: 'https://zoom.us/rec/download/recording123',
              status: 'completed',
              recordingType: 'shared_screen_with_speaker_view'
            }
          ],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000)
        }
      ];

      const response: ZoomRecordingListResponse = {
        page_count: 1,
        page_number: 1,
        page_size: 30,
        total_records: mockRecordings.length,
        meetings: mockRecordings
      };

      return { success: true, data: response };
    } catch (error) {
      const zoomError: ZoomError = {
        type: 'API_ERROR',
        reason: 'Failed to fetch recordings',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      return { success: false, error: zoomError };
    }
  }

  /**
   * Track attendance for a meeting
   */
  public async trackAttendance(meetingId: string, userId: string, action: 'join' | 'leave'): Promise<ZoomServiceResponse<ZoomAttendanceRecord>> {
    try {
      const attendanceRecord: ZoomAttendanceRecord = {
        meetingId,
        meetingUuid: `uuid-${meetingId}`,
        userId,
        userName: 'Student Name', // This would come from user context
        joinTime: action === 'join' ? new Date() : new Date(Date.now() - 1800000), // 30 minutes ago if leaving
        leaveTime: action === 'leave' ? new Date() : undefined,
        duration: action === 'leave' ? 1800 : 0, // 30 minutes if leaving
        isHost: false,
        deviceType: 'web'
      };

      // In production, save this to your database
      console.log('Attendance tracked:', attendanceRecord);

      return { success: true, data: attendanceRecord };
    } catch (error) {
      const zoomError: ZoomError = {
        type: 'ATTENDANCE_ERROR',
        reason: 'Failed to track attendance',
        errorCode: -1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      return { success: false, error: zoomError };
    }
  }
}

// Export singleton instance
export const zoomService = ZoomService.getInstance();

// Export default
export default zoomService;