import React, { useEffect, useState } from 'react';
import { AccessibleButton } from './AccessibleButton';

interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  malayalamMessage?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  className?: string;
  showIcon?: boolean;
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
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      ariaLabel: 'Success',
    },
    error: {
      bgColor: 'bg-error-50',
      borderColor: 'border-error-200',
      textColor: 'text-error-800',
      iconColor: 'text-error-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
      ariaLabel: 'Error',
    },
    warning: {
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      textColor: 'text-warning-800',
      iconColor: 'text-warning-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      ariaLabel: 'Warning',
    },
    info: {
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-800',
      iconColor: 'text-primary-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
      ariaLabel: 'Information',
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
      aria-live="polite"
      aria-label={config.ariaLabel}
    >
      <div className="flex items-start">
        {showIcon && (
          <div className={`${config.iconColor} flex-shrink-0 mr-3 mt-0.5`}>
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