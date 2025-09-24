import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  createInstallStateDetector,
  getInstallState,
  createDisplayModeListener,
  type InstallState,
} from '../utils/installStateDetection';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  installState: 'unknown' | 'available' | 'installed' | 'not-supported';
  deferredPrompt: BeforeInstallPromptEvent | null;
  promptInstall: () => Promise<boolean>;
  checkInstallState: () => void;
  wasRecentlyDismissed: boolean;
  fullInstallState: InstallState;
  detector: ReturnType<typeof createInstallStateDetector>;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(
  undefined
);

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (context === undefined) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
};

interface PWAInstallProviderProps {
  children: React.ReactNode;
}

export const PWAInstallProvider: React.FC<PWAInstallProviderProps> = ({
  children,
}) => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installState, setInstallState] = useState<
    'unknown' | 'available' | 'installed' | 'not-supported'
  >('unknown');
  const [fullInstallState, setFullInstallState] = useState<InstallState>(() =>
    getInstallState()
  );

  // Create detector instance
  const detector = createInstallStateDetector();

  // Enhanced install state detection using the new utility
  const checkInstallState = useCallback(() => {
    try {
      const currentInstallState = getInstallState(deferredPrompt);
      setFullInstallState(currentInstallState);

      // Update legacy state for backward compatibility
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
      setFullInstallState(getInstallState());
      return false;
    }
  }, [deferredPrompt, detector]);

  useEffect(() => {
    // Initial install state check
    checkInstallState();

    const handleBeforeInstallPrompt = (e: Event) => {
      try {
        e.preventDefault();
        const installEvent = e as BeforeInstallPromptEvent;
        setDeferredPrompt(installEvent);
        setIsInstallable(true);
        setInstallState('available');

        console.log('PWA install prompt available globally');
      } catch (error) {
        console.error('Error handling beforeinstallprompt:', error);
      }
    };

    const handleAppInstalled = () => {
      try {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        setInstallState('installed');

        console.log('PWA installed successfully globally');

        // Clear any stored install prompts
        sessionStorage.removeItem('pwa-install-dismissed');
      } catch (error) {
        console.error('Error handling app installed:', error);
      }
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkInstallState]);

  // Re-check install state when display mode changes using enhanced listener
  useEffect(() => {
    const cleanup = createDisplayModeListener(displayMode => {
      console.log('Display mode changed to:', displayMode);
      checkInstallState();
    });

    return cleanup;
  }, [checkInstallState]);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('No deferred install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      setDeferredPrompt(null);
      setIsInstallable(false);

      const success = outcome === 'accepted';

      if (success) {
        setInstallState('installed');
        console.log('User accepted the install prompt');
      } else {
        setInstallState('unknown');
        console.log('User dismissed the install prompt');
        sessionStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }

      return success;
    } catch (error) {
      console.error('Install prompt error:', error);
      setDeferredPrompt(null);
      setIsInstallable(false);
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

    return hoursSinceDismissal < 24;
  };

  const value: PWAInstallContextType = {
    isInstallable: isInstallable && !isInstalled && !wasRecentlyDismissed(),
    isInstalled,
    installState,
    deferredPrompt,
    promptInstall,
    checkInstallState,
    wasRecentlyDismissed: wasRecentlyDismissed(),
    fullInstallState,
    detector,
  };

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
};
