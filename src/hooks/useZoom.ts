import { useState, useEffect, useCallback, useRef } from 'react';
import { zoomService } from '../services/zoomService';
import { ZOOM_SDK_CONFIG, STUDENT_MEETING_SETTINGS } from '../config/zoom';
import type {
  ZoomMeetingConfig,
  ZoomError,
  ZoomMeetingSDKStatus,
  ZoomServiceResponse,
  ZoomAttendanceRecord,
} from '../types/zoom';

interface UseZoomOptions {
  autoInitialize?: boolean;
  trackAttendance?: boolean;
  onMeetingStart?: () => void;
  onMeetingEnd?: () => void;
  onError?: (error: ZoomError) => void;
}

interface UseZoomReturn {
  // State
  isInitialized: boolean;
  isJoining: boolean;
  isInMeeting: boolean;
  meetingStatus: ZoomMeetingSDKStatus | null;
  error: ZoomError | null;
  attendanceRecord: ZoomAttendanceRecord | null;

  // Actions
  initializeZoom: () => Promise<boolean>;
  joinMeeting: (config: Omit<ZoomMeetingConfig, 'role'>) => Promise<boolean>;
  leaveMeeting: () => Promise<boolean>;
  clearError: () => void;

  // Utilities
  generateMeetingSignature: (meetingNumber: string) => string;
}

/**
 * Custom hook for Zoom Meeting SDK integration
 * Provides easy-to-use interface for joining meetings and tracking attendance
 */
export const useZoom = (options: UseZoomOptions = {}): UseZoomReturn => {
  const {
    autoInitialize = true,
    trackAttendance = true,
    onMeetingStart,
    onMeetingEnd,
    onError,
  } = options;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [meetingStatus, setMeetingStatus] =
    useState<ZoomMeetingSDKStatus | null>(null);
  const [error, setError] = useState<ZoomError | null>(null);
  const [attendanceRecord, setAttendanceRecord] =
    useState<ZoomAttendanceRecord | null>(null);

  // Refs
  const currentMeetingId = useRef<string | null>(null);
  const joinTime = useRef<Date | null>(null);

  /**
   * Initialize Zoom SDK
   */
  const initializeZoom = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      if (zoomService.isSDKInitialized()) {
        setIsInitialized(true);
        return true;
      }

      const result = await zoomService.initialize(ZOOM_SDK_CONFIG);

      if (result.success) {
        setIsInitialized(true);
        setupEventHandlers();
        return true;
      } else {
        setError(
          result.error || {
            type: 'INITIALIZATION_ERROR',
            reason: 'Failed to initialize Zoom SDK',
            errorCode: -1,
            errorMessage: result.message || 'Unknown error',
          }
        );
        return false;
      }
    } catch (err) {
      const zoomError: ZoomError = {
        type: 'INITIALIZATION_ERROR',
        reason: 'Failed to initialize Zoom SDK',
        errorCode: -1,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      };
      setError(zoomError);
      if (onError) {
        onError(zoomError);
      }
      return false;
    }
  }, [onError]);

  /**
   * Set up Zoom SDK event handlers
   */
  const setupEventHandlers = useCallback(() => {
    // Meeting status changes
    zoomService.on('onMeetingStatus', (status: ZoomMeetingSDKStatus) => {
      setMeetingStatus(status);

      switch (status) {
        case 'connected':
          setIsInMeeting(true);
          setIsJoining(false);
          joinTime.current = new Date();
          if (onMeetingStart) {
            onMeetingStart();
          }

          // Track attendance - join
          if (trackAttendance && currentMeetingId.current) {
            trackAttendanceAction('join');
          }
          break;

        case 'disconnected':
          setIsInMeeting(false);
          setIsJoining(false);

          // Track attendance - leave
          if (trackAttendance && currentMeetingId.current) {
            trackAttendanceAction('leave');
          }

          if (onMeetingEnd) {
            onMeetingEnd();
          }
          break;

        case 'connecting':
          setIsJoining(true);
          break;

        case 'failed':
          setIsJoining(false);
          setIsInMeeting(false);
          const failError: ZoomError = {
            type: 'CONNECTION_ERROR',
            reason: 'Failed to connect to meeting',
            errorCode: -1,
            errorMessage: 'Meeting connection failed',
          };
          setError(failError);
          if (onError) {
            onError(failError);
          }
          break;
      }
    });

    // Connection changes
    zoomService.on('onConnectionChange', payload => {
      if (payload.state === 'Closed' && payload.reason !== 'ended by host') {
        const connectionError: ZoomError = {
          type: 'CONNECTION_ERROR',
          reason: 'Connection lost',
          errorCode: -1,
          errorMessage: payload.reason,
        };
        setError(connectionError);
        if (onError) {
          onError(connectionError);
        }
      }
    });

    // Meeting end
    zoomService.on('onMeetingEnd', payload => {
      setIsInMeeting(false);
      setIsJoining(false);
      currentMeetingId.current = null;

      if (onMeetingEnd) {
        onMeetingEnd();
      }
    });

    // Error handling
    zoomService.on('onError', (error: ZoomError) => {
      setError(error);
      setIsJoining(false);
      if (onError) {
        onError(error);
      }
    });
  }, [trackAttendance, onMeetingStart, onMeetingEnd, onError]);

  /**
   * Track attendance action (join/leave)
   */
  const trackAttendanceAction = useCallback(
    async (action: 'join' | 'leave') => {
      if (!currentMeetingId.current) {
        return;
      }

      try {
        // Get user ID from auth context or localStorage
        const userId = localStorage.getItem('userId') || 'anonymous';

        const result = await zoomService.trackAttendance(
          currentMeetingId.current,
          userId,
          action
        );

        if (result.success && result.data) {
          setAttendanceRecord(result.data);
        }
      } catch (err) {
        console.error('Failed to track attendance:', err);
      }
    },
    []
  );

  /**
   * Join a Zoom meeting
   */
  const joinMeeting = useCallback(
    async (config: Omit<ZoomMeetingConfig, 'role'>): Promise<boolean> => {
      try {
        setError(null);
        setIsJoining(true);

        if (!isInitialized) {
          const initSuccess = await initializeZoom();
          if (!initSuccess) {
            setIsJoining(false);
            return false;
          }
        }

        // Generate signature (in production, this should be done on server)
        const signature = generateMeetingSignature(config.meetingNumber);

        const meetingConfig: ZoomMeetingConfig = {
          ...config,
          ...STUDENT_MEETING_SETTINGS,
          signature,
          success: result => {
            currentMeetingId.current = config.meetingNumber;
            console.warn('Successfully joined meeting:', result);
          },
          error: error => {
            setError(error);
            setIsJoining(false);
            if (onError) {
              onError(error);
            }
          },
        };

        const result = await zoomService.joinMeeting(meetingConfig);

        if (!result.success) {
          setIsJoining(false);
          if (result.error) {
            setError(result.error);
            if (onError) {
              onError(result.error);
            }
          }
          return false;
        }

        return true;
      } catch (err) {
        const joinError: ZoomError = {
          type: 'JOIN_MEETING_ERROR',
          reason: 'Failed to join meeting',
          errorCode: -1,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        };
        setError(joinError);
        setIsJoining(false);
        if (onError) {
          onError(joinError);
        }
        return false;
      }
    },
    [isInitialized, initializeZoom, onError]
  );

  /**
   * Leave the current meeting
   */
  const leaveMeeting = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const result = await zoomService.leaveMeeting();

      if (result.success) {
        setIsInMeeting(false);
        currentMeetingId.current = null;
        return true;
      } else {
        if (result.error) {
          setError(result.error);
          if (onError) {
            onError(result.error);
          }
        }
        return false;
      }
    } catch (err) {
      const leaveError: ZoomError = {
        type: 'LEAVE_MEETING_ERROR',
        reason: 'Failed to leave meeting',
        errorCode: -1,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      };
      setError(leaveError);
      if (onError) {
        onError(leaveError);
      }
      return false;
    }
  }, [onError]);

  /**
   * Generate meeting signature
   */
  const generateMeetingSignature = useCallback(
    (meetingNumber: string): string => {
      try {
        return zoomService.generateSignature(
          meetingNumber,
          STUDENT_MEETING_SETTINGS.role
        );
      } catch (err) {
        console.error('Failed to generate signature:', err);
        return '';
      }
    },
    []
  );

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initializeZoom();
    }
  }, [autoInitialize, isInitialized, initializeZoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInMeeting) {
        leaveMeeting();
      }
    };
  }, [isInMeeting, leaveMeeting]);

  return {
    // State
    isInitialized,
    isJoining,
    isInMeeting,
    meetingStatus,
    error,
    attendanceRecord,

    // Actions
    initializeZoom,
    joinMeeting,
    leaveMeeting,
    clearError,

    // Utilities
    generateMeetingSignature,
  };
};
