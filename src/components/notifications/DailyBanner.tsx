// Daily banner component for "Your class today at [time]" notifications
import React from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { ClockIcon, PlayIcon } from '@heroicons/react/24/outline';

interface DailyBannerProps {
  classTitle: string;
  classTime: string;
  malayalamTitle?: string;
  onJoinClass: () => void;
  isLive?: boolean;
  className?: string;
}

export const DailyBanner: React.FC<DailyBannerProps> = ({
  classTitle,
  classTime,
  malayalamTitle,
  onJoinClass,
  isLive = false,
  className = '',
}) => {
  const formatTime = (timeString: string): string => {
    try {
      const time = new Date(`2000-01-01 ${timeString}`);
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div
      className={`
        bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-4 shadow-md
        ${className}
      `}
      role="banner"
      aria-live="polite"
      aria-label="Daily class notification"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {isLive ? (
              <div className="relative">
                <PlayIcon className="w-6 h-6 text-white" aria-hidden="true" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
            ) : (
              <ClockIcon className="w-6 h-6 text-white" aria-hidden="true" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white truncate">
                {isLive ? 'Live Now:' : 'Your class today at'}{' '}
                {formatTime(classTime)}
              </h3>
              {isLive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  LIVE
                </span>
              )}
            </div>

            <p className="text-sm text-primary-100 truncate mt-1">
              {classTitle}
            </p>

            {malayalamTitle && (
              <p className="text-xs text-primary-200 truncate mt-1" lang="ml">
                {malayalamTitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
          <AccessibleButton
            variant="secondary"
            size="sm"
            onClick={onJoinClass}
            ariaLabel={isLive ? 'Join live class' : 'Join class when it starts'}
            className="
              !bg-white !text-primary-600 hover:!bg-primary-50 
              !border-white !min-h-[36px] !px-4 !py-2
              font-medium text-sm
            "
          >
            {isLive ? (
              <>
                <PlayIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                Join Now
              </>
            ) : (
              'Join Class'
            )}
          </AccessibleButton>
        </div>
      </div>

      {/* Progress indicator for live classes */}
      {isLive && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-primary-200 mb-1">
            <span>Class in progress</span>
            <span>Tap to join</span>
          </div>
          <div className="w-full bg-primary-400 rounded-full h-1">
            <div
              className="bg-white h-1 rounded-full animate-pulse"
              style={{ width: '60%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
