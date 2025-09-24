import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface NotificationBannerProps {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  malayalamMessage?: string;
  onDismiss?: () => void;
  className?: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type,
  title,
  message,
  malayalamMessage,
  onDismiss,
  className = '',
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          title: 'text-green-800',
          message: 'text-green-700',
          IconComponent: CheckCircleIcon,
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          IconComponent: ExclamationTriangleIcon,
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700',
          IconComponent: InformationCircleIcon,
        };
    }
  };

  const styles = getTypeStyles();
  const { IconComponent } = styles;

  return (
    <div
      className={`
        ${styles.container}
        border rounded-lg p-4 mb-4 transition-all duration-200
        ${className}
      `}
      role="alert"
      aria-live="polite"
      aria-labelledby="notification-title"
      aria-describedby="notification-message"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent
            className={`w-5 h-5 ${styles.icon}`}
            aria-hidden="true"
          />
        </div>

        <div className="ml-3 flex-1">
          <h3
            id="notification-title"
            className={`text-sm font-medium ${styles.title}`}
          >
            {title}
          </h3>

          <div
            id="notification-message"
            className={`mt-1 text-sm ${styles.message}`}
          >
            <p>{message}</p>
            {malayalamMessage && (
              <p className="mt-1 text-xs opacity-80" lang="bn">
                {malayalamMessage}
              </p>
            )}
          </div>
        </div>

        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className={`
                inline-flex rounded-md p-1.5 transition-colors
                ${styles.icon} hover:bg-black hover:bg-opacity-10
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
