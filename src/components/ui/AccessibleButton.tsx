import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
  malayalamLabel?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      children,
      ariaLabel,
      malayalamLabel,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'touch-target',
      'focus-visible',
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'rounded-lg',
      'transition-colors',
      'duration-200',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'active:scale-95',
      'transform',
      'transition-transform',
    ];

    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
      success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800',
      error: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800',
      warning: 'bg-warning-600 text-white hover:bg-warning-700 active:bg-warning-800',
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[44px]',
      md: 'px-4 py-3 text-base min-h-[44px]',
      lg: 'px-6 py-4 text-lg min-h-[44px]',
    };

    const combinedClasses = [
      ...baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].join(' ');

    return (
      <button
        ref={ref}
        className={combinedClasses}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <div className="flex flex-col items-center">
          <span>{children}</span>
          {malayalamLabel && (
            <span className="text-xs opacity-80 mt-1" lang="bn">
              {malayalamLabel}
            </span>
          )}
        </div>
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';