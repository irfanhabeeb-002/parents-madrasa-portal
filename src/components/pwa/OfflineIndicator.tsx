import React, { useState, useEffect } from 'react';
import { AlertBanner } from '../ui/AlertBanner';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineMessage(true);
      setShowOfflineMessage(false);
      
      // Hide online message after 3 seconds
      setTimeout(() => {
        setShowOnlineMessage(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      setShowOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showOfflineMessage && !isOnline) {
    return (
      <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
        <AlertBanner
          type="warning"
          message="You're offline. Some features may not work properly."
          malayalamMessage="നിങ്ങൾ ഓഫ്‌ലൈനാണ്. ചില ഫീച്ചറുകൾ ശരിയായി പ്രവർത്തിച്ചേക്കില്ല."
          onDismiss={() => setShowOfflineMessage(false)}
          autoHide={false}
          ariaLive="assertive"
        />
      </div>
    );
  }

  if (showOnlineMessage && isOnline) {
    return (
      <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
        <AlertBanner
          type="success"
          message="You're back online!"
          malayalamMessage="നിങ്ങൾ വീണ്ടും ഓൺലൈനാണ്!"
          autoHide={true}
          duration={3000}
          ariaLive="polite"
        />
      </div>
    );
  }

  return null;
};

// Hook for online/offline status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Network status indicator component
export const NetworkStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const isOnline = useOnlineStatus();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
        aria-hidden="true"
      />
      <span className="text-xs text-gray-600">
        {isOnline ? 'Online' : 'Offline'}
      </span>
      <span className="text-xs text-gray-500" lang="ml">
        {isOnline ? 'ഓൺലൈൻ' : 'ഓഫ്‌ലൈൻ'}
      </span>
    </div>
  );
};