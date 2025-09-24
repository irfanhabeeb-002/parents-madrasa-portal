import React, { useState, useEffect } from 'react';

interface ExamTimerProps {
  timeLimit: number; // in seconds
  onTimeUp: () => void;
  onTimeUpdate?: (remainingTime: number) => void;
  className?: string;
  showWarning?: boolean;
  warningThreshold?: number; // seconds when to show warning
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  timeLimit,
  onTimeUp,
  onTimeUpdate,
  className = '',
  showWarning = true,
  warningThreshold = 300, // 5 minutes
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          const newTime = time - 1;
          onTimeUpdate?.(newTime);

          if (newTime <= 0) {
            setIsActive(false);
            onTimeUp();
            return 0;
          }

          return newTime;
        });
      }, 1000);
    } else if (timeRemaining <= 0) {
      setIsActive(false);
      onTimeUp();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining, onTimeUp, onTimeUpdate]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (timeRemaining <= warningThreshold && showWarning) {
      return 'text-error-600 bg-error-50 border-error-200';
    } else if (timeRemaining <= warningThreshold * 2) {
      return 'text-warning-600 bg-warning-50 border-warning-200';
    }
    return 'text-primary-600 bg-primary-50 border-primary-200';
  };

  const getProgressPercentage = (): number => {
    return ((timeLimit - timeRemaining) / timeLimit) * 100;
  };

  const isWarning = timeRemaining <= warningThreshold && showWarning;
  const isCritical = timeRemaining <= 60; // Last minute

  return (
    <div className={`${className}`}>
      {/* Timer display */}
      <div
        className={`
          inline-flex items-center px-4 py-2 rounded-lg border-2 font-mono text-lg font-bold
          transition-all duration-300
          ${getTimerColor()}
          ${isWarning ? 'animate-pulse' : ''}
        `}
        role="timer"
        aria-live="polite"
        aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
      >
        {/* Clock icon */}
        <svg
          className={`w-5 h-5 mr-2 ${isCritical ? 'animate-bounce' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Time display */}
        <span className="tabular-nums">{formatTime(timeRemaining)}</span>

        {/* Warning indicator */}
        {isWarning && (
          <svg
            className="w-4 h-4 ml-2 text-error-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`
            h-2 rounded-full transition-all duration-1000 ease-linear
            ${isWarning ? 'bg-error-500' : 'bg-primary-500'}
          `}
          style={{ width: `${getProgressPercentage()}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Time status text */}
      <div className="mt-2 text-center">
        <span
          className={`text-sm ${isWarning ? 'text-error-600 font-medium' : 'text-gray-600'}`}
        >
          {isWarning
            ? `⚠️ Time running out! / സമയം തീരുന്നു!`
            : `Time remaining / ബാക്കി സമയം`}
        </span>
      </div>

      {/* Screen reader announcements for time milestones */}
      <div className="sr-only" aria-live="assertive">
        {timeRemaining === 600 && '10 minutes remaining'}
        {timeRemaining === 300 && '5 minutes remaining'}
        {timeRemaining === 120 && '2 minutes remaining'}
        {timeRemaining === 60 && '1 minute remaining'}
        {timeRemaining === 30 && '30 seconds remaining'}
        {timeRemaining === 10 && '10 seconds remaining'}
        {timeRemaining === 0 && 'Time is up'}
      </div>
    </div>
  );
};
