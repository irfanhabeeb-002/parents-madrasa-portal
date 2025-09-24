import React, { useEffect, useRef, useMemo } from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { useServiceWorkerUpdate } from '../../hooks/useServiceWorkerUpdate';
import { useTheme } from '../../contexts/ThemeContext';

interface UpdateNotificationProps {
  className?: string;
  autoShow?: boolean;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  className = '',
  autoShow = true,
}) => {
  const { theme, isHighContrast, prefersReducedMotion } = useTheme();
  const {
    updateAvailable,
    isUpdating,
    updateError,
    updateServiceWorker,
    dismissUpdate,
  } = useServiceWorkerUpdate();

  // Refs for accessibility
  const notificationRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Screen reader announcement function
  const announceToScreenReader = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  // Focus management when notification appears
  useEffect(() => {
    if (updateAvailable && notificationRef.current && autoShow) {
      // Announce to screen readers
      announceToScreenReader(
        'App update available. You can update now for the latest features.'
      );

      // Focus the notification for accessibility
      setTimeout(() => {
        notificationRef.current?.focus();
      }, 100);
    }
  }, [updateAvailable, autoShow]);

  // Announce update status changes
  useEffect(() => {
    if (isUpdating) {
      announceToScreenReader('Updating app, please wait...');
    }
  }, [isUpdating]);

  useEffect(() => {
    if (updateError) {
      announceToScreenReader(`Update failed: ${updateError}`);
    }
  }, [updateError]);

  // Memoized theme-aware styles
  const notificationStyles = useMemo(() => {
    if (isHighContrast) {
      return {
        background: 'bg-black',
        text: 'text-white',
        border: 'border-white border-2',
        shadow: 'shadow-2xl',
      };
    }

    if (theme === 'dark') {
      return {
        background: 'bg-blue-600',
        text: 'text-white',
        border: 'border-blue-700',
        shadow: 'shadow-2xl',
      };
    }

    return {
      background: 'bg-blue-700',
      text: 'text-white',
      border: 'border-blue-800',
      shadow: 'shadow-2xl',
    };
  }, [theme, isHighContrast]);

  const buttonStyles = useMemo(() => {
    if (isHighContrast) {
      return {
        primary: 'bg-white text-black hover:bg-gray-200 border-2 border-black',
        secondary:
          'bg-black text-white hover:bg-gray-800 border-2 border-white',
      };
    }

    if (theme === 'dark') {
      return {
        primary: 'bg-white text-blue-600 hover:bg-blue-50',
        secondary: 'bg-blue-600 hover:bg-blue-700 text-white',
      };
    }

    return {
      primary: 'bg-white text-blue-700 hover:bg-blue-50',
      secondary: 'bg-blue-700 hover:bg-blue-800 text-white',
    };
  }, [theme, isHighContrast]);

  // Positioning classes
  const positionClasses = useMemo(() => {
    const baseClasses = `fixed top-4 left-4 right-4 z-50 max-w-md mx-auto md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 ${className}`;
    const animationClasses = prefersReducedMotion
      ? ''
      : 'transition-all duration-300 ease-in-out transform';
    return `${baseClasses} ${animationClasses}`;
  }, [className, prefersReducedMotion]);

  // Don't render if update is not available and autoShow is true
  if (!updateAvailable && autoShow) {
    return (
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
    );
  }

  // Check if update was recently dismissed
  const dismissedTime = sessionStorage.getItem('updateDismissed');
  const recentlyDismissed =
    dismissedTime && Date.now() - parseInt(dismissedTime) < 300000; // 5 minutes

  if (recentlyDismissed && autoShow) {
    return (
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
    );
  }

  return (
    <>
      <div
        ref={notificationRef}
        className={positionClasses}
        role="alert"
        aria-live="assertive"
        aria-label="App update notification"
        tabIndex={-1}
      >
        <div
          className={`${notificationStyles.background} ${notificationStyles.text} p-4 rounded-lg ${notificationStyles.shadow} border ${notificationStyles.border}`}
          role="region"
          aria-labelledby="update-notification-title"
          aria-describedby="update-notification-description"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Update Icon */}
              <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  id="update-notification-title"
                  className="font-semibold text-sm mb-1"
                >
                  App Update Available
                </h3>
                <p
                  id="update-notification-description"
                  className={`text-sm mb-2 ${isHighContrast ? 'text-white' : theme === 'dark' ? 'text-blue-100' : 'text-blue-100'}`}
                >
                  A new version is ready with improvements and bug fixes
                </p>
                <p
                  className={`text-sm ${isHighContrast ? 'text-white' : theme === 'dark' ? 'text-blue-200' : 'text-blue-200'}`}
                  lang="ml"
                  aria-label="Malayalam translation: A new version is ready with improvements and bug fixes"
                >
                  മെച്ചപ്പെടുത്തലുകളും ബഗ് ഫിക്സുകളുമുള്ള പുതിയ പതിപ്പ്
                  തയ്യാറാണ്
                </p>

                {updateError && (
                  <div
                    className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm"
                    role="alert"
                    aria-live="polite"
                  >
                    <strong>Update Error:</strong> {updateError}
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={dismissUpdate}
              disabled={isUpdating}
              className={`p-1 ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${
                isHighContrast
                  ? 'text-white hover:text-gray-300 hover:bg-gray-800'
                  : theme === 'dark'
                    ? 'text-blue-200 hover:text-white hover:bg-blue-500'
                    : 'text-blue-200 hover:text-white hover:bg-blue-600'
              } ${
                prefersReducedMotion
                  ? ''
                  : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Dismiss update notification. You can update later from the menu."
              title="Close update notification"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-3">
            <AccessibleButton
              variant="secondary"
              size="sm"
              onClick={dismissUpdate}
              disabled={isUpdating}
              className={`${buttonStyles.secondary} min-h-[44px] flex-1 sm:flex-initial ${
                prefersReducedMotion
                  ? ''
                  : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              ariaLabel="Update later. Dismiss this notification and update when convenient."
            >
              <span className="text-sm">Later</span>
            </AccessibleButton>

            <AccessibleButton
              variant="primary"
              size="sm"
              onClick={updateServiceWorker}
              disabled={isUpdating}
              className={`${buttonStyles.primary} min-h-[44px] flex-1 sm:flex-initial ${
                prefersReducedMotion
                  ? ''
                  : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              ariaLabel="Update app now. This will refresh the page with the latest version."
            >
              <div className="flex items-center justify-center space-x-2">
                {isUpdating && (
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                <span className="text-sm">
                  {isUpdating ? 'Updating...' : 'Update Now'}
                </span>
              </div>
            </AccessibleButton>
          </div>
        </div>
      </div>

      {/* Screen Reader Announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
    </>
  );
};

/**
 * Manual Update Trigger Component
 * Can be used in settings or menu to allow users to manually check for updates
 */
export const ManualUpdateTrigger: React.FC<{
  className?: string;
  variant?: 'button' | 'menu-item';
}> = ({ className = '', variant = 'button' }) => {
  const { updateAvailable, isUpdating, updateError, updateServiceWorker } =
    useServiceWorkerUpdate();

  const handleManualUpdate = async () => {
    if (updateAvailable) {
      await updateServiceWorker();
    } else {
      // Force check for updates by reloading service worker registration
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
    }
  };

  if (variant === 'menu-item') {
    return (
      <button
        onClick={handleManualUpdate}
        disabled={isUpdating}
        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label={
          updateAvailable ? 'Update app now' : 'Check for app updates'
        }
      >
        <div className="flex items-center space-x-2">
          {isUpdating ? (
            <svg
              className="animate-spin w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
          <span>
            {isUpdating
              ? 'Updating...'
              : updateAvailable
                ? 'Update Available'
                : 'Check for Updates'}
          </span>
          {updateAvailable && (
            <span
              className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
              aria-hidden="true"
            />
          )}
        </div>
        {updateError && (
          <div className="text-xs text-red-600 mt-1">{updateError}</div>
        )}
      </button>
    );
  }

  return (
    <AccessibleButton
      onClick={handleManualUpdate}
      disabled={isUpdating}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      ariaLabel={updateAvailable ? 'Update app now' : 'Check for app updates'}
    >
      <div className="flex items-center space-x-2">
        {isUpdating ? (
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        )}
        <span>
          {isUpdating
            ? 'Updating...'
            : updateAvailable
              ? 'Update Now'
              : 'Check Updates'}
        </span>
        {updateAvailable && (
          <span
            className="ml-2 w-2 h-2 bg-blue-500 rounded-full"
            aria-hidden="true"
          />
        )}
      </div>
      {updateError && (
        <div className="text-xs text-red-600 mt-1">{updateError}</div>
      )}
    </AccessibleButton>
  );
};
