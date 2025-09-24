import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { AccessibleButton } from '../ui/AccessibleButton';
import { Modal } from '../ui/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import { useInstallPromptPerformance } from '../../utils/performance';
import { analyticsService } from '../../services/AnalyticsService';
import {
  trackInstallPromptAvailable,
  trackInstallPromptShown,
  trackInstallStarted,
  trackInstallCompleted,
  trackInstallFailed,
  trackInstallCancelled,
  trackAutomaticPromptFailed,
  installAnalyticsTracker,
} from '../../utils/installAnalytics';
import { useInstallPromptTiming } from '../../hooks/useInstallPromptTiming';
import { usePWAInstallCleanup } from '../../hooks/usePWAInstallCleanup';
import {
  createInstallStateDetector,
  getInstallState,
  createDisplayModeListener,
} from '../../utils/installStateDetection';
import {
  INSTALL_LOCALIZATION,
  getBilingualAriaLabel,
} from '../../constants/installLocalization';
import { PWAInstallErrorBoundary } from './PWAInstallErrorBoundary';
import PWAErrorHandler, { PWAErrorType } from '../../utils/pwaErrorHandling';
import PWAErrorHandlerComponent from './PWAErrorHandler';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  className?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  className = '',
}) => {
  // Component disabled - no install prompts will be shown
  return null;
  const { theme, isHighContrast, prefersReducedMotion } = useTheme();
  const { measureThemeChange, measurePositioning } =
    useInstallPromptPerformance();
  const {
    canShowPrompt,
    promptDelay,
    handleDismissal,
    handleInstallation,
    handlePromptShown,
    handlePromptInteraction,
  } = useInstallPromptTiming();

  // Enhanced cleanup and memory management
  const {
    registerCleanup,
    createTimer,
    clearTimer,
    addEventListener,
    clearSessionStorage,
    performCleanup,
    isMounted,
  } = usePWAInstallCleanup('InstallPrompt');

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Enhanced fallback detection state
  const [automaticPromptFailed, setAutomaticPromptFailed] = useState(false);
  const [fallbackPromptTimer, setFallbackPromptTimer] =
    useState<number | null>(null);
  const [currentError, setCurrentError] = useState<any>(null);
  
  // Track if the main effect has been initialized to prevent multiple runs
  const effectInitialized = useRef(false);

  // Enhanced install state detection
  const [installStateInfo, setInstallStateInfo] = useState(() =>
    getInstallState()
  );

  // Check browser support on mount
  useEffect(() => {
    const browserSupport = PWAErrorHandler.checkBrowserSupport();
    
    if (!browserSupport.supported) {
      console.warn('PWA Install: Browser support issues detected:', browserSupport.issues);
      
      // Create browser not supported error
      const browserError = PWAErrorHandler.createError(
        PWAErrorType.BROWSER_NOT_SUPPORTED,
        `Browser support issues: ${browserSupport.issues.join(', ')}`,
        {
          component: 'InstallPrompt',
          source: 'automatic_banner',
          placement: 'banner',
          userAgent: navigator.userAgent,
          browserInfo: browserSupport.browserInfo,
          installState: installStateInfo.installMethod
        }
      );
      
      // Only show error for critical issues
      const criticalIssues = browserSupport.issues.filter(issue => 
        issue.includes('Service Worker') || issue.includes('HTTPS')
      );
      
      if (criticalIssues.length > 0) {
        setCurrentError(browserError);
      }
    }
  }, [installStateInfo.installMethod]);

  // Refs for focus management
  const bannerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Screen reader announcement function
  const announceToScreenReader = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  // Memoized event handlers to prevent unnecessary re-renders
  const handleDismissBanner = useCallback(() => {
    setShowInstallBanner(false);
    handleDismissal('close_button');
    // Announce dismissal to screen readers
    announceToScreenReader('Install banner dismissed');
  }, [handleDismissal]);

  const handleShowModal = useCallback(() => {
    setShowInstallModal(true);
    setShowInstallBanner(false);
    handlePromptInteraction('learn_more', 'banner');
    // Announce modal opening to screen readers
    announceToScreenReader('Install app details modal opened');
  }, [handlePromptInteraction]);

  const handleCloseModal = useCallback(() => {
    setShowInstallModal(false);
    handleDismissal('close_button');
    announceToScreenReader('Install modal closed');
  }, [handleDismissal]);

  // Enhanced install state checking
  const checkIfInstalled = useCallback(() => {
    const currentState = getInstallState(deferredPrompt);
    setInstallStateInfo(currentState);
    setIsInstalled(currentState.isInstalled);

    // Log detailed state for debugging
    if (currentState.confidence === 'low') {
      console.warn('Low confidence install state detection:', currentState);
    }

    return currentState.isInstalled;
  }, [deferredPrompt]);

  useEffect(() => {
    // Early exit if component is not mounted or effect already initialized
    if (!isMounted() || effectInitialized.current) {
      return () => {}; // Return empty cleanup function
    }

    // Mark effect as initialized
    effectInitialized.current = true;

    // Initial install state check
    checkIfInstalled();

    // Enhanced beforeinstallprompt event handler with better error handling
    const handleBeforeInstallPrompt = (e: Event) => {
      if (!isMounted()) {
        console.warn(
          'InstallPrompt: Received beforeinstallprompt after unmount'
        );
        return;
      }

      try {
        // Ensure proper preventDefault() calling
        e.preventDefault();

        const installEvent = e as BeforeInstallPromptEvent;

        // Validate the event has required properties
        if (!installEvent.prompt || typeof installEvent.prompt !== 'function') {
          console.error(
            'Invalid beforeinstallprompt event: missing prompt method'
          );
          analyticsService.trackEvent({
            action: 'install_event_error',
            category: 'pwa',
            label: 'invalid_event_structure',
            custom_parameters: {
              error_type: 'missing_prompt_method',
              event_type: 'beforeinstallprompt',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        // Store the deferred prompt
        setDeferredPrompt(installEvent);

        // Track that the install prompt is available with enhanced analytics
        trackInstallPromptAvailable({
          source: 'automatic_banner',
          placement: 'banner',
          trigger: 'system_event',
          component: 'InstallPrompt',
        });

        // Legacy analytics for backward compatibility
        analyticsService.trackEvent({
          action: 'install_prompt_available',
          category: 'pwa',
          label: 'beforeinstallprompt_received',
          custom_parameters: {
            platforms: installEvent.platforms || [],
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
          },
        });

        // Use smart timing for install banner based on UX best practices
        const showBannerWithTiming = () => {
          if (isInstalled || !canShowPrompt) {
            console.log(
              'Install banner not shown: already installed or timing not met'
            );
            // Clear any existing fallback timer since we won't show automatic prompt
            if (fallbackPromptTimer) {
              clearTimer(fallbackPromptTimer);
              setFallbackPromptTimer(null);
            }
            return;
          }

          // Clear any existing fallback timer since we have a valid prompt
          if (fallbackPromptTimer) {
            clearTimer(fallbackPromptTimer);
            setFallbackPromptTimer(null);
          }

          const bannerTimer = createTimer(
            () => {
              if (
                !isInstalled &&
                canShowPrompt &&
                installEvent === deferredPrompt &&
                isMounted()
              ) {
                setShowInstallBanner(true);
                setAutomaticPromptFailed(false); // Reset fallback state since automatic prompt worked
                handlePromptShown('automatic');

                // Track banner shown event with enhanced analytics
                trackInstallPromptShown({
                  source: 'automatic_banner',
                  placement: 'banner',
                  trigger: 'automatic_timing',
                  component: 'InstallPrompt',
                  sessionDuration:
                    Date.now() -
                    (parseInt(
                      sessionStorage.getItem('sessionStartTime') || '0'
                    ) || Date.now()),
                });

                // Legacy analytics for backward compatibility
                analyticsService.trackEvent({
                  action: 'install_banner_shown',
                  category: 'pwa',
                  label: 'automatic_timing',
                  custom_parameters: {
                    delay_ms: promptDelay,
                    source: 'beforeinstallprompt',
                    timestamp: new Date().toISOString(),
                  },
                });

                // Announce banner appearance to screen readers
                announceToScreenReader(
                  'Install app banner appeared. You can install this app for a better experience.'
                );
              }
            },
            promptDelay,
            'banner_timing'
          );
        };

        showBannerWithTiming();
      } catch (error) {
        console.error('Error handling beforeinstallprompt event:', error);
        
        // Use comprehensive PWA error handling
        const pwaError = PWAErrorHandler.createError(
          PWAErrorType.BEFOREINSTALLPROMPT_FAILED,
          error instanceof Error ? error.message : 'Unknown error',
          {
            component: 'InstallPrompt',
            source: 'automatic_banner',
            placement: 'banner',
            userAgent: navigator.userAgent,
            browserInfo: PWAErrorHandler.checkBrowserSupport().browserInfo,
            installState: installStateInfo.installMethod
          },
          error instanceof Error ? error : undefined
        );
        
        setCurrentError(pwaError);
        PWAErrorHandler.handleError(pwaError);
        
        // Legacy analytics for backward compatibility
        analyticsService.trackEvent({
          action: 'install_event_error',
          category: 'pwa',
          label: 'beforeinstallprompt_handler_error',
          custom_parameters: {
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
            error_stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    // Enhanced app installed event handler with proper state cleanup
    const handleAppInstalled = () => {
      if (!isMounted()) {
        console.warn('InstallPrompt: Received appinstalled after unmount');
        return;
      }

      try {
        // Clear all install-related state
        setIsInstalled(true);
        setShowInstallBanner(false);
        setShowInstallModal(false);
        setDeferredPrompt(null);

        // Clear any stored dismissal preferences using cleanup utility
        clearSessionStorage(['pwa-install-dismissed']);

        // Track successful installation
        analyticsService.trackEvent({
          action: 'app_installed',
          category: 'pwa',
          label: 'installation_completed',
          custom_parameters: {
            installation_source: 'native_prompt',
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
          },
        });

        handleInstallation();

        // Announce successful installation
        announceToScreenReader('App installed successfully');
        console.log('PWA was installed successfully');
      } catch (error) {
        console.error('Error handling app installed event:', error);
        analyticsService.trackEvent({
          action: 'install_event_error',
          category: 'pwa',
          label: 'appinstalled_handler_error',
          custom_parameters: {
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    // Add event listeners with enhanced error handling and cleanup tracking
    // Only proceed if component is still mounted
    if (!isMounted()) {
      return () => {}; // Return empty cleanup function
    }

    const beforeInstallPromptAdded = addEventListener(
      window,
      'beforeinstallprompt',
      handleBeforeInstallPrompt,
      false,
      'beforeinstallprompt_handler'
    );

    const appInstalledAdded = addEventListener(
      window,
      'appinstalled',
      handleAppInstalled,
      false,
      'appinstalled_handler'
    );

    if (!beforeInstallPromptAdded || !appInstalledAdded) {
      console.error('Failed to add some install event listeners');
      analyticsService.trackEvent({
        action: 'install_event_error',
        category: 'pwa',
        label: 'event_listener_registration_failed',
        custom_parameters: {
          beforeinstallprompt_added: beforeInstallPromptAdded,
          appinstalled_added: appInstalledAdded,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Enhanced fallback detection: Set timer to detect if automatic prompt fails
    // Only create timer if component is still mounted
    if (!isMounted()) {
      return () => {}; // Return empty cleanup function
    }

    const fallbackDetectionDelay = promptDelay + 5000; // Wait 5 seconds after expected prompt time
    const fallbackTimer = createTimer(
      () => {
        // Check if we should have shown a prompt but didn't
        if (
          canShowPrompt &&
          !isInstalled &&
          !showInstallBanner &&
          !deferredPrompt &&
          !sessionStorage.getItem('pwa-install-dismissed') &&
          isMounted()
        ) {
          console.log(
            'Automatic install prompt failed to appear, enabling fallback'
          );
          setAutomaticPromptFailed(true);

          // Track that automatic prompt failed with enhanced analytics
          trackAutomaticPromptFailed({
            source: 'system',
            placement: 'banner',
            trigger: 'fallback_detection',
            component: 'InstallPrompt',
            expectedDelay: promptDelay,
            detectionDelay: fallbackDetectionDelay,
          });

          // Legacy analytics for backward compatibility
          analyticsService.trackEvent({
            action: 'install_automatic_prompt_failed',
            category: 'pwa',
            label: 'fallback_detection',
            custom_parameters: {
              expected_delay: promptDelay,
              detection_delay: fallbackDetectionDelay,
              can_show_prompt: canShowPrompt,
              is_installed: isInstalled,
              has_deferred_prompt: !!deferredPrompt,
              timestamp: new Date().toISOString(),
            },
          });
        }
      },
      fallbackDetectionDelay,
      'fallback_detection'
    );

    setFallbackPromptTimer(fallbackTimer);

    // Register cleanup for fallback timer
    registerCleanup(() => {
      if (fallbackPromptTimer) {
        clearTimer(fallbackPromptTimer);
        setFallbackPromptTimer(null);
      }
    });

    // Return cleanup function for this useEffect
    return () => {
      // Reset initialization flag on cleanup
      effectInitialized.current = false;
      // Additional cleanup if needed
      if (fallbackTimer) {
        clearTimer(fallbackTimer);
      }
    };
  }, []); // Empty dependency array since we only want this to run once

  // Enhanced display mode change detection with cleanup management
  useEffect(() => {
    const cleanup = createDisplayModeListener(displayMode => {
      if (!isMounted()) {
        console.warn(
          'InstallPrompt: Display mode change detected after unmount'
        );
        return;
      }

      console.log('InstallPrompt: Display mode changed to:', displayMode);
      const wasInstalled = checkIfInstalled();

      if (wasInstalled) {
        setShowInstallBanner(false);
        setShowInstallModal(false);
        announceToScreenReader('App is now installed and running in app mode');
      }
    });

    // Register cleanup with our cleanup manager
    registerCleanup(cleanup);

    return cleanup;
  }, [checkIfInstalled, registerCleanup, isMounted]);

  // Focus management for banner appearance/disappearance with performance monitoring
  useEffect(() => {
    if (showInstallBanner && bannerRef.current) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the banner for screen reader announcement with performance monitoring
      setTimeout(() => {
        if (bannerRef.current) {
          measurePositioning(() => {
            bannerRef.current!.focus();
          });
        }
      }, 100);
    } else if (!showInstallBanner && previousFocusRef.current) {
      // Restore focus when banner disappears
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [showInstallBanner, measurePositioning]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn('Install clicked but no deferred prompt available');
      analyticsService.trackEvent({
        action: 'install_click_no_prompt',
        category: 'pwa',
        label: 'missing_deferred_prompt',
        custom_parameters: {
          source: showInstallModal ? 'modal' : 'banner',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const source = showInstallModal ? 'modal' : 'banner';
    const startTime = Date.now();

    try {
      // Track install attempt start with enhanced analytics
      trackInstallStarted({
        source: showInstallModal ? 'modal' : 'automatic_banner',
        placement: showInstallModal ? 'modal' : 'banner',
        trigger: 'user_click',
        component: 'InstallPrompt',
        sessionDuration:
          Date.now() -
          (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
            Date.now()),
      });

      // Legacy analytics for backward compatibility
      analyticsService.trackEvent({
        action: 'install_attempt_started',
        category: 'pwa',
        label: source,
        custom_parameters: {
          source,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });

      handlePromptInteraction('install_now', source);

      // Validate prompt method exists before calling
      if (
        !deferredPrompt.prompt ||
        typeof deferredPrompt.prompt !== 'function'
      ) {
        throw new Error('Deferred prompt does not have a valid prompt method');
      }

      // Show the install prompt with timeout handling
      const promptPromise = deferredPrompt.prompt();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Install prompt timeout')), 10000);
      });

      await Promise.race([promptPromise, timeoutPromise]);

      // Wait for the user to respond to the prompt with enhanced error handling
      let userChoice;
      try {
        if (!deferredPrompt.userChoice) {
          throw new Error('User choice promise not available');
        }

        const userChoicePromise = deferredPrompt.userChoice;
        const choiceTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('User choice timeout')), 30000);
        });

        userChoice = await Promise.race([
          userChoicePromise,
          choiceTimeoutPromise,
        ]);
      } catch (choiceError) {
        console.error('Error waiting for user choice:', choiceError);
        analyticsService.trackEvent({
          action: 'install_user_choice_error',
          category: 'pwa',
          label: 'user_choice_timeout_or_error',
          custom_parameters: {
            error_message:
              choiceError instanceof Error
                ? choiceError.message
                : 'Unknown error',
            source,
            duration_ms: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        });

        // Clean up state even if we can't get user choice
        setDeferredPrompt(null);
        setShowInstallModal(false);
        setShowInstallBanner(false);
        return;
      }

      const { outcome, platform } = userChoice;
      const duration = Date.now() - startTime;

      // Enhanced user choice tracking with comprehensive analytics
      analyticsService.trackEvent({
        action: 'install_prompt_response',
        category: 'pwa',
        label: outcome,
        custom_parameters: {
          outcome,
          platform: platform || 'unknown',
          source,
          duration_ms: duration,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');

        // Track successful acceptance with enhanced analytics
        trackInstallCompleted({
          source: showInstallModal ? 'modal' : 'automatic_banner',
          placement: showInstallModal ? 'modal' : 'banner',
          trigger: 'user_click',
          component: 'InstallPrompt',
          outcome: 'accepted',
          platform: platform || 'unknown',
          duration,
          sessionDuration:
            Date.now() -
            (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
              Date.now()),
        });

        // Legacy analytics for backward compatibility
        analyticsService.trackEvent({
          action: 'install_accepted',
          category: 'pwa',
          label: source,
          custom_parameters: {
            platform: platform || 'unknown',
            source,
            duration_ms: duration,
            timestamp: new Date().toISOString(),
          },
        });

        // Announce acceptance to screen readers
        announceToScreenReader(
          'Installation started. The app will be installed shortly.'
        );
      } else {
        console.log('User dismissed the install prompt');

        // Track dismissal with enhanced analytics
        trackInstallCancelled({
          source: showInstallModal ? 'modal' : 'automatic_banner',
          placement: showInstallModal ? 'modal' : 'banner',
          trigger: 'user_click',
          component: 'InstallPrompt',
          reason: 'user_dismissed',
          duration,
          sessionDuration:
            Date.now() -
            (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
              Date.now()),
        });

        // Legacy analytics for backward compatibility
        analyticsService.trackEvent({
          action: 'install_dismissed',
          category: 'pwa',
          label: source,
          custom_parameters: {
            platform: platform || 'unknown',
            source,
            duration_ms: duration,
            dismissal_reason: 'user_choice',
            timestamp: new Date().toISOString(),
          },
        });

        handleDismissal('close_button');

        // Store dismissal preference to avoid showing again too soon
        sessionStorage.setItem('pwa-install-dismissed', Date.now().toString());

        // Announce dismissal to screen readers
        announceToScreenReader('Installation cancelled.');
      }

      // Properly clear event state after installation or dismissal
      setDeferredPrompt(null);
      setShowInstallModal(false);
      setShowInstallBanner(false);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      console.error('Error during installation:', error);

      // Track installation failure with enhanced analytics
      trackInstallFailed({
        source: showInstallModal ? 'modal' : 'automatic_banner',
        placement: showInstallModal ? 'modal' : 'banner',
        trigger: 'user_click',
        component: 'InstallPrompt',
        errorType:
          error instanceof Error ? error.constructor.name : 'UnknownError',
        errorMessage: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        duration,
        sessionDuration:
          Date.now() -
          (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
            Date.now()),
      });

      // Legacy analytics for backward compatibility
      analyticsService.trackEvent({
        action: 'install_error',
        category: 'pwa',
        label: 'installation_failed',
        custom_parameters: {
          error_message: errorMessage,
          error_type:
            error instanceof Error ? error.constructor.name : 'UnknownError',
          error_stack: error instanceof Error ? error.stack : undefined,
          source,
          duration_ms: duration,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });

      // Announce error to screen readers
      announceToScreenReader('Installation failed. Please try again later.');

      // Clean up state on error
      setDeferredPrompt(null);
      setShowInstallModal(false);
      setShowInstallBanner(false);
    }
  };

  // Memoized theme-aware banner styles to prevent unnecessary re-renders
  const bannerStyles = useMemo(() => {
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
        background: 'bg-primary-600',
        text: 'text-white',
        border: 'border-primary-700',
        shadow: 'shadow-2xl',
      };
    }

    // Light mode (default)
    return {
      background: 'bg-primary-700',
      text: 'text-white',
      border: 'border-primary-800',
      shadow: 'shadow-2xl',
    };
  }, [theme, isHighContrast]);

  // Memoized theme-aware button styles to prevent unnecessary re-renders
  const buttonStyles = useMemo(() => {
    if (isHighContrast) {
      return {
        secondary:
          'bg-white text-black hover:bg-gray-200 border-2 border-black',
        primary: 'bg-black text-white hover:bg-gray-800 border-2 border-white',
      };
    }

    if (theme === 'dark') {
      return {
        secondary: 'bg-white text-primary-600 hover:bg-primary-50',
        primary: 'bg-primary-600 hover:bg-primary-700',
      };
    }

    // Light mode (default)
    return {
      secondary: 'bg-white text-primary-600 hover:bg-primary-50',
      primary: 'bg-primary-700 hover:bg-primary-800',
    };
  }, [theme, isHighContrast]);

  // Performance monitoring for theme changes
  useEffect(() => {
    measureThemeChange(() => {
      // Theme change effect - styles will be recalculated
    });
  }, [theme, isHighContrast, measureThemeChange]);

  // Memoized positioning and animation classes to prevent layout shifts
  const bannerClasses = useMemo(() => {
    const baseClasses = `fixed bottom-22 left-4 right-4 z-60 max-w-md mx-auto md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 ${className}`;
    const animationClasses = prefersReducedMotion
      ? ''
      : 'transition-all duration-300 ease-in-out';
    return `${baseClasses} ${animationClasses}`;
  }, [className, prefersReducedMotion]);

  // Memoized banner positioning styles to prevent layout shifts during theme changes
  const bannerPositionStyles = useMemo(
    () => ({
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
      // Ensure consistent dimensions to prevent layout shifts
      minHeight: '120px',
      contain: 'layout style' as const,
    }),
    []
  );

  // Check if banner should be shown based on timing logic
  const shouldShowBanner = canShowPrompt && showInstallBanner;

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt) {
    return (
      <>
        {/* Screen Reader Announcements - Always present for accessibility */}
        <div
          ref={announcementRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
          role="status"
        />
      </>
    );
  }

  const renderInstallPrompt = () => (
    <>
      {/* Install Banner */}
      {shouldShowBanner && (
        <div
          ref={bannerRef}
          className={bannerClasses}
          style={bannerPositionStyles}
          role="banner"
          aria-live="polite"
          aria-label="Install app banner"
          tabIndex={-1}
        >
          <div
            className={`${bannerStyles.background} ${bannerStyles.text} p-4 md:p-5 rounded-lg ${bannerStyles.shadow} border ${bannerStyles.border}`}
            role="region"
            aria-labelledby="install-banner-title"
            aria-describedby="install-banner-description"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3
                  id="install-banner-title"
                  className="font-semibold text-sm md:text-base mb-1 md:mb-2"
                >
                  {INSTALL_LOCALIZATION.english.modalTitle}
                </h3>
                <p
                  id="install-banner-description"
                  className={`text-sm md:text-base mb-2 ${isHighContrast ? 'text-white' : theme === 'dark' ? 'text-primary-100' : 'text-primary-100'}`}
                >
                  Get quick access and work offline
                </p>
                <p
                  className={`text-sm md:text-base ${isHighContrast ? 'text-white' : theme === 'dark' ? 'text-primary-200' : 'text-primary-200'}`}
                  lang="ml"
                  aria-label={`Malayalam translation: ${INSTALL_LOCALIZATION.malayalam.description}`}
                >
                  വേഗത്തിലുള്ള ആക്സസും ഓഫ്‌ലൈൻ പ്ര���ർത്തനവും നേടുക
                </p>
              </div>
              <button
                onClick={handleDismissBanner}
                className={`p-1 ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${isHighContrast ? 'text-white hover:text-gray-300 hover:bg-gray-800' : theme === 'dark' ? 'text-primary-200 hover:text-white hover:bg-primary-500' : 'text-primary-200 hover:text-white hover:bg-primary-600'} ${
                  prefersReducedMotion
                    ? ''
                    : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95'
                }`}
                aria-label={getBilingualAriaLabel('dismissBanner')}
                title="Close install banner"
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-3 md:mt-4">
              <AccessibleButton
                variant="secondary"
                size="sm"
                onClick={handleShowModal}
                className={`${buttonStyles.secondary} min-h-[44px] flex-1 sm:flex-initial ${
                  prefersReducedMotion
                    ? ''
                    : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:shadow-md'
                }`}
                ariaLabel={getBilingualAriaLabel('learnMore')}
              >
                <span className="text-sm md:text-base">
                  {INSTALL_LOCALIZATION.english.actions.learnMore}
                </span>
              </AccessibleButton>
              <AccessibleButton
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                className={`${buttonStyles.primary} min-h-[44px] flex-1 sm:flex-initial ${
                  prefersReducedMotion
                    ? ''
                    : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:shadow-lg'
                }`}
                ariaLabel={getBilingualAriaLabel('installNow')}
              >
                <span className="text-sm md:text-base">
                  {INSTALL_LOCALIZATION.english.actions.install}
                </span>
              </AccessibleButton>
            </div>
          </div>
        </div>
      )}

      {/* Install Modal */}
      <Modal
        isOpen={showInstallModal}
        onClose={handleCloseModal}
        title={INSTALL_LOCALIZATION.english.modalTitle}
        malayalamTitle={INSTALL_LOCALIZATION.malayalam.modalTitle}
        size="md"
        ariaDescribedBy="install-modal-content"
      >
        <div id="install-modal-content" className="space-y-6 p-6 md:p-8">
          {/* Enhanced Header with Gradient Icon */}
          <div className="text-center">
            <div
              className={`mx-auto flex items-center justify-center h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg mb-6 ${
                prefersReducedMotion
                  ? ''
                  : 'transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl'
              }`}
              role="img"
              aria-label="Mobile app icon"
            >
              <svg
                className="h-10 w-10 md:h-12 md:w-12 text-white"
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
            </div>
            <h3
              className="text-xl md:text-2xl font-bold text-gray-900 mb-3"
              id="install-modal-heading"
            >
              {INSTALL_LOCALIZATION.english.buttonText}
            </h3>
            <p className="text-base md:text-lg text-gray-600 mb-2">
              {INSTALL_LOCALIZATION.english.description}
            </p>
            <p
              className="text-base md:text-lg text-gray-500"
              lang="ml"
              aria-label={`Malayalam translation: ${INSTALL_LOCALIZATION.malayalam.description}`}
            >
              {INSTALL_LOCALIZATION.malayalam.description}
            </p>
          </div>

          {/* Enhanced Benefits Section with Grid Layout */}
          <div
            className="bg-gray-50 rounded-xl p-6 md:p-8"
            role="region"
            aria-labelledby="benefits-heading"
          >
            <h4
              id="benefits-heading"
              className="font-semibold text-lg md:text-xl text-gray-900 mb-6 text-center"
            >
              Why Install?
            </h4>
            <ul
              className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
              role="list"
              aria-label="App installation benefits"
            >
              {INSTALL_LOCALIZATION.english.benefits.map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-4"
                  role="listitem"
                >
                  <div className="flex-shrink-0" aria-hidden="true">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-medium text-gray-900">
                      {benefit}
                    </p>
                    <p
                      className="text-xs md:text-sm text-gray-500 mt-1"
                      lang="ml"
                      aria-label={`Malayalam translation: ${INSTALL_LOCALIZATION.malayalam.benefits[index]}`}
                    >
                      {INSTALL_LOCALIZATION.malayalam.benefits[index]}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Enhanced Button Footer with Better Spacing */}
          <div
            className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200"
            role="group"
            aria-label="Installation actions"
          >
            <AccessibleButton
              variant="secondary"
              onClick={handleCloseModal}
              className={`flex-1 min-h-[48px] px-6 py-3 text-base font-medium rounded-lg border-2 border-gray-300 hover:border-gray-400 ${
                prefersReducedMotion
                  ? ''
                  : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 hover:shadow-md'
              }`}
              ariaLabel={getBilingualAriaLabel('closeModal')}
            >
              <div className="text-center">
                <span className="block text-gray-700">
                  {INSTALL_LOCALIZATION.english.actions.maybeLater}
                </span>
                <span
                  className="block text-sm text-gray-500 mt-1"
                  lang="ml"
                  aria-hidden="true"
                >
                  {INSTALL_LOCALIZATION.malayalam.actions.maybeLater}
                </span>
              </div>
            </AccessibleButton>
            <AccessibleButton
              variant="primary"
              onClick={handleInstallClick}
              className={`flex-1 min-h-[48px] px-6 py-3 text-base font-medium rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl ${
                prefersReducedMotion
                  ? ''
                  : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 transform'
              }`}
              ariaLabel={getBilingualAriaLabel('installNow')}
            >
              <div className="text-center">
                <span className="block font-semibold">
                  {INSTALL_LOCALIZATION.english.actions.installNow}
                </span>
                <span
                  className="block text-sm opacity-90 mt-1"
                  lang="ml"
                  aria-hidden="true"
                >
                  {INSTALL_LOCALIZATION.malayalam.actions.installNow}
                </span>
              </div>
            </AccessibleButton>
          </div>
        </div>
      </Modal>

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

  return (
    <PWAInstallErrorBoundary
      componentName="InstallPrompt"
      source="automatic_banner"
      placement="banner"
      onError={(error, errorInfo) => {
        console.error(
          'InstallPrompt Error Boundary triggered:',
          error,
          errorInfo
        );
        // Perform cleanup on error
        performCleanup();
      }}
    >
      {renderInstallPrompt()}
      <PWAErrorHandlerComponent
        error={currentError}
        onDismiss={() => setCurrentError(null)}
        onRetry={() => {
          setCurrentError(null);
          // Retry logic would be handled by the component
        }}
      />
    </PWAInstallErrorBoundary>
  );
};

// Enhanced hook for install prompt functionality with better error handling and state management
export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installState, setInstallState] = useState<
    'unknown' | 'available' | 'installed' | 'not-supported'
  >('unknown');

  // Enhanced cleanup and memory management for the hook
  const { registerCleanup, addEventListener, clearSessionStorage, isMounted } =
    usePWAInstallCleanup('useInstallPrompt');

  // Create detector instance for install state checking
  const detector = useMemo(() => createInstallStateDetector(), []);

  // Enhanced install state detection using the new utility
  const checkInstallState = useCallback(() => {
    try {
      const currentInstallState = getInstallState(deferredPrompt);

      // Update state based on comprehensive detection
      setIsInstalled(currentInstallState.isInstalled);
      setIsInstallable(currentInstallState.isInstallable);

      if (currentInstallState.isInstalled) {
        setInstallState('installed');
        return true;
      } else if (currentInstallState.installMethod === 'not-supported') {
        setInstallState('not-supported');
        return false;
      } else if (deferredPrompt) {
        setInstallState('available');
        return false;
      } else {
        setInstallState('unknown');
        return false;
      }
    } catch (error) {
      console.error('Error checking install state:', error);
      setInstallState('unknown');
      return false;
    }
  }, [deferredPrompt]);

  useEffect(() => {
    // Initial install state check
    checkInstallState();

    // Enhanced beforeinstallprompt handler with comprehensive error handling
    const handleBeforeInstallPrompt = (e: Event) => {
      if (!isMounted()) {
        console.warn(
          'useInstallPrompt: Received beforeinstallprompt after unmount'
        );
        return;
      }

      try {
        // Ensure proper preventDefault() calling
        e.preventDefault();

        const installEvent = e as BeforeInstallPromptEvent;

        // Validate event structure
        if (!installEvent.prompt || typeof installEvent.prompt !== 'function') {
          console.error('Invalid beforeinstallprompt event structure');
          analyticsService.trackEvent({
            action: 'install_hook_error',
            category: 'pwa',
            label: 'invalid_event_structure',
            custom_parameters: {
              error_type: 'missing_prompt_method',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        if (
          !installEvent.userChoice ||
          typeof installEvent.userChoice.then !== 'function'
        ) {
          console.error(
            'Invalid beforeinstallprompt event: missing userChoice promise'
          );
          analyticsService.trackEvent({
            action: 'install_hook_error',
            category: 'pwa',
            label: 'invalid_event_structure',
            custom_parameters: {
              error_type: 'missing_user_choice',
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        // Store the validated event
        setDeferredPrompt(installEvent);
        setIsInstallable(true);
        setInstallState('available');

        // Track that install prompt is available
        analyticsService.trackEvent({
          action: 'install_hook_prompt_available',
          category: 'pwa',
          label: 'beforeinstallprompt_received',
          custom_parameters: {
            platforms: installEvent.platforms || [],
            timestamp: new Date().toISOString(),
          },
        });

        console.log('PWA install prompt available via hook');
      } catch (error) {
        console.error('Error handling beforeinstallprompt in hook:', error);
        analyticsService.trackEvent({
          action: 'install_hook_error',
          category: 'pwa',
          label: 'beforeinstallprompt_handler_error',
          custom_parameters: {
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
            error_stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    // Enhanced app installed handler with proper state cleanup
    const handleAppInstalled = () => {
      if (!isMounted()) {
        console.warn('useInstallPrompt: Received appinstalled after unmount');
        return;
      }

      try {
        // Clear all install-related state
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        setInstallState('installed');

        // Clear any stored install preferences using cleanup utility
        clearSessionStorage(['pwa-install-dismissed']);

        // Track successful installation
        analyticsService.trackEvent({
          action: 'install_hook_app_installed',
          category: 'pwa',
          label: 'installation_completed',
          custom_parameters: {
            timestamp: new Date().toISOString(),
            source: 'hook_handler',
          },
        });

        console.log('PWA installed successfully via hook');
      } catch (error) {
        console.error('Error handling app installed in hook:', error);
        analyticsService.trackEvent({
          action: 'install_hook_error',
          category: 'pwa',
          label: 'appinstalled_handler_error',
          custom_parameters: {
            error_message:
              error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    // Add event listeners with enhanced error handling and cleanup tracking
    const beforeInstallPromptAdded = addEventListener(
      window,
      'beforeinstallprompt',
      handleBeforeInstallPrompt,
      false,
      'hook_beforeinstallprompt'
    );

    const appInstalledAdded = addEventListener(
      window,
      'appinstalled',
      handleAppInstalled,
      false,
      'hook_appinstalled'
    );

    if (!beforeInstallPromptAdded || !appInstalledAdded) {
      console.error('Failed to add some install event listeners in hook');
      analyticsService.trackEvent({
        action: 'install_hook_error',
        category: 'pwa',
        label: 'event_listener_registration_failed',
        custom_parameters: {
          beforeinstallprompt_added: beforeInstallPromptAdded,
          appinstalled_added: appInstalledAdded,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // The cleanup is now handled automatically by the usePWAInstallCleanup hook
  }, [checkInstallState, addEventListener, clearSessionStorage, isMounted]);

  // Re-check install state when display mode changes using enhanced listener
  useEffect(() => {
    const cleanup = createDisplayModeListener(displayMode => {
      if (!isMounted()) {
        console.warn(
          'useInstallPrompt: Display mode change detected after unmount'
        );
        return;
      }
      console.log('useInstallPrompt: Display mode changed to:', displayMode);
      checkInstallState();
    });

    // Register cleanup with our cleanup manager
    registerCleanup(cleanup);

    return cleanup;
  }, [checkInstallState, registerCleanup, isMounted]);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('No deferred install prompt available for hook');
      analyticsService.trackEvent({
        action: 'install_hook_prompt_missing',
        category: 'pwa',
        label: 'no_deferred_prompt',
        custom_parameters: {
          timestamp: new Date().toISOString(),
          install_state: installState,
        },
      });
      return false;
    }

    const startTime = Date.now();

    try {
      // Validate prompt method before calling
      if (
        !deferredPrompt.prompt ||
        typeof deferredPrompt.prompt !== 'function'
      ) {
        throw new Error('Deferred prompt does not have a valid prompt method');
      }

      // Track install attempt
      analyticsService.trackEvent({
        action: 'install_hook_attempt_started',
        category: 'pwa',
        label: 'hook_prompt_install',
        custom_parameters: {
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });

      // Show the install prompt with timeout
      const promptPromise = deferredPrompt.prompt();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Install prompt timeout')), 10000);
      });

      await Promise.race([promptPromise, timeoutPromise]);

      // Wait for the user to respond to the prompt with enhanced error handling
      let userChoice;
      try {
        if (!deferredPrompt.userChoice) {
          throw new Error('User choice promise not available');
        }

        const userChoicePromise = deferredPrompt.userChoice;
        const choiceTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('User choice timeout')), 30000);
        });

        userChoice = await Promise.race([
          userChoicePromise,
          choiceTimeoutPromise,
        ]);
      } catch (choiceError) {
        console.error('Error waiting for user choice in hook:', choiceError);
        analyticsService.trackEvent({
          action: 'install_hook_user_choice_error',
          category: 'pwa',
          label: 'user_choice_timeout_or_error',
          custom_parameters: {
            error_message:
              choiceError instanceof Error
                ? choiceError.message
                : 'Unknown error',
            duration_ms: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        });

        // Clean up state even if we can't get user choice
        setDeferredPrompt(null);
        setIsInstallable(false);
        setInstallState('unknown');
        return false;
      }

      const { outcome, platform } = userChoice;
      const duration = Date.now() - startTime;

      // Clean up the deferred prompt first
      setDeferredPrompt(null);
      setIsInstallable(false);

      const success = outcome === 'accepted';

      // Enhanced user choice tracking
      analyticsService.trackEvent({
        action: 'install_hook_prompt_response',
        category: 'pwa',
        label: outcome,
        custom_parameters: {
          outcome,
          platform: platform || 'unknown',
          duration_ms: duration,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });

      if (success) {
        setInstallState('installed');

        analyticsService.trackEvent({
          action: 'install_hook_accepted',
          category: 'pwa',
          label: 'hook_install_accepted',
          custom_parameters: {
            platform: platform || 'unknown',
            duration_ms: duration,
            timestamp: new Date().toISOString(),
          },
        });

        console.log('User accepted the install prompt via hook');
      } else {
        setInstallState('unknown');

        analyticsService.trackEvent({
          action: 'install_hook_dismissed',
          category: 'pwa',
          label: 'hook_install_dismissed',
          custom_parameters: {
            platform: platform || 'unknown',
            duration_ms: duration,
            dismissal_reason: 'user_choice',
            timestamp: new Date().toISOString(),
          },
        });

        console.log('User dismissed the install prompt via hook');
        // Remember that user dismissed the prompt
        sessionStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }

      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      console.error('Install prompt error in hook:', error);

      // Enhanced error tracking
      analyticsService.trackEvent({
        action: 'install_hook_error',
        category: 'pwa',
        label: 'prompt_install_failed',
        custom_parameters: {
          error_message: errorMessage,
          error_type:
            error instanceof Error ? error.constructor.name : 'UnknownError',
          error_stack: error instanceof Error ? error.stack : undefined,
          duration_ms: duration,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });

      // Clean up state on error
      setDeferredPrompt(null);
      setIsInstallable(false);
      setInstallState('unknown');
      return false;
    }
  };

  // Check if user recently dismissed install prompt
  const wasRecentlyDismissed = () => {
    const dismissedTime = sessionStorage.getItem('pwa-install-dismissed');
    if (!dismissedTime) {
      return false;
    }

    const dismissedAt = parseInt(dismissedTime);
    const hoursSinceDismissal = (Date.now() - dismissedAt) / (1000 * 60 * 60);

    // Don't show again for 24 hours after dismissal
    return hoursSinceDismissal < 24;
  };

  return {
    isInstallable: isInstallable && !isInstalled && !wasRecentlyDismissed(),
    isInstalled,
    installState,
    deferredPrompt,
    promptInstall,
    checkInstallState,
    wasRecentlyDismissed: wasRecentlyDismissed(),
    // Enhanced fallback detection
    automaticPromptFailed: false, // This will be managed by the InstallPrompt component
  };
};
