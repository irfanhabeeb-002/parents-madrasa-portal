import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { useInstallPrompt } from './InstallPrompt';
import { useTheme } from '../../contexts/ThemeContext';
import { analyticsService } from '../../services/AnalyticsService';
import {
  trackInstallStarted,
  trackInstallCompleted,
  trackInstallFailed,
  trackInstallCancelled,
} from '../../utils/installAnalytics';
import { usePWAInstallCleanup } from '../../hooks/usePWAInstallCleanup';
import {
  getInstallState,
  createDisplayModeListener,
} from '../../utils/installStateDetection';
import {
  INSTALL_LOCALIZATION,
  getBilingualAriaLabel,
} from '../../constants/installLocalization';
import { PWAInstallErrorBoundary } from './PWAInstallErrorBoundary';
import PWAErrorHandler, { PWAErrorType } from '../../utils/pwaErrorHandling';

interface InstallButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
  onInstallStart?: () => void;
  onInstallComplete?: (success: boolean) => void;
  source?: string; // Track where the button was clicked from
  placement?: 'settings' | 'navbar' | 'inline' | 'modal'; // Track UI context
  fallbackBehavior?: 'hide' | 'disable' | 'show-message'; // How to handle unavailable state
  forceShow?: boolean; // Force show button even when not installable (for testing/debugging)
  showLoadingState?: boolean; // Whether to show loading states
  showErrorState?: boolean; // Whether to show error states
}

export const InstallButton: React.FC<InstallButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  showIcon = true,
  children,
  onInstallStart,
  onInstallComplete,
  source = 'unknown',
  placement = 'inline',
  fallbackBehavior = 'hide',
  forceShow = false,
  showLoadingState = true,
  showErrorState = true,
}) => {
  const {
    isInstallable,
    isInstalled,
    installState,
    promptInstall,
    wasRecentlyDismissed,
  } = useInstallPrompt();
  const { theme, isHighContrast, prefersReducedMotion } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);

  // Enhanced cleanup and memory management
  const { registerCleanup, performCleanup, isMounted } =
    usePWAInstallCleanup('InstallButton');

  // Enhanced install state detection
  const [enhancedInstallState, setEnhancedInstallState] = useState(() =>
    getInstallState()
  );

  // Update enhanced state when install state changes
  useEffect(() => {
    const currentState = getInstallState();
    setEnhancedInstallState(currentState);

    // Determine if button should be available based on placement and state
    let shouldBeAvailable = false;

    if (forceShow) {
      shouldBeAvailable = true;
    } else if (isInstallable && !isInstalled) {
      shouldBeAvailable = true;
    } else if (
      placement === 'settings' &&
      currentState.installMethod !== 'not-supported'
    ) {
      shouldBeAvailable = true;
    }

    setIsAvailable(shouldBeAvailable);

    // Clear error state when install state changes
    if (hasError && shouldBeAvailable) {
      setHasError(false);
      setErrorMessage('');
    }
  }, [
    isInstalled,
    isInstallable,
    installState,
    forceShow,
    placement,
    hasError,
  ]);

  // Listen for display mode changes with cleanup management
  useEffect(() => {
    const cleanup = createDisplayModeListener(_displayMode => {
      if (!isMounted()) {
        console.warn(
          'InstallButton: Display mode change detected after unmount'
        );
        return;
      }
      // Display mode changed, update state
      const currentState = getInstallState();
      setEnhancedInstallState(currentState);
    });

    // Register cleanup with our cleanup manager
    registerCleanup(cleanup);

    return cleanup;
  }, [registerCleanup, isMounted]);

  // Show different states based on enhanced install status
  if (enhancedInstallState.isInstalled || isInstalled) {
    const isDark = theme === 'dark';
    const statusStyles = isHighContrast
      ? 'flex items-center text-sm text-black bg-white px-4 py-3 rounded-lg border-2 border-black min-h-[48px] forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText'
      : isDark
        ? 'flex items-center text-sm text-green-400 bg-green-900/20 px-4 py-3 rounded-lg border border-green-700/50 min-h-[48px]'
        : 'flex items-center text-sm text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-200 min-h-[48px]';

    return (
      <div className={statusStyles}>
        <svg
          className="w-4 h-4 mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <div className="flex flex-col">
          <span>{INSTALL_LOCALIZATION.english.status.installed}</span>
          <span className="text-xs opacity-75 mt-1" lang="ml">
            {INSTALL_LOCALIZATION.malayalam.status.installed}
          </span>
          <span className="text-xs opacity-60 mt-1">
            ({enhancedInstallState.displayMode})
          </span>
        </div>
      </div>
    );
  }

  if (
    enhancedInstallState.installMethod === 'not-supported' ||
    installState === 'not-supported'
  ) {
    const isDark = theme === 'dark';
    const statusStyles = isHighContrast
      ? 'flex items-center text-sm text-black bg-white px-4 py-3 rounded-lg border-2 border-black min-h-[48px] forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText'
      : isDark
        ? 'flex items-center text-sm text-gray-400 bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-700 min-h-[48px]'
        : 'flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 min-h-[48px]';

    return (
      <div className={statusStyles}>
        <svg
          className="w-4 h-4 mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex flex-col">
          <span>{INSTALL_LOCALIZATION.english.status.notAvailable}</span>
          <span className="text-xs opacity-75 mt-1" lang="ml">
            {INSTALL_LOCALIZATION.malayalam.status.notAvailable}
          </span>
          <span className="text-xs opacity-60 mt-1">
            (
            {enhancedInstallState.browserInfo.isIOS
              ? 'iOS'
              : enhancedInstallState.browserInfo.isAndroid
                ? 'Android'
                : 'Desktop'}
            )
          </span>
        </div>
      </div>
    );
  }

  if (wasRecentlyDismissed) {
    const isDark = theme === 'dark';
    const statusStyles = isHighContrast
      ? 'flex items-center text-sm text-black bg-white px-4 py-3 rounded-lg border-2 border-black min-h-[48px] forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText'
      : isDark
        ? 'flex items-center text-sm text-gray-400 bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-700 min-h-[48px]'
        : 'flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 min-h-[48px]';

    return (
      <div className={statusStyles}>
        <div className="flex flex-col">
          <span>{INSTALL_LOCALIZATION.english.status.dismissed}</span>
          <span className="text-xs opacity-75 mt-1" lang="ml">
            {INSTALL_LOCALIZATION.malayalam.status.dismissed}
          </span>
        </div>
      </div>
    );
  }

  // Enhanced retry function
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    handleInstall();
  };

  // Classify install errors for proper handling
  const classifyInstallError = (error: unknown): PWAErrorType => {
    if (!(error instanceof Error)) {
      return PWAErrorType.UNKNOWN_ERROR;
    }

    const message = error.message.toLowerCase();
    
    if (message.includes('prompt') || message.includes('beforeinstallprompt')) {
      return PWAErrorType.PROMPT_FAILED;
    }
    if (message.includes('user') && message.includes('cancel')) {
      return PWAErrorType.USER_CHOICE_TIMEOUT;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return PWAErrorType.NETWORK_ERROR;
    }
    if (message.includes('permission')) {
      return PWAErrorType.PERMISSION_DENIED;
    }
    if (message.includes('already') && message.includes('install')) {
      return PWAErrorType.ALREADY_INSTALLED;
    }
    
    return PWAErrorType.INSTALLATION_FAILED;
  };

  // Enhanced conditional rendering based on placement and fallback behavior
  if (!isAvailable) {
    switch (fallbackBehavior) {
      case 'hide':
        return null;
      case 'disable':
        // Continue to render but in disabled state
        break;
      case 'show-message':
        // Show informational message instead of button
        const isDark = theme === 'dark';
        const messageStyles = isHighContrast
          ? 'flex items-center text-sm text-black bg-white px-4 py-3 rounded-lg border-2 border-black min-h-[48px] forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText'
          : isDark
            ? 'flex items-center text-sm text-gray-400 bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-700 min-h-[48px]'
            : 'flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 min-h-[48px]';

        return (
          <div className={messageStyles}>
            <svg
              className="w-4 h-4 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex flex-col">
              <span>{INSTALL_LOCALIZATION.english.status.notAvailable}</span>
              <span className="text-xs opacity-75 mt-1" lang="ml">
                {INSTALL_LOCALIZATION.malayalam.status.notAvailable}
              </span>
              <span className="text-xs opacity-60 mt-1">
                (
                {enhancedInstallState.browserInfo.isIOS
                  ? 'iOS'
                  : enhancedInstallState.browserInfo.isAndroid
                    ? 'Android'
                    : 'Desktop'}
                )
              </span>
              {placement === 'settings' && (
                <span className="text-xs opacity-60 mt-1">
                  Check your browser settings for manual installation options
                </span>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  const handleInstall = async () => {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(showLoadingState);
      setHasError(false);
      setErrorMessage('');

      // Track install button click with enhanced analytics
      trackInstallStarted({
        source: source as any,
        placement: placement as any,
        trigger: 'user_click',
        component: 'InstallButton',
        retryCount,
        sessionDuration:
          Date.now() -
          (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
            Date.now()),
      });

      // Legacy analytics for backward compatibility
      analyticsService.trackEvent({
        action: 'install_button_clicked',
        category: 'pwa',
        label: source,
        custom_parameters: {
          source,
          placement,
          button_variant: variant,
          button_size: size,
          install_state: installState,
          enhanced_install_state: enhancedInstallState.installMethod,
          display_mode: enhancedInstallState.displayMode,
          browser_info: JSON.stringify(enhancedInstallState.browserInfo),
          confidence: enhancedInstallState.confidence,
          retry_count: retryCount,
          session_time:
            Date.now() -
            (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
              Date.now()),
        },
      });

      onInstallStart?.();
      const success = await promptInstall();

      if (success) {
        // Reset retry count on success
        setRetryCount(0);
      }

      // Track install result with enhanced analytics
      if (success) {
        trackInstallCompleted({
          source: source as any,
          placement: placement as any,
          trigger: 'user_click',
          component: 'InstallButton',
          retryCount,
          sessionDuration:
            Date.now() -
            (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
              Date.now()),
        });
      } else {
        trackInstallCancelled({
          source: source as any,
          placement: placement as any,
          trigger: 'user_click',
          component: 'InstallButton',
          reason: 'user_cancelled',
          sessionDuration:
            Date.now() -
            (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
              Date.now()),
        });
      }

      // Legacy analytics for backward compatibility
      analyticsService.trackEvent({
        action: 'install_button_result',
        category: 'pwa',
        label: success ? 'success' : 'failed',
        custom_parameters: {
          source,
          placement,
          success,
          button_variant: variant,
          install_state: installState,
          enhanced_install_state: enhancedInstallState.installMethod,
          display_mode: enhancedInstallState.displayMode,
          confidence: enhancedInstallState.confidence,
          retry_count: retryCount,
        },
      });

      onInstallComplete?.(success);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Install button error:', error);

      // Use comprehensive PWA error handling
      const errorType = classifyInstallError(error);
      const pwaError = PWAErrorHandler.createError(
        errorType,
        errorMsg,
        {
          component: 'InstallButton',
          source,
          placement,
          userAgent: navigator.userAgent,
          browserInfo: enhancedInstallState.browserInfo,
          installState: enhancedInstallState.installMethod
        },
        error instanceof Error ? error : undefined
      );
      
      PWAErrorHandler.handleError(pwaError);

      // Set error state for UI feedback
      if (showErrorState) {
        setHasError(true);
        setErrorMessage(errorMsg);
      }

      // Increment retry count
      setRetryCount(prev => prev + 1);

      // Track install error with enhanced analytics
      trackInstallFailed({
        source: source as any,
        placement: placement as any,
        trigger: 'user_click',
        component: 'InstallButton',
        errorType:
          error instanceof Error ? error.constructor.name : 'UnknownError',
        errorMessage: errorMsg,
        errorStack: error instanceof Error ? error.stack : undefined,
        retryCount,
        sessionDuration:
          Date.now() -
          (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
            Date.now()),
      });

      // Legacy analytics for backward compatibility
      analyticsService.trackEvent({
        action: 'install_button_error',
        category: 'pwa',
        label: 'error',
        custom_parameters: {
          source,
          placement,
          error_message: errorMsg,
          error_type:
            error instanceof Error ? error.constructor.name : 'UnknownError',
          button_variant: variant,
          install_state: installState,
          enhanced_install_state: enhancedInstallState.installMethod,
          display_mode: enhancedInstallState.displayMode,
          confidence: enhancedInstallState.confidence,
          retry_count: retryCount,
        },
      });

      onInstallComplete?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Theme-aware styling with consistent primary color (#3b82f6) and enhanced accessibility
  const getVariantStyles = () => {
    // Error state styling
    if (hasError && showErrorState) {
      if (isHighContrast) {
        return 'bg-white text-black border-2 border-red-600 hover:bg-red-50 focus:bg-red-50 active:bg-red-100 forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText';
      }

      const isDark = theme === 'dark';
      return isDark
        ? 'bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 active:bg-red-800 border border-red-600 hover:border-red-700'
        : 'bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 active:bg-red-800 border border-red-600 hover:border-red-700';
    }

    // Disabled state styling (when not available)
    if (!isAvailable && fallbackBehavior === 'disable') {
      if (isHighContrast) {
        return 'bg-gray-300 text-gray-600 border-2 border-gray-400 cursor-not-allowed forced-colors:bg-GrayText forced-colors:text-ButtonFace forced-colors:border-GrayText';
      }

      const isDark = theme === 'dark';
      return isDark
        ? 'bg-gray-700 text-gray-400 border border-gray-600 cursor-not-allowed'
        : 'bg-gray-300 text-gray-500 border border-gray-400 cursor-not-allowed';
    }

    if (isHighContrast) {
      switch (variant) {
        case 'primary':
          return 'bg-black text-white border-2 border-white hover:bg-gray-800 focus:bg-gray-800 active:bg-gray-900 forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText';
        case 'secondary':
          return 'bg-white text-black border-2 border-black hover:bg-gray-200 focus:bg-gray-200 active:bg-gray-300 forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText';
        default:
          return 'bg-black text-white border-2 border-white hover:bg-gray-800 focus:bg-gray-800 active:bg-gray-900 forced-colors:bg-ButtonFace forced-colors:text-ButtonText forced-colors:border-ButtonText';
      }
    }

    const isDark = theme === 'dark';

    switch (variant) {
      case 'primary':
        return isDark
          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 border border-blue-600 hover:border-blue-700 shadow-lg hover:shadow-xl focus:shadow-xl'
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 border border-blue-600 hover:border-blue-700 shadow-lg hover:shadow-xl focus:shadow-xl';
      case 'secondary':
        return isDark
          ? 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 focus:bg-gray-600 active:bg-gray-500 hover:border-gray-500 focus:border-gray-500'
          : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 focus:bg-blue-50 active:bg-blue-100 hover:border-blue-400 focus:border-blue-400';
      default:
        return isDark
          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 border border-blue-600'
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 border border-blue-600';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-3 text-sm min-h-[48px] min-w-[48px]'; // Ensure minimum touch target
      case 'md':
        return 'px-5 py-3 text-base min-h-[48px] min-w-[48px]'; // Ensure minimum touch target
      case 'lg':
        return 'px-6 py-4 text-lg min-h-[56px] min-w-[56px]'; // Larger touch target for lg
      default:
        return 'px-5 py-3 text-base min-h-[48px] min-w-[48px]'; // Ensure minimum touch target
    }
  };

  const baseStyles = [
    // Layout and display
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-lg', // Consistent with design system
    'touch-manipulation',
    // Enhanced focus styles for accessibility
    'focus:outline-none',
    'focus-visible:outline-2',
    'focus-visible:outline-blue-600',
    'focus-visible:outline-offset-2',
    'focus-visible:ring-4',
    'focus-visible:ring-blue-500/20',
    // High contrast mode support
    'forced-colors:border-2',
    'forced-colors:border-ButtonText',
    'forced-colors:focus-visible:outline-ButtonText',
    // Disabled states
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:pointer-events-none',
    // Tap highlight removal for custom styling
    'tap-highlight-transparent',
  ].join(' ');

  const animationStyles = prefersReducedMotion
    ? 'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:active:scale-100'
    : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 transform';

  const buttonStyles = `${baseStyles} ${getVariantStyles()} ${getSizeStyles()} ${animationStyles} ${className}`;

  const getButtonIcon = () => {
    if (isLoading) {
      return (
        <svg
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} ${children || hasError ? 'mr-2' : ''} animate-spin`}
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
      );
    }

    if (hasError && showErrorState) {
      return (
        <svg
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} ${children || hasError ? 'mr-2' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      );
    }

    if (showIcon) {
      return (
        <svg
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} ${children ? 'mr-2' : ''}`}
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
      );
    }

    return null;
  };

  const getButtonText = () => {
    if (isLoading) {
      return {
        primary: INSTALL_LOCALIZATION.english.actions.installing,
        secondary: null,
      };
    }

    if (hasError && showErrorState) {
      return {
        primary: retryCount > 0 ? 'Retry Install' : 'Install Failed',
        secondary: placement === 'settings' ? 'Tap to retry' : null,
      };
    }

    return {
      primary: children || INSTALL_LOCALIZATION.english.buttonText,
      secondary: children
        ? INSTALL_LOCALIZATION.malayalam.actions.install
        : INSTALL_LOCALIZATION.malayalam.buttonText,
    };
  };

  const buttonText = getButtonText();

  const defaultContent = (
    <>
      {getButtonIcon()}
      <span className="flex flex-col items-center">
        <span>{buttonText.primary}</span>
        {!isLoading && buttonText.secondary && (
          <span className="text-xs opacity-75 mt-1" lang="ml">
            {buttonText.secondary}
          </span>
        )}
        {hasError &&
          showErrorState &&
          placement === 'settings' &&
          errorMessage && (
            <span className="text-xs opacity-60 mt-1 text-center">
              {errorMessage}
            </span>
          )}
      </span>
    </>
  );

  // Determine if button should be disabled
  const isDisabled =
    isLoading || (!isAvailable && fallbackBehavior === 'disable');

  // Determine click handler
  const clickHandler = hasError && showErrorState ? handleRetry : handleInstall;

  // Enhanced aria label with state information
  const getAriaLabel = () => {
    let baseLabel = getBilingualAriaLabel('installButton');

    if (isLoading) {
      baseLabel += '. Installation in progress.';
    } else if (hasError && showErrorState) {
      baseLabel += `. Installation failed. ${retryCount > 0 ? 'Tap to retry.' : 'Tap to try again.'}`;
    } else if (!isAvailable && fallbackBehavior === 'disable') {
      baseLabel += '. Installation not currently available.';
    }

    if (placement === 'settings') {
      baseLabel += ' Located in app settings.';
    }

    return baseLabel;
  };

  const renderInstallButton = () => (
    <AccessibleButton
      onClick={clickHandler}
      className={buttonStyles}
      ariaLabel={getAriaLabel()}
      variant={hasError ? 'secondary' : variant}
      size={size}
      disabled={isDisabled}
    >
      {defaultContent}
    </AccessibleButton>
  );

  return (
    <PWAInstallErrorBoundary
      componentName="InstallButton"
      source={source}
      placement={placement}
      onError={(error, errorInfo) => {
        console.error(
          'InstallButton Error Boundary triggered:',
          error,
          errorInfo
        );
        // Perform cleanup on error
        performCleanup();
      }}
    >
      {renderInstallButton()}
    </PWAInstallErrorBoundary>
  );
};
