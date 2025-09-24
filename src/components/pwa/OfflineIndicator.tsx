import React, { useState, useEffect } from 'react';
import { AlertBanner } from '../ui/AlertBanner';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { offlineQueue } from '../../services/offlineQueue';

interface OfflineIndicatorProps {
  className?: string;
  showConnectionQuality?: boolean;
  showQueueStatus?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showConnectionQuality = false,
  showQueueStatus = false,
}) => {
  const { isOnline, isSlowConnection, effectiveType, retryConnection } =
    useOnlineStatus();

  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [queueStats, setQueueStats] = useState(offlineQueue.getQueueStats());
  const [wasOffline, setWasOffline] = useState(!navigator.onLine);

  useEffect(() => {
    if (!isOnline && !showOfflineMessage) {
      setShowOfflineMessage(true);
      setShowOnlineMessage(false);
      setWasOffline(true);
    } else if (isOnline && wasOffline) {
      setShowOnlineMessage(true);
      setShowOfflineMessage(false);
      setWasOffline(false);

      // Hide online message after 3 seconds
      setTimeout(() => {
        setShowOnlineMessage(false);
      }, 3000);
    }
  }, [isOnline, showOfflineMessage, wasOffline]);

  useEffect(() => {
    // Update queue stats periodically
    const interval = setInterval(() => {
      setQueueStats(offlineQueue.getQueueStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    retryConnection();
    // Process any queued items
    if (isOnline) {
      offlineQueue.processQueue();
    }
  };

  const getConnectionQualityMessage = () => {
    if (!isOnline) {
      return null;
    }

    if (isSlowConnection) {
      return {
        type: 'warning' as const,
        message: 'Slow connection detected. Some features may load slowly.',
        malayalamMessage:
          'മന്ദഗതിയിലുള്ള കണക്ഷൻ കണ്ടെത്തി. ചില ഫീച്ചറുകൾ സാവധാനത്തിൽ ലോഡ് ആകാം.',
      };
    }

    return null;
  };

  const connectionQualityMessage = getConnectionQualityMessage();

  if (showOfflineMessage && !isOnline) {
    return (
      <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
        <AlertBanner
          type="warning"
          message={`You're offline. ${queueStats.totalItems > 0 ? `${queueStats.totalItems} actions queued for sync.` : 'Some features may not work properly.'}`}
          malayalamMessage={`നിങ്ങൾ ഓഫ്‌ലൈനാണ്. ${queueStats.totalItems > 0 ? `${queueStats.totalItems} പ്രവർത്തനങ്ങൾ സിങ്കിനായി ക്യൂവിൽ.` : 'ചില ഫീച്ചറുകൾ ശരിയായി പ്രവർത്തിച്ചേക്കില്ല.'}`}
          onDismiss={() => setShowOfflineMessage(false)}
          autoHide={false}
          ariaLive="assertive"
        />
        {showQueueStatus && queueStats.totalItems > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {queueStats.totalItems} actions waiting to sync when online
                  </p>
                  <p className="text-xs text-yellow-600 mt-1" lang="ml">
                    ഓൺലൈനായാൽ സിങ്ക് ചെയ്യാൻ {queueStats.totalItems}{' '}
                    പ്രവർത്തനങ്ങൾ കാത്തിരിക്കുന്നു
                  </p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showOnlineMessage && isOnline) {
    return (
      <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
        <AlertBanner
          type="success"
          message={`You're back online! ${queueStats.totalItems > 0 ? 'Syncing queued actions...' : ''}`}
          malayalamMessage={`നിങ്ങൾ വീണ്ടും ഓൺലൈനാണ്! ${queueStats.totalItems > 0 ? 'ക്യൂവിലുള്ള പ്രവർത്തനങ്ങൾ സിങ്ക് ചെയ്യുന്നു...' : ''}`}
          autoHide={true}
          duration={3000}
          ariaLive="polite"
        />
      </div>
    );
  }

  if (showConnectionQuality && connectionQualityMessage) {
    return (
      <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
        <AlertBanner
          type={connectionQualityMessage.type}
          message={connectionQualityMessage.message}
          malayalamMessage={connectionQualityMessage.malayalamMessage}
          autoHide={true}
          duration={5000}
          ariaLive="polite"
        />
      </div>
    );
  }

  return null;
};

// Re-export the enhanced hook from hooks directory
export { useOnlineStatus } from '../../hooks/useOnlineStatus';

// Network status indicator component with connection quality
export const NetworkStatus: React.FC<{
  className?: string;
  showConnectionType?: boolean;
}> = ({ className = '', showConnectionType = false }) => {
  const { isOnline, effectiveType, isSlowConnection } = useOnlineStatus();

  const getConnectionColor = () => {
    if (!isOnline) {
      return 'bg-red-500';
    }
    if (isSlowConnection) {
      return 'bg-yellow-500';
    }
    return 'bg-green-500';
  };

  const getConnectionText = () => {
    if (!isOnline) {
      return { en: 'Offline', ml: 'ഓഫ്‌ലൈൻ' };
    }
    if (isSlowConnection) {
      return { en: 'Slow', ml: 'മന്ദം' };
    }
    return { en: 'Online', ml: 'ഓൺലൈൻ' };
  };

  const connectionText = getConnectionText();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`w-2 h-2 rounded-full ${getConnectionColor()}`}
        aria-hidden="true"
      />
      <span className="text-xs text-gray-600">
        {connectionText.en}
        {showConnectionType &&
          effectiveType &&
          ` (${effectiveType.toUpperCase()})`}
      </span>
      <span className="text-xs text-gray-500" lang="ml">
        {connectionText.ml}
      </span>
    </div>
  );
};
