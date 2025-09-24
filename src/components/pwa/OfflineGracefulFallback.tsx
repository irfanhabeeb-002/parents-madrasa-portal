import React from 'react';
import { useOfflineGracefulDegradation, useOnlineStatus } from '../../hooks/useOnlineStatus';
import { AlertBanner } from '../ui/AlertBanner';

interface OfflineGracefulFallbackProps {
  feature: string;
  children: React.ReactNode;
  fallbackContent?: React.ReactNode;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * Component that provides graceful degradation for features that require internet connectivity
 * Shows appropriate offline messages and fallback content when offline
 */
export const OfflineGracefulFallback: React.FC<OfflineGracefulFallbackProps> = ({
  feature,
  children,
  fallbackContent,
  showRetry = true,
  onRetry,
  className = '',
}) => {
  const {
    isOnline,
    shouldShowOfflineMessage,
    getOfflineMessage,
  } = useOfflineGracefulDegradation();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior - reload the page
      window.location.reload();
    }
  };

  if (shouldShowOfflineMessage(feature)) {
    const offlineMessage = getOfflineMessage(feature);

    return (
      <div className={`space-y-4 ${className}`}>
        <AlertBanner
          type="warning"
          message={offlineMessage.en}
          malayalamMessage={offlineMessage.ml}
          ariaLive="polite"
        />
        
        {fallbackContent && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-3">
              <span>Available offline:</span>
              <span className="ml-2" lang="ml">ഓഫ്‌ലൈനിൽ ലഭ്യം:</span>
            </div>
            {fallbackContent}
          </div>
        )}

        {showRetry && (
          <div className="flex justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <span>Try Again</span>
              <span className="ml-2" lang="ml">വീണ്ടും ശ്രമിക്കുക</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show children when online or feature doesn't require internet
  return <>{children}</>;
};

/**
 * Higher-order component for wrapping features that need offline handling
 */
export const withOfflineGracefulDegradation = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: string,
  fallbackContent?: React.ReactNode
) => {
  const WithOfflineGracefulDegradation: React.FC<P> = (props) => {
    return (
      <OfflineGracefulFallback feature={feature} fallbackContent={fallbackContent}>
        <WrappedComponent {...props} />
      </OfflineGracefulFallback>
    );
  };

  WithOfflineGracefulDegradation.displayName = `withOfflineGracefulDegradation(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithOfflineGracefulDegradation;
};

/**
 * Component for showing reduced functionality warnings on slow connections
 */
export const SlowConnectionWarning: React.FC<{
  className?: string;
  onOptimize?: () => void;
}> = ({ className = '', onOptimize }) => {
  const { isSlowConnection } = useOfflineGracefulDegradation();
  const { effectiveType } = useOnlineStatus();

  if (!isSlowConnection) return null;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="text-yellow-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-yellow-800 font-medium">
            Slow connection detected ({effectiveType?.toUpperCase()})
          </p>
          <p className="text-xs text-yellow-700 mt-1" lang="ml">
            മന്ദഗതിയിലുള്ള കണക്ഷൻ കണ്ടെത്തി
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Some features may load slowly or be temporarily disabled for better performance.
          </p>
        </div>
        {onOptimize && (
          <button
            onClick={onOptimize}
            className="text-yellow-800 hover:text-yellow-900 text-xs font-medium"
          >
            Optimize
          </button>
        )}
      </div>
    </div>
  );
};