import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'danger';
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
      'focus-enhanced',
      'keyboard-focus-button',
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
      // Enhanced accessibility
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'focus:ring-blue-500',
    ];

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-blue-600 hover:border-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 border border-gray-300',
      success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 border border-green-600 hover:border-green-700',
      error: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-600 hover:border-red-700',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800 border border-yellow-600 hover:border-yellow-700',
      danger: 'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 border border-red-700 hover:border-red-800 shadow-lg',
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
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-busy={loading}
        aria-describedby={malayalamLabel ? `${props.id || 'button'}-malayalam` : undefined}
        role="button"
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
            <span 
              id={`${props.id || 'button'}-malayalam`}
              className="text-xs opacity-80 mt-1" 
              lang="ml"
            >
              {malayalamLabel}
            </span>
          )}
        </div>
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';