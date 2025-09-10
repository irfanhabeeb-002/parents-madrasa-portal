import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { Card, AlertBanner, SkeletonLoader, AccessibleButton } from '../components/ui';
import zoomService from '../services/zoomService.js';
import { useAuth } from '../contexts/AuthContext';

interface Recording {
  id: string;
  meetingId: string;
  topic: string;
  startTime: Date;
  duration: number;
  recordingFiles: RecordingFile[];
  shareUrl: string;
}

interface RecordingFile {
  id: string;
  fileType: string;
  fileSize: number;
  playUrl: string;
  downloadUrl: string;
}

interface RecordingsState {
  recordings: Recording[];
  loading: boolean;
  error: string | null;
  zoomEnabled: boolean;
}

export const Recordings: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<RecordingsState>({
    recordings: [],
    loading: true,
    error: null,
    zoomEnabled: zoomService.isZoomEnabled(),
  });

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (!state.zoomEnabled) {
        setState(prev => ({
          ...prev,
          recordings: [],
          loading: false,
        }));
        return;
      }

      const result = await zoomService.fetchRecordings({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        to: new Date(),
        pageSize: 20
      });

      if (result.status === 'success') {
        setState(prev => ({
          ...prev,
          recordings: result.data.recordings || [],
          loading: false,
        }));
      } else if (result.status === 'disabled') {
        setState(prev => ({
          ...prev,
          recordings: [],
          loading: false,
        }));
      } else {
        throw new Error(result.message || 'Failed to load recordings');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load recordings',
        loading: false,
      }));
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handlePlayRecording = (recording: Recording) => {
    if (recording.recordingFiles.length > 0) {
      window.open(recording.recordingFiles[0].playUrl, '_blank');
    }
  };

  const handleDownloadRecording = (recording: Recording) => {
    if (recording.recordingFiles.length > 0) {
      window.open(recording.recordingFiles[0].downloadUrl, '_blank');
    }
  };

  if (state.loading) {
    return (
      <Layout 
        showBackButton={true}
        title="Class Recordings"
        malayalamTitle="ക്ലാസ് റെക്കോർഡിംഗുകൾ"
      >
        <div className="space-y-6">
          <SkeletonLoader variant="card" className="h-32" />
          <SkeletonLoader variant="card" className="h-32" />
          <SkeletonLoader variant="card" className="h-32" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      showBackButton={true}
      title="Class Recordings"
      malayalamTitle="ക്ലാസ് റെക്കോർഡിംഗുകൾ"
    >
      <div className="space-y-6">
        {state.error && (
          <AlertBanner
            type="error"
            message={state.error}
            malayalamMessage="റെക്കോർഡിംഗുകൾ ലോഡ് ചെയ്യുന്നതിൽ പിശക്"
            onDismiss={() => setState(prev => ({ ...prev, error: null }))}
          />
        )}

        {/* Zoom Disabled Banner */}
        {!state.zoomEnabled && (
          <AlertBanner
            type="info"
            message="Zoom recordings are not available at the moment."
            malayalamMessage="സൂം റെക്കോർഡിംഗുകൾ ഇപ്പോൾ ലഭ്യമല്ല."
            className="mb-6"
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Recordings</h1>
            <p className="text-gray-600 mt-1" lang="ml">ക്ലാസ് റെക്കോർഡിംഗുകൾ</p>
          </div>
          <AccessibleButton
            variant="secondary"
            onClick={loadRecordings}
            disabled={state.loading || !state.zoomEnabled}
            ariaLabel="Refresh recordings"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
            <span className="ml-1 text-xs" lang="ml">പുതുക്കുക</span>
          </AccessibleButton>
        </div>

        {/* Recordings List */}
        {state.zoomEnabled ? (
          state.recordings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-1">No recordings available</p>
                <p className="text-sm text-gray-500" lang="ml">റെക്കോർഡിംഗുകൾ ലഭ്യമല്ല</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {state.recordings.map((recording) => (
                <Card key={recording.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {recording.topic}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Date:</span> {formatDate(recording.startTime)}
                        </p>
                        <p>
                          <span className="font-medium">Duration:</span> {formatDuration(recording.duration)}
                        </p>
                        <p>
                          <span className="font-medium">Meeting ID:</span> {recording.meetingId}
                        </p>
                        {recording.recordingFiles.length > 0 && (
                          <p>
                            <span className="font-medium">File Size:</span> {formatFileSize(recording.recordingFiles[0].fileSize)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <AccessibleButton
                        variant="primary"
                        size="sm"
                        onClick={() => handlePlayRecording(recording)}
                        disabled={recording.recordingFiles.length === 0}
                        ariaLabel={`Play recording: ${recording.topic}`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Play
                        <span className="ml-1 text-xs" lang="ml">പ്ലേ</span>
                      </AccessibleButton>
                      <AccessibleButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadRecording(recording)}
                        disabled={recording.recordingFiles.length === 0}
                        ariaLabel={`Download recording: ${recording.topic}`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                        <span className="ml-1 text-xs" lang="ml">ഡൗൺലോഡ്</span>
                      </AccessibleButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 21l-3-3m-12.728-12.728L3 3l3 3" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-1">Zoom Integration Disabled</p>
              <p className="text-sm text-gray-500 mb-4">
                Zoom recordings are not available at the moment.
              </p>
              <p className="text-sm text-gray-500" lang="ml">
                സൂം റെക്കോർഡിംഗുകൾ ഇപ്പോൾ ലഭ്യമല്ല.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};