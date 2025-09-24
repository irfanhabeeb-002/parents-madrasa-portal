import React, { useState, useEffect } from 'react';
import { useInstallPrompt } from './InstallPrompt';
import { useTheme } from '../../contexts/ThemeContext';
import {
  INSTALL_LOCALIZATION,
  getBilingualAriaLabel,
} from '../../constants/installLocalization';
import {
  trackFallbackShown,
  trackInstallStarted,
  trackInstallCompleted,
  trackInstallFailed,
  trackInstallCancelled,
} from '../../utils/installAnalytics';
import { usePWAInstallCleanup } from '../../hooks/usePWAInstallCleanup';
import { PWAInstallErrorBoundary } from './PWAInstallErrorBoundary';

interface FallbackInstallButtonProps {
  className?: string;
  showAfterDelay?: number; // Show fallback after X milliseconds if no automatic prompt
  placement?: 'navbar' | 'floating' | 'inline';
}

export const FallbackInstallButton: React.FC<FallbackInstallButtonProps> = ({
  className = '',
  showAfterDelay = 10000, // 10 seconds default
  placement = 'navbar',
}) => {
  const {
    isInstallable,
    isInstalled,
    installState,
    promptInstall,
    wasRecentlyDismissed,
  } = useInstallPrompt();
  const { theme, isHighContrast, prefersReducedMotion } = useTheme();
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced cleanup and memory management
  const { createTimer, clearSessionStorage, performCleanup, isMounted } =
    usePWAInstallCleanup('FallbackInstallButton');

  // Hide fallback immediately when app becomes installed
  useEffect(() => {
    if (isInstalled) {
      setShowFallback(false);
      // Clear any dismissal tracking since app is now installed using cleanup utility
      clearSessionStorage(['pwa-fallback-dismissed']);
    }
  }, [isInstalled, clearSessionStorage]);

  // Enhanced fallback detection logic with cleanup management
  useEffect(() => {
    if (!isInstallable || isInstalled || wasRecentlyDismissed) {
      setShowFallback(false);
      return;
    }

    // Check if user has already dismissed fallback in this session
    const fallbackDismissed = sessionStorage.getItem('pwa-fallback-dismissed');
    if (fallbackDismissed) {
      const dismissedAt = parseInt(fallbackDismissed);
      const hoursSinceDismissal = (Date.now() - dismissedAt) / (1000 * 60 * 60);

      // Don't show again for 2 hours after dismissal
      if (hoursSinceDismissal < 2) {
        return;
      }
    }

    const timer = createTimer(
      () => {
        // Enhanced conditions for showing fallback
        if (
          isInstallable &&
          !isInstalled &&
          !wasRecentlyDismissed &&
          // Only show if no automatic install banner is currently visible
          !document.querySelector(
            '[role="banner"][aria-label="Install app banner"]'
          ) &&
          // Only show if no install modal is currently open
          !document.querySelector(
            '[role="dialog"][aria-labelledby*="install"]'
          ) &&
          isMounted()
        ) {
          setShowFallback(true);

          // Track fallback button shown with enhanced analytics
          trackFallbackShown({
            source: 'fallback_button',
            placement: placement as any,
            trigger: 'fallback_detection',
            component: 'FallbackInstallButton',
            sessionDuration:
              Date.now() -
              (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
                Date.now()),
          });

          console.log(
            'Fallback install button shown after automatic prompt delay'
          );
        }
      },
      showAfterDelay,
      'fallback_detection'
    );

    // Timer cleanup is handled automatically by the cleanup hook
  }, [
    isInstallable,
    isInstalled,
    wasRecentlyDismissed,
    showAfterDelay,
    createTimer,
    isMounted,
  ]);

  // Don't show if not installable, already installed, or recently dismissed
  if (!isInstallable || isInstalled || wasRecentlyDismissed || !showFallback) {
    return null;
  }

  const handleInstall = async () => {
    if (isLoading) {
      return;
    }

    const startTime = Date.now();

    try {
      setIsLoading(true);

      // Track fallback install attempt with enhanced analytics
      trackInstallStarted({
        source: 'fallback_button',
        placement: placement as any,
        trigger: 'user_click',
        component: 'FallbackInstallButton',
        sessionDuration:
          Date.now() -
          (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
            Date.now()),
      });

      console.log('Fallback install button clicked, attempting installation');

      const success = await promptInstall();
      const duration = Date.now() - startTime;

      if (success) {
        setShowFallback(false);
        // Clear dismissal tracking since user successfully installed
        sessionStorage.removeItem('pwa-fallback-dismissed');

        // Track successful installation
        trackInstallCompleted({
          source: 'fallback_button',
          placement: placement as any,
          trigger: 'user_click',
          component: 'FallbackInstallButton',
          duration,
          sessionDuration:
            Date.now() -
            (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
              Date.now()),
        });

        console.log('Fallback install successful');
      } else {
        // Track cancellation
        trackInstallCancelled({
          source: 'fallback_button',
          placement: placement as any,
          trigger: 'user_click',
          component: 'FallbackInstallButton',
          reason: 'user_cancelled',
          duration,
          sessionDuration:
            Date.now() -
            (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
              Date.now()),
        });

        console.log('Fallback install was dismissed or failed');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Track installation error
      trackInstallFailed({
        source: 'fallback_button',
        placement: placement as any,
        trigger: 'user_click',
        component: 'FallbackInstallButton',
        errorType:
          error instanceof Error ? error.constructor.name : 'UnknownError',
        errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        duration,
        sessionDuration:
          Date.now() -
          (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
            Date.now()),
      });

      console.error('Fallback install error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowFallback(false);
    // Remember dismissal for a short time (2 hours)
    sessionStorage.setItem('pwa-fallback-dismissed', Date.now().toString());

    // Track fallback dismissal with enhanced analytics
    trackInstallCancelled({
      source: 'fallback_button',
      placement: placement as any,
      trigger: 'user_click',
      component: 'FallbackInstallButton',
      reason: 'user_dismissed',
      sessionDuration:
        Date.now() -
        (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
          Date.now()),
    });

    console.log('Fallback install button dismissed by user');
  };

  // Get styles based on placement and theme - consistent with design system
  const getButtonStyles = () => {
    const baseStyles = [
      'inline-flex items-center justify-center font-medium rounded-lg',
      'focus:outline-none focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2',
      'focus-visible:ring-4 focus-visible:ring-blue-500/20',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'touch-manipulation tap-highlight-transparent',
      'min-h-[48px] min-w-[48px]', // Ensure minimum touch target
      prefersReducedMotion
        ? 'motion-reduce:transition-none'
        : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95',
    ].join(' ');

    if (isHighContrast) {
      return `${baseStyles} bg-black text-white border-2 border-white hover:bg-gray-800 focus:bg-gray-800 active:bg-gray-900 forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText`;
    }

    const isDark = theme === 'dark';
    const primaryStyles = isDark
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 border border-blue-600 hover:border-blue-700 shadow-lg hover:shadow-xl focus:shadow-xl'
      : 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 border border-blue-600 hover:border-blue-700 shadow-lg hover:shadow-xl focus:shadow-xl';

    switch (placement) {
      case 'navbar':
        return `${baseStyles} ${primaryStyles} px-3 py-2 text-sm`;
      case 'floating':
        return `${baseStyles} ${primaryStyles} px-4 py-3 text-base`;
      case 'inline':
        return `${baseStyles} ${primaryStyles} px-4 py-2 text-base`;
      default:
        return `${baseStyles} ${primaryStyles} px-3 py-2 text-sm`;
    }
  };

  const getContainerStyles = () => {
    switch (placement) {
      case 'floating':
        return 'fixed bottom-4 right-4 z-50 max-w-sm';
      case 'navbar':
        return 'relative';
      case 'inline':
        return 'w-full';
      default:
        return 'relative';
    }
  };

  if (placement === 'floating') {
    const cardStyles = isHighContrast
      ? 'bg-white text-black border-2 border-black forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText'
      : theme === 'dark'
        ? 'bg-gray-800 text-white border border-gray-700 shadow-2xl'
        : 'bg-white text-gray-900 border border-gray-200 shadow-2xl';

    return (
      <div className={`${getContainerStyles()} ${className}`}>
        <div
          className={`${cardStyles} rounded-lg p-4`}
          role="banner"
          aria-live="polite"
          aria-label="Install app suggestion"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4
                className={`font-semibold text-sm mb-1 ${isHighContrast ? 'text-black' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
              >
                {INSTALL_LOCALIZATION.english.buttonText}
              </h4>
              <p
                className={`text-xs mb-1 ${isHighContrast ? 'text-black' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Quick access & offline mode
              </p>
              <p
                className={`text-xs ${isHighContrast ? 'text-black' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                lang="ml"
                aria-label={`Malayalam translation: ${INSTALL_LOCALIZATION.malayalam.buttonText}`}
              >
                {INSTALL_LOCALIZATION.malayalam.buttonText}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className={`p-1 ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isHighContrast
                  ? 'text-black hover:text-gray-600 hover:bg-gray-200'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              } ${prefersReducedMotion ? '' : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95'}`}
              aria-label={getBilingualAriaLabel('dismissBanner')}
              title="Dismiss install suggestion"
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
          <button
            onClick={handleInstall}
            disabled={isLoading}
            className={`${getButtonStyles()} w-full justify-center`}
            aria-label={getBilingualAriaLabel('installButton')}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>{INSTALL_LOCALIZATION.english.actions.installing}</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="flex flex-col items-center">
                  <span>{INSTALL_LOCALIZATION.english.actions.install}</span>
                  <span className="text-xs opacity-75 mt-1" lang="ml">
                    {INSTALL_LOCALIZATION.malayalam.actions.install}
                  </span>
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const renderFallbackButton = () => (
    <div className={`${getContainerStyles()} ${className}`}>
      <button
        onClick={handleInstall}
        disabled={isLoading}
        className={getButtonStyles()}
        aria-label={getBilingualAriaLabel('installButton')}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{INSTALL_LOCALIZATION.english.actions.installing}</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            {placement === 'navbar' ? (
              <span>{INSTALL_LOCALIZATION.english.actions.install}</span>
            ) : (
              <span className="flex flex-col items-center">
                <span>{INSTALL_LOCALIZATION.english.buttonText}</span>
                <span className="text-xs opacity-75 mt-1" lang="ml">
                  {INSTALL_LOCALIZATION.malayalam.buttonText}
                </span>
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );

  return (
    <PWAInstallErrorBoundary
      componentName="FallbackInstallButton"
      source="fallback_button"
      placement={placement}
      onError={(error, errorInfo) => {
        console.error(
          'FallbackInstallButton Error Boundary triggered:',
          error,
          errorInfo
        );
        // Perform cleanup on error
        performCleanup();
      }}
    >
      {renderFallbackButton()}
    </PWAInstallErrorBoundary>
  );
};
