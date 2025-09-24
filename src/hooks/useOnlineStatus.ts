import { useState, useEffect, useCallback } from 'react';
import { NetworkService, NetworkStatus } from '../services/networkService';

export interface OnlineStatusHook {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  isSlowConnection: boolean;
  isFastConnection: boolean;
  retryConnection: () => void;
  networkStatus: NetworkStatus;
}

/**
 * Custom hook for tracking network connectivity and connection quality
 * Integrates with NetworkService for comprehensive network monitoring
 */
export const useOnlineStatus = (): OnlineStatusHook => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    NetworkService.getNetworkStatus()
  );

  useEffect(() => {
    // Initialize NetworkService if not already done
    NetworkService.initialize();

    // Subscribe to network status changes
    const unsubscribe = NetworkService.subscribe((status: NetworkStatus) => {
      setNetworkStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const retryConnection = useCallback(() => {
    // Force a network check by making a simple request
    if ('onLine' in navigator) {
      // Trigger a connectivity check
      fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
      }).catch(() => {
        // Ignore errors, this is just to trigger network detection
      });
    }
  }, []);

  return {
    isOnline: networkStatus.isOnline,
    connectionType: networkStatus.connectionType,
    effectiveType: networkStatus.effectiveType,
    isSlowConnection: NetworkService.isSlowConnection(),
    isFastConnection: NetworkService.isFastConnection(),
    retryConnection,
    networkStatus,
  };
};

/**
 * Hook for components that need to handle offline scenarios gracefully
 * Provides utilities for offline-first behavior
 */
export const useOfflineGracefulDegradation = () => {
  const { isOnline, isSlowConnection } = useOnlineStatus();
  const [offlineActions, setOfflineActions] = useState<string[]>([]);

  const addOfflineAction = useCallback((action: string) => {
    setOfflineActions(prev => [...prev, action]);
  }, []);

  const clearOfflineActions = useCallback(() => {
    setOfflineActions([]);
  }, []);

  const shouldShowOfflineMessage = useCallback(
    (feature: string) => {
      const offlineFeatures = [
        'live-class',
        'zoom-meeting',
        'real-time-notifications',
        'file-upload',
        'video-streaming',
      ];

      return !isOnline && offlineFeatures.includes(feature);
    },
    [isOnline]
  );

  const shouldReduceQuality = useCallback(() => {
    return isSlowConnection || !isOnline;
  }, [isSlowConnection, isOnline]);

  const getOfflineMessage = useCallback((feature: string) => {
    const messages: Record<string, { en: string; ml: string }> = {
      'live-class': {
        en: 'Live classes require an internet connection. Please check your connection and try again.',
        ml: 'ലൈവ് ക്ലാസുകൾക്ക് ഇന്റർനെറ്റ് കണക്ഷൻ ആവശ്യമാണ്. നിങ്ങളുടെ കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.',
      },
      'zoom-meeting': {
        en: 'Video meetings require an internet connection. Please connect to the internet to join.',
        ml: 'വീഡിയോ മീറ്റിംഗുകൾക്ക് ഇന്റർനെറ്റ് കണക്ഷൻ ആവശ്യമാണ്. ചേരാൻ ഇന്റർനെറ്റിലേക്ക് കണക്റ്റ് ചെയ്യുക.',
      },
      'file-upload': {
        en: "File uploads require an internet connection. Your files will be uploaded when you're back online.",
        ml: 'ഫയൽ അപ്‌ലോഡുകൾക്ക് ഇന്റർനെറ്റ് കണക്ഷൻ ആവശ്യമാണ്. നിങ്ങൾ വീണ്ടും ഓൺലൈനായാൽ നിങ്ങളുടെ ഫയലുകൾ അപ്‌ലോഡ് ചെയ്യപ്പെടും.',
      },
      'real-time-notifications': {
        en: "Real-time notifications require an internet connection. You'll receive updates when back online.",
        ml: 'തത്സമയ അറിയിപ്പുകൾക്ക് ഇന്റർനെറ്റ് കണക്ഷൻ ആവശ്യമാണ്. വീണ്ടും ഓൺലൈനായാൽ നിങ്ങൾക്ക് അപ്‌ഡേറ്റുകൾ ലഭിക്കും.',
      },
      default: {
        en: 'This feature requires an internet connection. Please check your connection and try again.',
        ml: 'ഈ ഫീച്ചറിന് ഇന്റർനെറ്റ് കണക്ഷൻ ആവശ്യമാണ്. നിങ്ങളുടെ കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.',
      },
    };

    return messages[feature] || messages.default;
  }, []);

  return {
    isOnline,
    isSlowConnection,
    offlineActions,
    addOfflineAction,
    clearOfflineActions,
    shouldShowOfflineMessage,
    shouldReduceQuality,
    getOfflineMessage,
  };
};
