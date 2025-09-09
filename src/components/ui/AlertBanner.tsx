import React, { useEffect, useState } from 'react';
import { AccessibleButton } from './AccessibleButton';

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'class_reminder' | 'new_content';
  message: string;
  malayalamMessage?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  className?: string;
  showIcon?: boolean;
  ariaLive?: 'polite' | 'assertive';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  message,
  malayalamMessage,
  onDismiss,
  autoHide = false,
  duration = 5000,
  className = '',
  showIcon = true,
  ariaLive = 'polite',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onDismiss?.();
        }, 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  const typeConfig = {
    success: {
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      textColor: 'text-success-800',
      iconColor: 'text-success-600',
      icon: '✅',
      ariaLabel: 'Success',
    },
    error: {
      bgColor: 'bg-error-50',
      borderColor: 'border-error-200',
      textColor: 'text-error-800',
      iconColor: 'text-error-600',
      icon: '❌',
      ariaLabel: 'Error',
    },
    warning: {
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      textColor: 'text-warning-800',
      iconColor: 'text-warning-600',
      icon: '⚠️',
      ariaLabel: 'Warning',
    },
    info: {
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-800',
      iconColor: 'text-primary-600',
      icon: 'ℹ️',
      ariaLabel: 'Information',
    },
    loading: {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      iconColor: 'text-gray-600',
      icon: '⏳',
      ariaLabel: 'Loading',
    },
    class_reminder: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      icon: '🔔',
      ariaLabel: 'Class Reminder',
    },
    new_content: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      icon: '📚',
      ariaLabel: 'New Content',
    },
  };

  const config = typeConfig[type];

  if (!isVisible) return null;

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg p-4 transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}
        ${className}
      `}
      role="alert"
      aria-live={ariaLive}
      aria-label={config.ariaLabel}
    >
      <div className="flex items-start">
        {showIcon && (
          <div className={`${config.iconColor} flex-shrink-0 mr-3 mt-0.5 text-lg`}>
            {config.icon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {message}
          </p>
          {malayalamMessage && (
            <p className="text-sm mt-1 opacity-90" lang="bn">
              {malayalamMessage}
            </p>
          )}
        </div>
        
        {onDismiss && (
          <div className="ml-3 flex-shrink-0">
            <AccessibleButton
              variant="secondary"
              size="sm"
              onClick={handleDismiss}
              ariaLabel="Dismiss alert"
              className={`
                !min-h-[32px] !min-w-[32px] !p-1 
                ${config.bgColor} hover:bg-opacity-80 border-0
              `}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </AccessibleButton>
          </div>
        )}
      </div>
    </div>
  );
};