import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Recording } from '../../types/recording';
import { Modal } from '../ui/Modal';
import { RecordingService } from '../../services/recordingService';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ForwardIcon,
  BackwardIcon,
} from '@heroicons/react/24/outline';

interface VideoPlayerProps {
  recording: Recording;
  isOpen: boolean;
  onClose: () => void;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  isLoading: boolean;
  error: string | null;
  playbackRate: number;
  selectedChapter: number | null;
  showSettings: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  recording,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    showControls: true,
    isLoading: true,
    error: null,
    playbackRate: 1,
    selectedChapter: null,
    showSettings: false,
  });

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) {
      return;
    }

    if (state.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [state.isPlaying]);

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.volume = newVolume;
    setState(prev => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0,
    }));
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!videoRef.current) {
      return;
    }

    const newMuted = !state.isMuted;
    videoRef.current.muted = newMuted;
    setState(prev => ({
      ...prev,
      isMuted: newMuted,
    }));
  }, [state.isMuted]);

  // Handle seek
  const handleSeek = useCallback((newTime: number) => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  }, []);

  // Skip forward/backward
  const skip = useCallback(
    (seconds: number) => {
      if (!videoRef.current) {
        return;
      }

      const newTime = Math.max(
        0,
        Math.min(state.duration, state.currentTime + seconds)
      );
      handleSeek(newTime);
    },
    [state.currentTime, state.duration, handleSeek]
  );

  // Handle playback rate change
  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    if (!state.isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [state.isFullscreen]);

  // Handle chapter selection
  const handleChapterSelect = useCallback(
    (chapterIndex: number) => {
      const chapter = recording.chapters[chapterIndex];
      if (chapter) {
        handleSeek(chapter.startTime);
        setState(prev => ({ ...prev, selectedChapter: chapterIndex }));
      }
    },
    [recording.chapters, handleSeek]
  );

  // Show/hide controls
  const showControls = useCallback(() => {
    setState(prev => ({ ...prev, showControls: true }));

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, showControls: false }));
    }, 3000);
  }, []);

  // Track viewing progress
  const trackProgress = useCallback(async () => {
    if (!user || !videoRef.current) {
      return;
    }

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    if (currentTime > 0 && duration > 0) {
      await RecordingService.trackView(recording.id, user.uid, currentTime);
    }
  }, [user, recording.id]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: video.duration,
        isLoading: false,
      }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: video.currentTime,
      }));

      // Update selected chapter based on current time
      const currentChapter = recording.chapters.findIndex((chapter, index) => {
        const nextChapter = recording.chapters[index + 1];
        return (
          video.currentTime >= chapter.startTime &&
          (!nextChapter || video.currentTime < nextChapter.startTime)
        );
      });

      if (currentChapter !== -1 && currentChapter !== state.selectedChapter) {
        setState(prev => ({ ...prev, selectedChapter: currentChapter }));
      }
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      trackProgress();
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      trackProgress();
    };

    const handleError = () => {
      setState(prev => ({
        ...prev,
        error: 'Failed to load video',
        isLoading: false,
      }));
    };

    const handleVolumeChange = () => {
      setState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted,
      }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [recording.chapters, state.selectedChapter, trackProgress]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState(prev => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement,
      }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, state.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, state.volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (state.isFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isOpen,
    togglePlayPause,
    skip,
    handleVolumeChange,
    state.volume,
    toggleMute,
    toggleFullscreen,
    state.isFullscreen,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={recording.title} size="2xl">
      <div
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden"
        onMouseMove={showControls}
        onMouseLeave={() =>
          setState(prev => ({ ...prev, showControls: false }))
        }
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={recording.videoUrl}
          className="w-full h-auto max-h-[70vh]"
          poster={recording.thumbnailUrl}
          preload="metadata"
          onClick={togglePlayPause}
        >
          {/* Captions */}
          {recording.captions?.map(caption => (
            <track
              key={caption.id}
              kind="subtitles"
              src={caption.url}
              srcLang={caption.language}
              label={caption.language === 'en' ? 'English' : 'Malayalam'}
            />
          ))}
          Your browser does not support the video tag.
        </video>

        {/* Loading Overlay */}
        {state.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {state.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-white text-center">
              <p className="text-lg mb-4">{state.error}</p>
              <button
                onClick={() =>
                  setState(prev => ({ ...prev, error: null, isLoading: true }))
                }
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        {state.showControls && !state.isLoading && !state.error && (
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent">
            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
              <h3 className="text-white font-semibold truncate">
                {recording.title}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 p-2"
                aria-label="Close video player"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Center Play Button */}
            {!state.isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlayPause}
                  className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                  aria-label="Play video"
                >
                  <PlayIcon className="w-8 h-8 text-white ml-1" />
                </button>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={state.duration || 0}
                  value={state.currentTime}
                  onChange={e => handleSeek(Number(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  aria-label="Video progress"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlayPause}
                    className="text-white hover:text-gray-300 p-1"
                    aria-label={state.isPlaying ? 'Pause' : 'Play'}
                  >
                    {state.isPlaying ? (
                      <PauseIcon className="w-6 h-6" />
                    ) : (
                      <PlayIcon className="w-6 h-6" />
                    )}
                  </button>

                  {/* Skip Backward */}
                  <button
                    onClick={() => skip(-10)}
                    className="text-white hover:text-gray-300 p-1"
                    aria-label="Skip backward 10 seconds"
                  >
                    <BackwardIcon className="w-5 h-5" />
                  </button>

                  {/* Skip Forward */}
                  <button
                    onClick={() => skip(10)}
                    className="text-white hover:text-gray-300 p-1"
                    aria-label="Skip forward 10 seconds"
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-gray-300 p-1"
                      aria-label={state.isMuted ? 'Unmute' : 'Mute'}
                    >
                      {state.isMuted ? (
                        <SpeakerXMarkIcon className="w-5 h-5" />
                      ) : (
                        <SpeakerWaveIcon className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={state.isMuted ? 0 : state.volume}
                      onChange={e => handleVolumeChange(Number(e.target.value))}
                      className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      aria-label="Volume"
                    />
                  </div>

                  {/* Time Display */}
                  <span className="text-white text-sm">
                    {formatTime(state.currentTime)} /{' '}
                    {formatTime(state.duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Settings */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setState(prev => ({
                          ...prev,
                          showSettings: !prev.showSettings,
                        }))
                      }
                      className="text-white hover:text-gray-300 p-1"
                      aria-label="Settings"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                    </button>

                    {/* Settings Menu */}
                    {state.showSettings && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-lg p-3 min-w-[150px]">
                        <div className="text-white text-sm space-y-2">
                          <div>
                            <label className="block mb-1">Playback Speed</label>
                            <select
                              value={state.playbackRate}
                              onChange={e =>
                                handlePlaybackRateChange(Number(e.target.value))
                              }
                              className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
                            >
                              {playbackRates.map(rate => (
                                <option key={rate} value={rate}>
                                  {rate}x
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-gray-300 p-1"
                    aria-label={
                      state.isFullscreen
                        ? 'Exit fullscreen'
                        : 'Enter fullscreen'
                    }
                  >
                    {state.isFullscreen ? (
                      <ArrowsPointingInIcon className="w-5 h-5" />
                    ) : (
                      <ArrowsPointingOutIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapters List */}
      {recording.chapters && recording.chapters.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold mb-3">Chapters</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recording.chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => handleChapterSelect(index)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  state.selectedChapter === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">
                      {chapter.title}
                    </h5>
                    {chapter.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {chapter.description}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    {formatTime(chapter.startTime)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
