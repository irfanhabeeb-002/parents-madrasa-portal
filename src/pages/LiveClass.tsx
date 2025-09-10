import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout';
import { Card, AlertBanner, SkeletonLoader, AccessibleButton } from '../components/ui';
import { ClassService, AttendanceService } from '../services';
import zoomService from '../services/zoomService.js';
import type { ClassSession } from '../types/class';
import { useAuth } from '../contexts/AuthContext';
import { ZoomMeeting } from 'src/components/zoom';
import { MEETING_STATUS_MESSAGES } from 'src/config/zoom';

interface LiveClassState {
  todaysClasses: ClassSession[];
  liveClasses: ClassSession[];
  upcomingClasses: ClassSession[];
  loading: boolean;
  error: string | null;
  joiningClass: string | null;
  joinError: string | null;
  zoomEnabled: boolean;
  zoomInitialized: boolean;
}

export const LiveClass: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<LiveClassState>({
    todaysClasses: [],
    liveClasses: [],
    upcomingClasses: [],
    loading: true,
    error: null,
    joiningClass: null,
    joinError: null,
    zoomEnabled: zoomService.isZoomEnabled(),
    zoomInitialized: false,
  });

  // Initialize Zoom service if enabled
  useEffect(() => {
    const initZoom = async () => {
      if (state.zoomEnabled) {
        try {
          const result = await zoomService.initializeZoomSDK();
          if (result.status === 'success') {
            setState(prev => ({ ...prev, zoomInitialized: true }));
          } else if (result.status === 'error') {
            setState(prev => ({ 
              ...prev, 
              joinError: result.message || 'Failed to initialize Zoom'
            }));
          }
        } catch (error) {
          console.error('Failed to initialize Zoom:', error);
          setState(prev => ({ 
            ...prev, 
            joinError: 'Failed to initialize Zoom integration'
          }));
        }
      }
    };
    initZoom();
  }, [state.zoomEnabled]);

  // Monitor meeting status changes
  useEffect(() => {
    if (state.activeZoomMeeting) {
      const interval = setInterval(async () => {
        try {
          // Check if meeting is still active
          const classResponse = await ClassService.getClassById(state.activeZoomMeeting!.id);
          if (classResponse.success && classResponse.data) {
            const updatedClass = classResponse.data;
            
            // Update class status if it has changed
            if (updatedClass.status !== state.activeZoomMeeting!.status) {
              setState(prev => ({
                ...prev,
                activeZoomMeeting: updatedClass,
                liveClasses: prev.liveClasses.map(cls => 
                  cls.id === updatedClass.id ? updatedClass : cls
                ),
                todaysClasses: prev.todaysClasses.map(cls => 
                  cls.id === updatedClass.id ? updatedClass : cls
                )
              }));

              // If meeting ended, clear active meeting
              if (updatedClass.status === 'completed') {
                // Handle meeting end inline to avoid dependency issues
                const tracking = state.attendanceTracking[updatedClass.id];
                
                if (tracking && tracking.isTracking && user) {
                  const leaveTime = new Date();
                  const duration = Math.floor((leaveTime.getTime() - tracking.joinTime.getTime()) / 1000);

                  try {
                    // Update attendance with leave time and duration
                    await AttendanceService.recordAttendance({
                      userId: user.uid,
                      classSessionId: updatedClass.id,
                      joinedAt: tracking.joinTime,
                      leftAt: leaveTime,
                      duration,
                      isPresent: true,
                      attendanceType: 'zoom_integration',
                      verificationMethod: 'zoom_join'
                    });

                    // Track with Zoom service as well
                    await zoomService.trackAttendance(updatedClass.zoomMeetingId, user.uid, 'leave');
                    
                    console.log(`Attendance recorded: ${Math.floor(duration / 60)} minutes for class:`, updatedClass.title);
                    
                  } catch (error) {
                    console.error('Failed to record attendance end:', error);
                    setState(prev => ({
                      ...prev,
                      joinError: 'Failed to save attendance record. Please contact your teacher.'
                    }));
                  }
                }

                setState(prev => ({
                  ...prev,
                  activeZoomMeeting: null,
                  attendanceTracking: {
                    ...prev.attendanceTracking,
                    [updatedClass.id]: {
                      ...prev.attendanceTracking[updatedClass.id],
                      isTracking: false
                    }
                  }
                }));
              }
            }
          }
        } catch (error) {
          console.error('Error checking meeting status:', error);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [state.activeZoomMeeting, state.attendanceTracking, user]);

  useEffect(() => {
    loadClassData();
    
    // Set up real-time listeners for class updates
    const unsubscribeLive = ClassService.subscribeToLiveClasses((liveClasses) => {
      setState(prev => ({ ...prev, liveClasses }));
    });

    const unsubscribeToday = ClassService.subscribeToTodaysClasses((todaysClasses) => {
      setState(prev => ({ ...prev, todaysClasses }));
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeLive();
      unsubscribeToday();
    };
  }, []);

  const loadClassData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [todaysResponse, liveResponse, upcomingResponse] = await Promise.all([
        ClassService.getTodaysClasses(),
        ClassService.getLiveClasses(),
        ClassService.getUpcomingClasses(3)
      ]);

      if (!todaysResponse.success) {
        throw new Error(todaysResponse.error || 'Failed to load today\'s classes');
      }
      if (!liveResponse.success) {
        throw new Error(liveResponse.error || 'Failed to load live classes');
      }
      if (!upcomingResponse.success) {
        throw new Error(upcomingResponse.error || 'Failed to load upcoming classes');
      }

      setState(prev => ({
        ...prev,
        todaysClasses: todaysResponse.data,
        liveClasses: liveResponse.data,
        upcomingClasses: upcomingResponse.data,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load class data',
        loading: false,
      }));
    }
  };

  // Zoom integration methods
  const handleJoinZoomMeeting = useCallback(async (classSession: ClassSession) => {
    if (!state.zoomEnabled) {
      setState(prev => ({
        ...prev,
        joinError: 'Zoom integration is currently disabled. Please contact your administrator.'
      }));
      return;
    }

    if (!user) return;

    setState(prev => ({ 
      ...prev, 
      joiningClass: classSession.id, 
      joinError: null 
    }));

    try {
      // Record attendance start
      const joinTime = new Date();
      await AttendanceService.recordAttendance({
        userId: user.uid,
        classSessionId: classSession.id,
        joinedAt: joinTime,
        duration: 0,
        isPresent: true,
        attendanceType: 'zoom_integration',
        verificationMethod: 'zoom_join'
      });

      // Join meeting via Zoom service
      const joinResult = await zoomService.joinMeeting({
        meetingNumber: classSession.zoomMeetingId,
        password: classSession.zoomPassword,
        userName: user.displayName || user.email || 'Student',
        userEmail: user.email
      });

      if (joinResult.status === 'success') {
        // Track attendance with Zoom service
        await zoomService.trackAttendance(classSession.zoomMeetingId, user.uid, 'join');
        console.log('Successfully joined Zoom meeting:', classSession.title);
      } else if (joinResult.status === 'disabled') {
        setState(prev => ({
          ...prev,
          joinError: joinResult.message
        }));
      } else {
        throw new Error(joinResult.message || 'Failed to join meeting');
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        joinError: error instanceof Error ? error.message : 'Failed to join class',
      }));
    } finally {
      setState(prev => ({ ...prev, joiningClass: null }));
    }
  }, [state.zoomEnabled, user]);

  const handleJoinClass = async (classSession: ClassSession) => {
    if (!user) return;

    setState(prev => ({ 
      ...prev, 
      joiningClass: classSession.id, 
      joinError: null 
    }));

    try {
      // Check if user can join
      const canJoinResponse = await ClassService.canJoinClass(classSession.id, user.uid);
      
      if (!canJoinResponse.success || !canJoinResponse.data.canJoin) {
        throw new Error(canJoinResponse.data.reason || 'Cannot join class at this time');
      }

      // Set active meeting for Zoom integration
      setState(prev => ({ 
        ...prev, 
        activeZoomMeeting: classSession,
        joiningClass: null
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        joinError: error instanceof Error ? error.message : 'Failed to join class',
        joiningClass: null
      }));
    }
  };

  const toDate = (dateValue: Date | any): Date => {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    // Handle Firestore Timestamp or string
    if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000 + (dateValue.nanoseconds || 0) / 1000000);
    }
    return new Date(dateValue);
  };

  const formatTime = (date: Date | any) => {
    return toDate(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date | any) => {
    return toDate(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (classSession: ClassSession) => {
    const isActiveZoomMeeting = state.activeZoomMeeting?.id === classSession.id;
    const isConnectedToZoom = isActiveZoomMeeting && state.meetingStatus === 'connected';
    
    const statusConfig = {
      live: { 
        color: isConnectedToZoom ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800', 
        text: isConnectedToZoom ? 'CONNECTED' : 'LIVE', 
        malayalam: isConnectedToZoom ? 'കണക്റ്റ് ചെയ്തു' : 'ലൈവ്',
        icon: isConnectedToZoom ? (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <div className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></div>
        )
      },
      scheduled: { 
        color: 'bg-blue-100 text-blue-800', 
        text: 'Scheduled', 
        malayalam: 'ഷെഡ്യൂൾ ചെയ്തു',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      completed: { 
        color: 'bg-gray-100 text-gray-800', 
        text: 'Completed', 
        malayalam: 'പൂർത്തിയായി',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800', 
        text: 'Cancelled', 
        malayalam: 'റദ്ദാക്കി',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )
      }
    };

    const config = statusConfig[classSession.status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.text}
        <span className="ml-1 text-xs opacity-75" lang="ml">{config.malayalam}</span>
      </span>
    );
  };

  if (state.loading) {
    return (
      <Layout 
        showBackButton={true}
        title="Live Class"
        malayalamTitle="ലൈവ് ക്ലാസ്"
      >
        <div className="space-y-6">
          <SkeletonLoader variant="card" className="h-32" />
          <SkeletonLoader variant="card" className="h-48" />
          <SkeletonLoader variant="card" className="h-32" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      showBackButton={true}
      title="Live Class"
      malayalamTitle="ലൈവ് ക്ലാസ്"
    >
      <div className="space-y-6">
        {state.error && (
          <AlertBanner
            type="error"
            message={state.error}
            malayalamMessage="ക്ലാസ് ഡാറ്റ ലോഡ് ചെയ്യുന്നതിൽ പിശക്"
            onDismiss={() => setState(prev => ({ ...prev, error: null }))}
          />
        )}

        {state.joinError && (
          <AlertBanner
            type="error"
            message={state.joinError}
            malayalamMessage="ക്ലാസിൽ ചേരുന്നതിൽ പിശക്"
            onDismiss={() => setState(prev => ({ ...prev, joinError: null }))}
            autoHide
            duration={5000}
          />
        )}

        {/* Meeting Status Banner */}
        {state.meetingStatus && (
          <AlertBanner
            type={state.meetingStatus === 'connected' ? 'success' : 
                  state.meetingStatus === 'failed' ? 'error' : 'info'}
            message={getMeetingStatusMessage(state.meetingStatus)}
            malayalamMessage={MEETING_STATUS_MESSAGES[state.meetingStatus]?.ml}
            className="mb-4"
          />
        )}

        {/* Active Zoom Meeting */}
        {state.activeZoomMeeting && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Active Meeting
                <span className="ml-2 text-sm text-gray-500" lang="ml">സജീവ മീറ്റിംഗ്</span>
              </h2>
              
              {/* Attendance Tracking Indicator */}
              {state.attendanceTracking[state.activeZoomMeeting.id]?.isTracking && (
                <div className="flex items-center text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span>Attendance Tracking</span>
                  <span className="ml-1 text-xs" lang="ml">ഹാജർ രേഖപ്പെടുത്തുന്നു</span>
                </div>
              )}
            </div>
            
            <ZoomMeeting
              classSession={state.activeZoomMeeting}
              userName={user?.displayName || user?.email || 'Student'}
              userEmail={user?.email}
              onMeetingStart={() => {
                if (state.activeZoomMeeting) {
                  handleMeetingStart(state.activeZoomMeeting);
                }
              }}
              onMeetingEnd={() => {
                if (state.activeZoomMeeting) {
                  handleMeetingEnd(state.activeZoomMeeting);
                }
              }}
              onAttendanceTracked={(duration) => {
                console.log(`Attendance tracked for ${duration} seconds`);
              }}
              className="mb-6"
            />
            
            {/* Meeting Duration Display */}
            {state.attendanceTracking[state.activeZoomMeeting.id]?.isTracking && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">
                    Meeting in progress - Attendance being tracked
                    <span className="block text-xs" lang="ml">മീറ്റിംഗ് പുരോഗതിയിൽ - ഹാജർ രേഖപ്പെടുത്തുന്നു</span>
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Live Classes Section */}
        {state.liveClasses.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Live Now
              <span className="ml-2 text-sm text-gray-500" lang="ml">ഇപ്പോൾ ലൈവ്</span>
            </h2>
            <div className="space-y-4">
              {state.liveClasses.map((classSession) => (
                <div key={classSession.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(classSession)}
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-sm text-red-600 font-medium">
                            Live Now
                          </span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {classSession.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {classSession.instructor} • {classSession.subject}
                      </p>
                      <p className="text-sm text-gray-500">
                        Started at {formatTime(classSession.scheduledAt)}
                      </p>
                    </div>
                    <AccessibleButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleJoinClass(classSession)}
                      disabled={state.joiningClass === classSession.id || state.activeZoomMeeting?.id === classSession.id}
                      ariaLabel={`Join live class: ${classSession.title}`}
                      className={`ml-4 ${
                        state.activeZoomMeeting?.id === classSession.id 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {state.joiningClass === classSession.id ? (
                        <>
                          <SkeletonLoader variant="custom" className="w-4 h-4 mr-2" />
                          Joining...
                        </>
                      ) : state.activeZoomMeeting?.id === classSession.id ? (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Active
                          <span className="ml-1 text-xs" lang="ml">സജീവം</span>
                        </>
                      ) : (
                        <>
                          Join Now
                          <span className="ml-1 text-xs" lang="ml">ചേരുക</span>
                        </>
                      )}
                    </AccessibleButton>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Today's Classes Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Classes
            <span className="ml-2 text-sm text-gray-500" lang="ml">ഇന്നത്തെ ക്ലാസുകൾ</span>
          </h2>
          
          {state.todaysClasses.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-1">No classes scheduled for today</p>
                <p className="text-sm text-gray-500" lang="ml">ഇന്ന് ക്ലാസുകൾ ഷെഡ്യൂൾ ചെയ്തിട്ടില്ല</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {state.todaysClasses.map((classSession) => (
                <div key={classSession.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(classSession)}
                        <span className="text-sm text-gray-500">
                          {formatTime(classSession.scheduledAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {classSession.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {classSession.instructor} • {classSession.subject}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duration: {classSession.duration} minutes
                      </p>
                    </div>
                    {(classSession.status === 'scheduled' || classSession.status === 'live') && (
                      <AccessibleButton
                        variant={state.activeZoomMeeting?.id === classSession.id ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleJoinClass(classSession)}
                        disabled={state.joiningClass === classSession.id || state.activeZoomMeeting?.id === classSession.id}
                        ariaLabel={`Join class: ${classSession.title}`}
                        className={`ml-4 ${
                          state.activeZoomMeeting?.id === classSession.id 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : ''
                        }`}
                      >
                        {state.joiningClass === classSession.id ? (
                          <>
                            <SkeletonLoader variant="custom" className="w-4 h-4 mr-2" />
                            Joining...
                          </>
                        ) : state.activeZoomMeeting?.id === classSession.id ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Active
                            <span className="ml-1 text-xs" lang="ml">സജീവം</span>
                          </>
                        ) : (
                          <>
                            Join
                            <span className="ml-1 text-xs" lang="ml">ചേരുക</span>
                          </>
                        )}
                      </AccessibleButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Classes Section */}
        {state.upcomingClasses.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming Classes
              <span className="ml-2 text-sm text-gray-500" lang="ml">വരാനിരിക്കുന്ന ക്ലാസുകൾ</span>
            </h2>
            <div className="space-y-4">
              {state.upcomingClasses.map((classSession) => (
                <div key={classSession.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(classSession)}
                        <span className="text-sm text-gray-500">
                          {formatDate(classSession.scheduledAt)} at {formatTime(classSession.scheduledAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {classSession.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {classSession.instructor} • {classSession.subject}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duration: {classSession.duration} minutes
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center pt-4">
          <AccessibleButton
            variant="secondary"
            onClick={loadClassData}
            disabled={state.loading}
            ariaLabel="Refresh class data"
          >
            {state.loading ? (
              <>
                <SkeletonLoader variant="custom" className="w-4 h-4 mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
                <span className="ml-1 text-xs" lang="ml">പുതുക്കുക</span>
              </>
            )}
          </AccessibleButton>
        </div>
      </div>
    </Layout>
  );
};