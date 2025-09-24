import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout';
import { SkeletonLoader, AlertBanner } from '../components/ui';
import { RecordingService } from '../services/recordingService';
import { Recording, VideoQuality } from '../types/recording';
import { ApiResponse } from '../types/common';
import { VideoPlayer } from '../components/recordings/VideoPlayer';
import { RecordingCard } from '../components/recordings/RecordingCard';
import { SearchAndFilter } from '../components/recordings/SearchAndFilter';
import { PlayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface RecordingsState {
  recordings: Recording[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedQuality: VideoQuality | 'all';
  selectedSource: 'all' | 'zoom';
  selectedRecording: Recording | null;
  showPlayer: boolean;
  syncing: boolean;
  syncStatus: {
    lastSync: Date | null;
    recordingCount: number;
  };
}

export const Recordings: React.FC = () => {
  const [state, setState] = useState<RecordingsState>({
    recordings: [],
    loading: true,
    error: null,
    searchQuery: '',
    selectedQuality: 'all',
    selectedSource: 'all',
    selectedRecording: null,
    showPlayer: false,
    syncing: false,
    syncStatus: {
      lastSync: null,
      recordingCount: 0,
    },
  });

  // Load recordings on component mount
  useEffect(() => {
    loadRecordings();
    loadSyncStatus();
  }, []);

  const loadRecordings = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response: ApiResponse<Recording[]> =
        await RecordingService.getRecordings({
          orderBy: 'createdAt',
          orderDirection: 'desc',
          limit: 50,
          includeZoom: true, // Include Zoom recordings by default
          zoomOnly: state.selectedSource === 'zoom',
        });

      if (response.success) {
        setState(prev => ({
          ...prev,
          recordings: response.data,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load recordings',
          loading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Network error occurred while loading recordings',
        loading: false,
      }));
    }
  }, [state.selectedSource]);

  const loadSyncStatus = useCallback(() => {
    const syncStatus = RecordingService.getZoomSyncStatus();
    setState(prev => ({
      ...prev,
      syncStatus,
    }));
  }, []);

  const handleSearch = useCallback(
    async (query: string) => {
      setState(prev => ({ ...prev, searchQuery: query, loading: true }));

      if (!query.trim()) {
        loadRecordings();
        return;
      }

      try {
        const response = await RecordingService.searchRecordings({
          query: query.trim(),
          fields: ['title', 'description', 'tags'],
          caseSensitive: false,
        });

        if (response.success) {
          setState(prev => ({
            ...prev,
            recordings: response.data,
            loading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: response.error || 'Search failed',
            loading: false,
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Search error occurred',
          loading: false,
        }));
      }
    },
    [loadRecordings]
  );

  const handleQualityFilter = useCallback((quality: VideoQuality | 'all') => {
    setState(prev => ({ ...prev, selectedQuality: quality }));
  }, []);

  const handleSourceFilter = useCallback(
    (source: 'all' | 'zoom') => {
      setState(prev => ({ ...prev, selectedSource: source }));
      // Reload recordings when source changes
      setTimeout(() => loadRecordings(), 100);
    },
    [loadRecordings]
  );

  const handleSyncZoom = useCallback(async () => {
    setState(prev => ({ ...prev, syncing: true, error: null }));

    try {
      const response = await RecordingService.syncZoomRecordings({
        forceSync: true,
      });

      if (response.success) {
        // Reload recordings after sync
        await loadRecordings();
        loadSyncStatus();

        setState(prev => ({
          ...prev,
          syncing: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          syncing: false,
          error: response.error || 'Failed to sync Zoom recordings',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: 'Failed to sync Zoom recordings',
      }));
    }
  }, [loadRecordings, loadSyncStatus]);

  const handlePlayRecording = useCallback((recording: Recording) => {
    setState(prev => ({
      ...prev,
      selectedRecording: recording,
      showPlayer: true,
    }));
  }, []);

  const handleClosePlayer = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedRecording: null,
      showPlayer: false,
    }));
  }, []);

  const handleRetry = useCallback(() => {
    loadRecordings();
  }, [loadRecordings]);

  // Filter recordings based on selected quality
  const filteredRecordings = state.recordings.filter(recording => {
    if (state.selectedQuality === 'all') {
      return true;
    }
    return recording.quality === state.selectedQuality;
  });

  return (
    <Layout showBackButton={true} title="Recordings">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Recordings</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and access class recordings from Zoom sessions
          </p>
        </div>

        {/* Search and Filter Section */}
        <SearchAndFilter
          searchQuery={state.searchQuery}
          selectedQuality={state.selectedQuality}
          selectedSource={state.selectedSource}
          onSearch={handleSearch}
          onQualityFilter={handleQualityFilter}
          onSourceFilter={handleSourceFilter}
          onSyncZoom={handleSyncZoom}
          disabled={state.loading}
          showZoomFeatures={true}
          syncStatus={{
            ...state.syncStatus,
            syncing: state.syncing,
          }}
        />

        {/* Error Banner */}
        {state.error && (
          <AlertBanner
            type="error"
            message={state.error}
            onDismiss={() => setState(prev => ({ ...prev, error: null }))}
          />
        )}

        {/* Loading State */}
        {state.loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex space-x-4">
                  <SkeletonLoader variant="image" width="120px" height="80px" />
                  <div className="flex-1 space-y-2">
                    <SkeletonLoader variant="text" width="70%" />
                    <SkeletonLoader variant="text" width="50%" />
                    <SkeletonLoader variant="text" width="30%" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!state.loading && filteredRecordings.length === 0 && !state.error && (
          <div className="text-center py-12">
            <PlayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {state.searchQuery
                ? 'No recordings found'
                : 'No recordings available'}
            </h3>
            <p className="text-gray-500 mb-2">
              {state.searchQuery
                ? `No recordings match "${state.searchQuery}"`
                : 'No recordings available yet. Recordings from Zoom classes will appear here automatically.'}
            </p>
            {state.searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Recordings List */}
        {!state.loading && filteredRecordings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {state.searchQuery ? 'Search Results' : 'Available Recordings'}
              </h2>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  {filteredRecordings.length} recording
                  {filteredRecordings.length !== 1 ? 's' : ''}
                </span>
                {state.selectedSource !== 'all' && (
                  <div className="text-xs text-gray-400">
                    {state.selectedSource === 'zoom'
                      ? 'From Zoom Cloud'
                      : 'Manual Uploads'}
                  </div>
                )}
              </div>
            </div>

            {filteredRecordings.map(recording => (
              <RecordingCard
                key={recording.id}
                recording={recording}
                onPlay={() => handlePlayRecording(recording)}
              />
            ))}
          </div>
        )}

        {/* Retry Button for Errors */}
        {state.error && !state.loading && (
          <div className="text-center">
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {state.showPlayer && state.selectedRecording && (
        <VideoPlayer
          recording={state.selectedRecording}
          isOpen={state.showPlayer}
          onClose={handleClosePlayer}
        />
      )}
    </Layout>
  );
};
