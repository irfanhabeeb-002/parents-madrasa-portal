import { useState, useEffect } from 'react';
import {
  InitializationService,
  InitializationStatus,
} from '../services/initializationService';
import { NetworkService, NetworkStatus } from '../services/networkService';

export interface UseInitializationResult {
  status: InitializationStatus;
  networkStatus: NetworkStatus;
  isReady: boolean;
  isFirebaseAvailable: boolean;
  error?: string;
  retry: () => Promise<void>;
}

export const useInitialization = (): UseInitializationResult => {
  const [status, setStatus] = useState<InitializationStatus>({
    firebase: false,
    network: false,
    offlinePersistence: false,
  });
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
  });
  const [isInitializing, setIsInitializing] = useState(false);

  const initialize = async () => {
    if (isInitializing) {
      return;
    }

    setIsInitializing(true);
    try {
      const initStatus = await InitializationService.initialize();
      setStatus(initStatus);
    } catch (error) {
      console.error('Initialization failed:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Initialization failed',
      }));
    } finally {
      setIsInitializing(false);
    }
  };

  const retry = async () => {
    setStatus(prev => ({ ...prev, error: undefined }));
    await initialize();
  };

  useEffect(() => {
    // Initialize services on mount
    initialize();

    // Subscribe to network status changes
    const unsubscribeNetwork = NetworkService.subscribe(newNetworkStatus => {
      setNetworkStatus(newNetworkStatus);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeNetwork();
    };
  }, []);

  return {
    status,
    networkStatus,
    isReady: InitializationService.isReady(),
    isFirebaseAvailable: InitializationService.isFirebaseAvailable(),
    error: status.error,
    retry,
  };
};

export default useInitialization;
