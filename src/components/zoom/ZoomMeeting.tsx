import React, { useEffect, useRef, useState } from 'react';
import { useZoom } from '../../hooks/useZoom';
import { AccessibleButton } from '../ui/AccessibleButton';
import { AlertBanner } from '../ui/AlertBanner';
import {
  ZOOM_MEETING_CONTAINER,
  ZOOM_ERROR_MESSAGES,
  MEETING_STATUS_MESSAGES,
} from '../../config/zoom';
import type { ClassSession } from '../../types/class';
import type { ZoomError } from '../../types/zoom';

interface ZoomMeetingProps {
  classSession: ClassSession;
  userName: string;
  userEmail?: string;
  onMeetingStart?: () => void;
  onMeetingEnd?: () => void;
  onAttendanceTracked?: (duration: number) => void;
  className?: string;
}

/**
 * ZoomMeeting Component
 * Embeds Zoom Meeting SDK and provides meeting controls
 */
export const ZoomMeeting: React.FC<ZoomMeetingProps> = ({
  classSession,
  userName,
  userEmail,
  onMeetingStart,
  onMeetingEnd,
  onAttendanceTracked,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [joinTime, setJoinTime] = useState<Date | null>(null);

  const {
    isInitialized,
    isJoining,
    isInMeeting,
    meetingStatus,
    error,
    attendanceRecord,
    initializeZoom,
    joinMeeting,
    leaveMeeting,
    clearError,
  } = useZoom({
    autoInitialize: true,
    trackAttendance: true,
    onMeetingStart: () => {
      setJoinTime(new Date());
      setShowControls(false);
      if (onMeetingStart) onMeetingStart();
    },
    onMeetingEnd: () => {
      setShowControls(true);
      if (joinTime && onAttendanceTracked) {
        const duration = Math.floor(
          (new Date().getTime() - joinTime.getTime()) / 1000
        );
        onAttendanceTracked(duration);
      }
      setJoinTime(null);
      if (onMeetingEnd) onMeetingEnd();
    },
    onError: (zoomError: ZoomError) => {
      console.error('Zoom error:', zoomError);
      setShowControls(true);
    },
  });

  /**
   * Handle joining the meeting
   */
  const handleJoinMeeting = async () => {
    if (!classSession.zoomMeetingId) {
      console.error('No Zoom meeting ID provided');
      return;
    }

    clearError();

    const success = await joinMeeting({
      meetingNumber: classSession.zoomMeetingId,
      password: classSession.zoomPassword,
      userName,
      userEmail,
      apiKey: process.env.VITE_ZOOM_API_KEY || '',
    });

    if (!success) {
      console.error('Failed to join meeting');
    }
  };

  /**
   * Handle leaving the meeting
   */
  const handleLeaveMeeting = async () => {
    const success = await leaveMeeting();
    if (success) {
      setShowControls(true);
    }
  };

  /**
   * Get error message in appropriate language
   */
  const getErrorMessage = (zoomError: ZoomError): string => {
    const messages = ZOOM_ERROR_MESSAGES;

    switch (zoomError.type) {
      case 'INITIALIZATION_ERROR':
        return messages.INITIALIZATION_FAILED.en;
      case 'JOIN_MEETING_ERROR':
        return messages.JOIN_FAILED.en;
      case 'CONNECTION_ERROR':
        return messages.NETWORK_ERROR.en;
      default:
        return zoomError.errorMessage || 'An unknown error occurred';
    }
  };

  /**
   * Get status message in appropriate language
   */
  const getStatusMessage = (): string => {
    if (!meetingStatus) return '';

    const messages = MEETING_STATUS_MESSAGES[meetingStatus];
    return messages ? messages.en : '';
  };

  /**
   * Check if meeting is currently live
   */
  const isMeetingLive = (): boolean => {
    return classSession.isLive && classSession.status === 'live';
  };

  /**
   * Check if meeting is scheduled for future
   */
  const isMeetingScheduled = (): boolean => {
    const now = new Date();
    const scheduledTime = new Date(classSession.scheduledAt);
    return scheduledTime > now && classSession.status === 'scheduled';
  };

  /**
   * Get meeting time display
   */
  const getMeetingTimeDisplay = (): string => {
    const scheduledTime = new Date(classSession.scheduledAt);
    return scheduledTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Set up container styling
  useEffect(() => {
    if (containerRef.current && isInMeeting) {
      Object.assign(
        containerRef.current.style,
        ZOOM_MEETING_CONTAINER.containerStyle
      );
    }
  }, [isInMeeting]);

  return (
    <div className={`zoom-meeting-wrapper ${className}`}>
      {/* Error Banner */}
      {error && (
        <AlertBanner
          type="error"
          message={getErrorMessage(error)}
          onDismiss={clearError}
          className="mb-4"
        />
      )}

      {/* Status Banner */}
      {meetingStatus && !error && (
        <AlertBanner
          type={meetingStatus === 'connected' ? 'success' : 'info'}
          message={getStatusMessage()}
          className="mb-4"
        />
      )}

      {/* Meeting Container */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        {/* Zoom Meeting Container */}
        <div
          ref={containerRef}
          id={ZOOM_MEETING_CONTAINER.containerId}
          className={`w-full transition-all duration-300 ${
            isInMeeting ? 'h-[70vh] min-h-[400px]' : 'h-64'
          }`}
          style={{
            backgroundColor: '#000000',
            display: isInMeeting ? 'block' : 'flex',
            alignItems: isInMeeting ? 'stretch' : 'center',
            justifyContent: isInMeeting ? 'stretch' : 'center',
          }}
        >
          {/* Pre-meeting UI */}
          {!isInMeeting && showControls && (
            <div className="text-center text-white p-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {classSession.title}
                </h3>
                <p className="text-gray-300 mb-1">
                  Instructor: {classSession.instructor}
                </p>
                <p className="text-gray-400 text-sm">
                  Scheduled: {getMeetingTimeDisplay()}
                </p>
              </div>

              {/* Meeting Status */}
              <div className="mb-6">
                {isMeetingLive() && (
                  <div className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium mb-4">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    LIVE
                  </div>
                )}

                {isMeetingScheduled() && (
                  <div className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium mb-4">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    SCHEDULED
                  </div>
                )}

                {classSession.status === 'completed' && (
                  <div className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-full text-sm font-medium mb-4">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    COMPLETED
                  </div>
                )}
              </div>

              {/* Join Button */}
              {(isMeetingLive() || isMeetingScheduled()) && (
                <div className="space-y-4">
                  <AccessibleButton
                    onClick={handleJoinMeeting}
                    disabled={isJoining || !isInitialized}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
                    ariaLabel="Join the live class meeting"
                  >
                    {isJoining ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Joining...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Join Meeting
                      </div>
                    )}
                  </AccessibleButton>

                  {!isInitialized && (
                    <p className="text-gray-400 text-sm">
                      Initializing Zoom...
                    </p>
                  )}
                </div>
              )}

              {classSession.status === 'completed' && (
                <p className="text-gray-400">
                  This class has ended. Check recordings for playback.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Meeting Controls Overlay */}
        {isInMeeting && (
          <div className="absolute top-4 right-4 z-10">
            <AccessibleButton
              onClick={handleLeaveMeeting}
              variant="danger"
              size="sm"
              ariaLabel="Leave the meeting"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Leave
              <span className="block text-xs" lang="ml">
                പുറത്തുകടക്കുക
              </span>
            </AccessibleButton>
          </div>
        )}
      </div>

      {/* Attendance Info */}
      {attendanceRecord && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-800">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">
              Attendance tracked
              <span className="block text-xs" lang="ml">
                ഹാജർ രേഖപ്പെടുത്തി
              </span>
            </span>
          </div>
          {attendanceRecord.duration > 0 && (
            <p className="text-green-700 text-xs mt-1">
              Duration: {Math.floor(attendanceRecord.duration / 60)} minutes
            </p>
          )}
        </div>
      )}

      {/* Meeting Info */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Meeting ID:</span>
            <span className="ml-2 font-mono">{classSession.zoomMeetingId}</span>
          </div>
          <div>
            <span className="font-medium">Duration:</span>
            <span className="ml-2">{classSession.duration} minutes</span>
          </div>
        </div>

        {classSession.zoomPassword && (
          <div className="mt-2">
            <span className="font-medium">Password:</span>
            <span className="ml-2 font-mono">{classSession.zoomPassword}</span>
          </div>
        )}
      </div>
    </div>
  );
};
