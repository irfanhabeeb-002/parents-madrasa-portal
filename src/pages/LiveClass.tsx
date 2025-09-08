import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { Card, AlertBanner, SkeletonLoader, AccessibleButton } from '../components/ui';
import { ClassService, AttendanceService } from '../services';
import type { ClassSession } from '../types/class';
import { useAuth } from '../contexts/AuthContext';

interface LiveClassState {
  todaysClasses: ClassSession[];
  liveClasses: ClassSession[];
  upcomingClasses: ClassSession[];
  loading: boolean;
  error: string | null;
  joiningClass: string | null;
  joinError: string | null;
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
  });

  useEffect(() => {
    loadClassData();
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

      // Join the class
      const joinResponse = await ClassService.joinClass(classSession.id, user.uid);
      
      if (!joinResponse.success) {
        throw new Error(joinResponse.error || 'Failed to join class');
      }

      // Record attendance
      await AttendanceService.recordAttendance({
        userId: user.uid,
        classSessionId: classSession.id,
        joinedAt: new Date(),
        duration: 0,
        isPresent: true,
        attendanceType: 'zoom_integration',
        verificationMethod: 'zoom_join'
      });

      // Open Zoom meeting in new window/tab
      window.open(joinResponse.data.joinUrl, '_blank');
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        joinError: error instanceof Error ? error.message : 'Failed to join class',
      }));
    } finally {
      setState(prev => ({ ...prev, joiningClass: null }));
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
    const statusConfig = {
      live: { color: 'bg-red-100 text-red-800', text: 'LIVE', malayalam: 'ലൈവ്' },
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled', malayalam: 'ഷെഡ്യൂൾ ചെയ്തു' },
      completed: { color: 'bg-gray-100 text-gray-800', text: 'Completed', malayalam: 'പൂർത്തിയായി' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled', malayalam: 'റദ്ദാക്കി' }
    };

    const config = statusConfig[classSession.status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
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
                      disabled={state.joiningClass === classSession.id}
                      ariaLabel={`Join live class: ${classSession.title}`}
                      className="bg-red-600 hover:bg-red-700 ml-4"
                    >
                      {state.joiningClass === classSession.id ? (
                        <>
                          <SkeletonLoader variant="custom" className="w-4 h-4 mr-2" />
                          Joining...
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
                    {classSession.status === 'scheduled' && (
                      <AccessibleButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleJoinClass(classSession)}
                        disabled={state.joiningClass === classSession.id}
                        ariaLabel={`Join class: ${classSession.title}`}
                        className="ml-4"
                      >
                        {state.joiningClass === classSession.id ? (
                          <>
                            <SkeletonLoader variant="custom" className="w-4 h-4 mr-2" />
                            Joining...
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