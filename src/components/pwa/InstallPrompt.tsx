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
import { useInstallPromptTiming } from '../../hooks/useInstallPromptTiming';

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
  
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

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

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check for standalone mode (iOS)
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      // Check for PWA mode (Android) - using type assertion to handle TypeScript issue
      const isPWA = (window.navigator as any).standalone === true;

      setIsInstalled(isStandalone || isPWA);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);

      // Use smart timing for install banner based on UX best practices
      const showBannerWithTiming = () => {
        if (isInstalled || !canShowPrompt) return;
        
        setTimeout(() => {
          if (!isInstalled && canShowPrompt) {
            setShowInstallBanner(true);
            handlePromptShown('automatic');
            // Announce banner appearance to screen readers
            announceToScreenReader(
              'Install app banner appeared. You can install this app for a better experience.'
            );
          }
        }, promptDelay);
      };
      
      showBannerWithTiming();
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setShowInstallModal(false);
      setDeferredPrompt(null);

      handleInstallation();

      // Announce successful installation
      announceToScreenReader('App installed successfully');
      console.warn('PWA was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, canShowPrompt, promptDelay, handlePromptShown, handleInstallation]);

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
      return;
    }

    try {
      const source = showInstallModal ? 'modal' : 'banner';
      handlePromptInteraction('install_now', source);

      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      // Track user choice
      analyticsService.trackEvent({
        action: 'install_prompt_response',
        category: 'pwa',
        label: outcome,
        custom_parameters: {
          outcome,
          source,
        },
      });

      if (outcome === 'accepted') {
        console.warn('User accepted the install prompt');
      } else {
        console.warn('User dismissed the install prompt');
        handleDismissal('close_button');
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallModal(false);
      setShowInstallBanner(false);
    } catch (error) {
      console.error('Error during installation:', error);
      // Track installation error
      analyticsService.trackEvent({
        action: 'install_error',
        category: 'pwa',
        label: 'installation_failed',
        custom_parameters: {
          error_message: error.message,
          source: showInstallModal ? 'modal' : 'banner',
        },
      });
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

  return (
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
                  Install Madrasa Portal
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
                  aria-label="Malayalam translation: Get quick access and work offline"
                >
                  വേഗത്തിലുള്ള ആക്സസും ഓഫ്‌ലൈൻ പ്രവർത്തനവും നേടുക
                </p>
              </div>
              <button
                onClick={handleDismissBanner}
                className={`p-1 ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${isHighContrast ? 'text-white hover:text-gray-300 hover:bg-gray-800' : theme === 'dark' ? 'text-primary-200 hover:text-white hover:bg-primary-500' : 'text-primary-200 hover:text-white hover:bg-primary-600'} ${
                  prefersReducedMotion
                    ? ''
                    : 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95'
                }`}
                aria-label="Dismiss install banner. You can install the app later from your browser menu."
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
                ariaLabel="Learn more about installing the app. Opens detailed information modal."
              >
                <span className="text-sm md:text-base">Learn More</span>
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
                ariaLabel="Install Madrasa Portal app now. This will add the app to your device."
              >
                <span className="text-sm md:text-base">Install</span>
              </AccessibleButton>
            </div>
          </div>
        </div>
      )}

      {/* Install Modal */}
      <Modal
        isOpen={showInstallModal}
        onClose={handleCloseModal}
        title="Install Madrasa Portal"
        malayalamTitle="മദ്രസ പോർട്ടൽ ഇൻസ്റ്റാൾ ചെയ്യുക"
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
              Install as App
            </h3>
            <p className="text-base md:text-lg text-gray-600 mb-2">
              Install Madrasa Portal on your device for a better experience
            </p>
            <p
              className="text-base md:text-lg text-gray-500"
              lang="ml"
              aria-label="Malayalam translation: Install Madrasa Portal on your device for a better experience"
            >
              മികച്ച അനുഭവത്തിനായി നിങ്ങളുടെ ഉപകരണത്തിൽ മദ്രസ പോർട്ടൽ ഇൻസ്റ്റാൾ
              ചെയ്യുക
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
              <li className="flex items-start space-x-4" role="listitem">
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
                    Quick access from home screen
                  </p>
                  <p
                    className="text-xs md:text-sm text-gray-500 mt-1"
                    lang="ml"
                    aria-label="Malayalam translation: Quick access from home screen"
                  >
                    ഹോം സ്ക്രീനിൽ നിന്ന് വേഗത്തിലുള്ള ആക്സസ്
                  </p>
                </div>
              </li>

              <li className="flex items-start space-x-4" role="listitem">
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
                    Works offline for cached content
                  </p>
                  <p
                    className="text-xs md:text-sm text-gray-500 mt-1"
                    lang="ml"
                    aria-label="Malayalam translation: Works offline for cached content"
                  >
                    കാഷെ ചെയ്ത ഉള്ളടക്കത്തിനായി ഓഫ്‌ലൈൻ പ്രവർത്തിക്കുന്നു
                  </p>
                </div>
              </li>

              <li className="flex items-start space-x-4" role="listitem">
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
                    Push notifications for classes
                  </p>
                  <p
                    className="text-xs md:text-sm text-gray-500 mt-1"
                    lang="ml"
                    aria-label="Malayalam translation: Push notifications for classes"
                  >
                    ക്ലാസുകൾക്കുമായി പുഷ് അറിയിപ്പുകൾ
                  </p>
                </div>
              </li>

              <li className="flex items-start space-x-4" role="listitem">
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
                    Full-screen app experience
                  </p>
                  <p
                    className="text-xs md:text-sm text-gray-500 mt-1"
                    lang="ml"
                    aria-label="Malayalam translation: Full-screen app experience"
                  >
                    പൂർണ്ണ സ്ക്രീൻ ആപ്പ് അനുഭവം
                  </p>
                </div>
              </li>
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
              ariaLabel="Close modal and maybe install later"
            >
              <div className="text-center">
                <span className="block text-gray-700">Maybe Later</span>
                <span
                  className="block text-sm text-gray-500 mt-1"
                  lang="ml"
                  aria-hidden="true"
                >
                  പിന്നീട്
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
              ariaLabel="Install Madrasa Portal app now on your device"
            >
              <div className="text-center">
                <span className="block font-semibold">Install Now</span>
                <span
                  className="block text-sm opacity-90 mt-1"
                  lang="ml"
                  aria-hidden="true"
                >
                  ഇപ്പോൾ ഇൻസ്റ്റാൾ ചെയ്യുക
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
};

// Hook for install prompt functionality
export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    const isPWA = window.navigator.standalone === true;
    setIsInstalled(isStandalone || isPWA);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
};
