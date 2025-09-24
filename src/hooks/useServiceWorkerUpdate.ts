import { useState, useEffect, useCallback } from 'react';

export interface ServiceWorkerUpdateHook {
  updateAvailable: boolean;
  isUpdating: boolean;
  updateError: string | null;
  updateServiceWorker: () => Promise<void>;
  dismissUpdate: () => void;
  offlineReady: boolean;
}

/**
 * Custom hook for managing service worker updates
 * Provides update detection, manual update triggers, and error handling
 */
export const useServiceWorkerUpdate = (): ServiceWorkerUpdateHook => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<
    ((reloadPage?: boolean) => Promise<void>) | null
  >(null);

  useEffect(() => {
    // Listen for service worker events from main.tsx registration
    const handleUpdateAvailable = () => {
      console.log('Service worker update available');
      setUpdateAvailable(true);
      setUpdateError(null);
    };

    const handleOfflineReady = () => {
      console.log('App ready to work offline');
      setOfflineReady(true);
    };

    const handleRegistrationError = (event: CustomEvent) => {
      console.error('Service worker registration error:', event.detail);
      setUpdateError(
        'Failed to register service worker. Some features may not work offline.'
      );
    };

    // Add event listeners for service worker events
    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('sw-offline-ready', handleOfflineReady);
    window.addEventListener(
      'sw-registration-error',
      handleRegistrationError as EventListener
    );

    // Get the global update function set by main.tsx registration
    const globalUpdateSW = (window as any).updateServiceWorker;
    if (globalUpdateSW) {
      setUpdateSW(() => globalUpdateSW);
    }

    // Cleanup event listeners
    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('sw-offline-ready', handleOfflineReady);
      window.removeEventListener(
        'sw-registration-error',
        handleRegistrationError as EventListener
      );
    };
  }, []);

  const updateServiceWorker = useCallback(async () => {
    if (!updateSW) {
      setUpdateError('Update function not available');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      await updateSW(true); // Reload page after update
      setUpdateAvailable(false);
    } catch (error) {
      console.error('Failed to update service worker:', error);
      setUpdateError(
        'Failed to update the app. Please refresh the page manually.'
      );
    } finally {
      setIsUpdating(false);
    }
  }, [updateSW]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
    setUpdateError(null);

    // Store dismissal in session storage to avoid showing again immediately
    sessionStorage.setItem('updateDismissed', Date.now().toString());
  }, []);

  return {
    updateAvailable,
    isUpdating,
    updateError,
    updateServiceWorker,
    dismissUpdate,
    offlineReady,
  };
};
