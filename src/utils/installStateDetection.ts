/**
 * Comprehensive PWA install state detection utility
 * Provides reliable detection across different browsers and PWA implementations
 */

export interface InstallStateDetector {
  checkStandaloneMode: () => boolean;
  checkPWAMode: () => boolean;
  checkDisplayMode: () =>
    | 'standalone'
    | 'fullscreen'
    | 'minimal-ui'
    | 'browser';
  checkIOSStandalone: () => boolean;
  checkAndroidPWA: () => boolean;
  isInstalled: () => boolean;
  canInstall: () => boolean;
  isPWASupported: () => boolean;
  getBrowserInfo: () => BrowserInfo;
}

export interface BrowserInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  supportsBeforeInstallPrompt: boolean;
  supportsServiceWorker: boolean;
}

export interface InstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  displayMode: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  installMethod: 'beforeinstallprompt' | 'manual' | 'not-supported';
  browserInfo: BrowserInfo;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Creates an install state detector with comprehensive browser support
 */
export const createInstallStateDetector = (): InstallStateDetector => {
  const getBrowserInfo = (): BrowserInfo => {
    const userAgent = navigator.userAgent;

    return {
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      isChrome: /Chrome/.test(userAgent) && !/Edg/.test(userAgent),
      isFirefox: /Firefox/.test(userAgent),
      isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
      isEdge: /Edg/.test(userAgent),
      supportsBeforeInstallPrompt: 'onbeforeinstallprompt' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
    };
  };

  const checkStandaloneMode = (): boolean => {
    try {
      return window.matchMedia('(display-mode: standalone)').matches;
    } catch (error) {
      console.warn('Error checking standalone mode:', error);
      return false;
    }
  };

  const checkPWAMode = (): boolean => {
    try {
      // iOS Safari specific check
      return (window.navigator as any).standalone === true;
    } catch (error) {
      console.warn('Error checking PWA mode:', error);
      return false;
    }
  };

  const checkDisplayMode = ():
    | 'standalone'
    | 'fullscreen'
    | 'minimal-ui'
    | 'browser' => {
    try {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'standalone';
      }
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return 'fullscreen';
      }
      if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return 'minimal-ui';
      }
      return 'browser';
    } catch (error) {
      console.warn('Error checking display mode:', error);
      return 'browser';
    }
  };

  const checkIOSStandalone = (): boolean => {
    const browserInfo = getBrowserInfo();
    if (!browserInfo.isIOS) {
      return false;
    }

    try {
      // iOS specific checks
      const isStandalone = (window.navigator as any).standalone === true;
      const isStandaloneDisplay = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;

      return isStandalone || isStandaloneDisplay;
    } catch (error) {
      console.warn('Error checking iOS standalone:', error);
      return false;
    }
  };

  const checkAndroidPWA = (): boolean => {
    const browserInfo = getBrowserInfo();
    if (!browserInfo.isAndroid) {
      return false;
    }

    try {
      // Android specific checks
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      const isMinimalUI = window.matchMedia(
        '(display-mode: minimal-ui)'
      ).matches;
      const isFullscreen = window.matchMedia(
        '(display-mode: fullscreen)'
      ).matches;

      return isStandalone || isMinimalUI || isFullscreen;
    } catch (error) {
      console.warn('Error checking Android PWA:', error);
      return false;
    }
  };

  const isInstalled = (): boolean => {
    try {
      // Primary detection methods
      const standaloneMode = checkStandaloneMode();
      const pwaMode = checkPWAMode();
      const iosStandalone = checkIOSStandalone();
      const androidPWA = checkAndroidPWA();

      // Any of these methods indicating installation is sufficient
      return standaloneMode || pwaMode || iosStandalone || androidPWA;
    } catch (error) {
      console.warn('Error checking install state:', error);
      return false;
    }
  };

  const isPWASupported = (): boolean => {
    try {
      const browserInfo = getBrowserInfo();

      // Service worker is required for PWA
      if (!browserInfo.supportsServiceWorker) {
        return false;
      }

      // Check for manifest support
      const hasManifest =
        document.querySelector('link[rel="manifest"]') !== null;
      if (!hasManifest) {
        return false;
      }

      // Browser-specific support checks
      if (browserInfo.isIOS) {
        // iOS Safari 11.3+ supports PWA
        return browserInfo.isSafari || checkPWAMode();
      }

      if (browserInfo.isAndroid) {
        // Android Chrome supports PWA well
        return browserInfo.isChrome || browserInfo.supportsBeforeInstallPrompt;
      }

      // Desktop browsers
      return (
        browserInfo.isChrome ||
        browserInfo.isEdge ||
        browserInfo.supportsBeforeInstallPrompt
      );
    } catch (error) {
      console.warn('Error checking PWA support:', error);
      return false;
    }
  };

  const canInstall = (): boolean => {
    try {
      // Can't install if already installed
      if (isInstalled()) {
        return false;
      }

      // Must have PWA support
      if (!isPWASupported()) {
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error checking install capability:', error);
      return false;
    }
  };

  return {
    checkStandaloneMode,
    checkPWAMode,
    checkDisplayMode,
    checkIOSStandalone,
    checkAndroidPWA,
    isInstalled,
    canInstall,
    isPWASupported,
    getBrowserInfo,
  };
};

/**
 * Gets comprehensive install state information
 */
export const getInstallState = (deferredPrompt?: any): InstallState => {
  const detector = createInstallStateDetector();
  const browserInfo = detector.getBrowserInfo();
  const isInstalled = detector.isInstalled();
  const canInstall = detector.canInstall();
  const displayMode = detector.checkDisplayMode();

  let installMethod: 'beforeinstallprompt' | 'manual' | 'not-supported' =
    'not-supported';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (isInstalled) {
    // High confidence if we can detect installation
    confidence = 'high';
    installMethod = 'manual'; // Already installed
  } else if (deferredPrompt) {
    // High confidence if we have beforeinstallprompt
    confidence = 'high';
    installMethod = 'beforeinstallprompt';
  } else if (canInstall) {
    // Medium confidence if PWA is supported but no prompt
    confidence = 'medium';
    installMethod = browserInfo.supportsBeforeInstallPrompt
      ? 'beforeinstallprompt'
      : 'manual';
  } else {
    // Low confidence if PWA not supported
    confidence = 'low';
    installMethod = 'not-supported';
  }

  return {
    isInstallable: canInstall && !isInstalled,
    isInstalled,
    displayMode,
    installMethod,
    browserInfo,
    confidence,
  };
};

/**
 * Creates a media query listener for display mode changes
 */
export const createDisplayModeListener = (
  callback: (displayMode: string) => void
): (() => void) => {
  const detector = createInstallStateDetector();

  try {
    const mediaQueries = [
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: fullscreen)'),
      window.matchMedia('(display-mode: minimal-ui)'),
    ];

    const handleChange = () => {
      const currentMode = detector.checkDisplayMode();
      callback(currentMode);
    };

    // Add listeners to all media queries
    mediaQueries.forEach(mq => {
      try {
        mq.addEventListener('change', handleChange);
      } catch (error) {
        // Fallback for older browsers
        mq.addListener(handleChange);
      }
    });

    // Return cleanup function
    return () => {
      mediaQueries.forEach(mq => {
        try {
          mq.removeEventListener('change', handleChange);
        } catch (error) {
          // Fallback for older browsers
          mq.removeListener(handleChange);
        }
      });
    };
  } catch (error) {
    console.warn('Error setting up display mode listener:', error);
    return () => {}; // No-op cleanup
  }
};

/**
 * Utility function for debugging install state
 */
export const debugInstallState = (): void => {
  const detector = createInstallStateDetector();
  const installState = getInstallState();

  console.group('🔍 PWA Install State Debug');
  console.log('Browser Info:', detector.getBrowserInfo());
  console.log('Display Mode:', detector.checkDisplayMode());
  console.log('Standalone Mode:', detector.checkStandaloneMode());
  console.log('PWA Mode (iOS):', detector.checkPWAMode());
  console.log('iOS Standalone:', detector.checkIOSStandalone());
  console.log('Android PWA:', detector.checkAndroidPWA());
  console.log('Is Installed:', detector.isInstalled());
  console.log('Can Install:', detector.canInstall());
  console.log('PWA Supported:', detector.isPWASupported());
  console.log('Full Install State:', installState);
  console.groupEnd();
};
