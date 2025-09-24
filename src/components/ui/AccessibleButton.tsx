import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface AccessibleButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'warning'
    | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
  malayalamLabel?: string;
  ariaDescribedBy?: string;
  ariaLive?: 'off' | 'polite' | 'assertive';
  screenReaderText?: string;
}

export const AccessibleButton = forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      children,
      ariaLabel,
      malayalamLabel,
      ariaDescribedBy,
      ariaLive,
      screenReaderText,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      // Touch target compliance - minimum 48px for WCAG AA
      'min-h-[48px]',
      'min-w-[48px]',
      'touch-manipulation',
      // Layout and display
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'rounded-lg',
      // Transitions with reduced motion support
      'transition-all',
      'duration-200',
      'motion-reduce:transition-none',
      'motion-reduce:transform-none',
      // Disabled states
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:pointer-events-none',
      // Active state for touch feedback
      'active:scale-95',
      'motion-reduce:active:scale-100',
      'transform',
      // Enhanced focus styles for accessibility
      'focus:outline-none',
      'focus-visible:outline-2',
      'focus-visible:outline-blue-600',
      'focus-visible:outline-offset-2',
      'focus-visible:ring-4',
      'focus-visible:ring-blue-500/20',
      // High contrast mode support
      'forced-colors:border-2',
      'forced-colors:border-ButtonText',
      'forced-colors:focus-visible:outline-ButtonText',
      // Tap highlight removal for custom styling
      'tap-highlight-transparent',
    ];

    const variantClasses = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-blue-600 hover:border-blue-700',
      secondary:
        'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 border border-gray-300',
      success:
        'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 border border-green-600 hover:border-green-700',
      error:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-600 hover:border-red-700',
      warning:
        'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800 border border-yellow-600 hover:border-yellow-700',
      danger:
        'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 border border-red-700 hover:border-red-800 shadow-lg',
    };

    const sizeClasses = {
      sm: 'px-4 py-3 sm:px-5 sm:py-3 text-sm sm:text-base min-h-[48px] min-w-[48px]',
      md: 'px-5 py-3 sm:px-6 sm:py-4 lg:px-7 lg:py-4 text-base sm:text-lg min-h-[48px] min-w-[48px]',
      lg: 'px-6 py-4 sm:px-8 sm:py-5 lg:px-10 lg:py-6 text-lg sm:text-xl lg:text-2xl min-h-[56px] min-w-[56px]',
    };

    const combinedClasses = [
      ...baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].join(' ');

    const describedByIds =
      [
        malayalamLabel ? `${props.id || 'button'}-malayalam` : null,
        ariaDescribedBy,
        screenReaderText ? `${props.id || 'button'}-sr-text` : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <>
        <button
          ref={ref}
          className={combinedClasses}
          disabled={disabled || loading}
          aria-label={
            ariaLabel || (typeof children === 'string' ? children : undefined)
          }
          aria-busy={loading}
          aria-describedby={describedByIds}
          aria-live={ariaLive}
          role="button"
          type={props.type || 'button'}
          {...props}
        >
          {loading && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 motion-reduce:animate-none"
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

        {/* Screen reader only text for additional context */}
        {screenReaderText && (
          <span id={`${props.id || 'button'}-sr-text`} className="sr-only">
            {screenReaderText}
          </span>
        )}
      </>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
