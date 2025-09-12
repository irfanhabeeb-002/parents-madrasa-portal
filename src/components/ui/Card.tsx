import React from 'react';
import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  malayalamSubtitle?: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  children?: ReactNode;
  variant?: 'default' | 'interactive' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  malayalamSubtitle,
  icon,
  onClick,
  disabled = false,
  ariaLabel,
  className = '',
  children,
  variant = 'default',
}) => {
  const baseClasses = [
    'bg-white',
    'rounded-lg',
    'border',
    'border-gray-200',
    'transition-all',
    'duration-200',
  ];

  const variantClasses = {
    default: 'shadow-sm',
    interactive: [
      'shadow-md',
      'hover:shadow-lg',
      'cursor-pointer',
      'touch-target',
      'focus-visible',
      'active:scale-98',
      'transform',
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-300',
    ],
    elevated: 'shadow-lg',
  };

  const combinedClasses = [
    ...baseClasses,
    ...(Array.isArray(variantClasses[variant]) 
      ? variantClasses[variant] 
      : [variantClasses[variant]]),
    className,
  ].join(' ');

  const CardContent = () => (
    <div className="p-4 sm:p-5 lg:p-6">
      {icon && (
        <div className="flex justify-center mb-3 sm:mb-4 lg:mb-5">
          <div className="flex items-center justify-center text-primary-600">
            {icon}
          </div>
        </div>
      )}
      
      <div className="text-center">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2 lg:mb-3">
          {title}
        </h2>
        
        {subtitle && (
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-1 sm:mb-2">
            {subtitle}
          </p>
        )}
        
        {malayalamSubtitle && (
          <p className="text-sm sm:text-base lg:text-lg text-gray-500" lang="ml">
            {malayalamSubtitle}
          </p>
        )}
      </div>
      
      {children && (
        <div className="mt-4 sm:mt-5 lg:mt-6">
          {children}
        </div>
      )}
    </div>
  );

  if (onClick && !disabled) {
    return (
      <button
        className={combinedClasses}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel || title}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <CardContent />
      </button>
    );
  }

  return (
    <div className={combinedClasses} role={onClick ? 'button' : undefined}>
      <CardContent />
    </div>
  );
};