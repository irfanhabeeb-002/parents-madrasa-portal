import React from 'react';
import { Recording } from '../../types/recording';
import {
  PlayIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

interface RecordingCardProps {
  recording: Recording;
  onPlay: () => void;
}

export const RecordingCard: React.FC<RecordingCardProps> = ({
  recording,
  onPlay,
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) {
      return '0 B';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (date: Date | { seconds: number }): string => {
    const dateObj = date instanceof Date ? date : new Date(date.seconds * 1000);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getQualityBadgeColor = (quality: string): string => {
    switch (quality) {
      case 'hd':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex space-x-4">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden">
              {recording.thumbnailUrl ? (
                <img
                  src={recording.thumbnailUrl}
                  alt={`Thumbnail for ${recording.title}`}
                  className="w-full h-full object-cover"
                  onError={e => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}

              {/* Fallback thumbnail */}
              <div
                className={`w-full h-full flex items-center justify-center bg-gray-100 ${recording.thumbnailUrl ? 'hidden' : ''}`}
              >
                <PlayIcon className="w-8 h-8 text-gray-400" />
              </div>

              {/* Play button overlay */}
              <button
                onClick={onPlay}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={`Play ${recording.title}`}
              >
                <div className="w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                  <PlayIcon className="w-5 h-5 text-gray-900 ml-0.5" />
                </div>
              </button>
            </div>

            {/* Duration badge */}
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(recording.duration)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                  {recording.title}
                </h3>

                {recording.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {recording.description}
                  </p>
                )}
              </div>

              {/* Quality badge */}
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQualityBadgeColor(recording.quality)}`}
              >
                {recording.quality.toUpperCase()}
              </span>
            </div>

            {/* Metadata */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {formatDate(recording.createdAt)}
              </div>

              <div className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-1" />
                {recording.viewCount} views
              </div>

              <div className="flex items-center">
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                {formatFileSize(recording.fileSize)}
              </div>
            </div>

            {/* Tags */}
            {recording.tags && recording.tags.length > 0 && (
              <div className="flex items-center space-x-2 mb-3">
                <TagIcon className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {recording.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {recording.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{recording.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Chapters indicator */}
            {recording.chapters && recording.chapters.length > 0 && (
              <div className="text-xs text-gray-500">
                {recording.chapters.length} chapter
                {recording.chapters.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onPlay}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 touch-target"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            Play Video
          </button>

          <div className="flex items-center space-x-2">
            {/* Processing status */}
            {!recording.isProcessed && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Processing...
              </span>
            )}

            {/* Captions available */}
            {recording.captions && recording.captions.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                CC
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
