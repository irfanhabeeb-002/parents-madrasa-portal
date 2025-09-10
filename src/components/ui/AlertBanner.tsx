import React, { useEffect, useState } from 'react';

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  malayalamMessage?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  message,
  malayalamMessage,
  onDismiss,
  autoHide = false,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: '✓',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: '✗',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: '⚠',
          iconColor: 'text-yellow-600'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'ℹ',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'ℹ',
          iconColor: 'text-gray-600'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`border rounded-lg p-4 ${styles.container}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${styles.iconColor} text-lg`}>
          {styles.icon}
        </div>
        
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          {malayalamMessage && (
            <p className="text-sm mt-1 opacity-90" lang="ml">
              {malayalamMessage}
            </p>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            className={`flex-shrink-0 ${styles.iconColor} hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded`}
            aria-label="Dismiss alert"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};