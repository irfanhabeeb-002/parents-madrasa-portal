import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'image' | 'custom';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number; // For text variant
  animate?: boolean;
  ariaLabel?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  lines = 1,
  animate = true,
  ariaLabel = 'Loading content',
}) => {
  const baseClasses = [
    'bg-gray-200',
    'rounded',
    animate ? 'animate-pulse' : '',
  ].filter(Boolean).join(' ');

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4';
      case 'card':
        return 'h-32 w-full';
      case 'avatar':
        return 'h-12 w-12 rounded-full';
      case 'button':
        return 'h-11 w-24 rounded-lg';
      case 'image':
        return 'h-48 w-full';
      case 'custom':
        return '';
      default:
        return 'h-4';
    }
  };

  const variantClasses = getVariantClasses();
  
  const combinedClasses = [
    baseClasses,
    variantClasses,
    className,
  ].join(' ');

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  // For text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2" role="status" aria-label={ariaLabel}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={combinedClasses}
            style={{
              ...style,
              // Make last line slightly shorter for more realistic appearance
              width: index === lines - 1 ? '75%' : style.width || '100%',
            }}
          />
        ))}
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }

  return (
    <div
      className={combinedClasses}
      style={style}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <SkeletonLoader variant="avatar" />
      <div className="flex-1">
        <SkeletonLoader variant="text" className="mb-2" />
        <SkeletonLoader variant="text" width="60%" />
      </div>
    </div>
    <SkeletonLoader variant="text" lines={3} />
  </div>
);

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonLoader variant="button" className={className} />
);

export const SkeletonText: React.FC<{ 
  lines?: number; 
  className?: string;
}> = ({ lines = 1, className = '' }) => (
  <SkeletonLoader variant="text" lines={lines} className={className} />
);

export const SkeletonImage: React.FC<{ 
  width?: string | number;
  height?: string | number;
  className?: string;
}> = ({ width, height, className = '' }) => (
  <SkeletonLoader 
    variant="image" 
    width={width} 
    height={height} 
    className={className} 
  />
);

// Dashboard skeleton for the main page
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex justify-between items-center">
      <div>
        <SkeletonLoader variant="text" width="200px" className="h-6 mb-2" />
        <SkeletonLoader variant="text" width="150px" className="h-4" />
      </div>
      <SkeletonLoader variant="button" />
    </div>
    
    {/* Cards grid skeleton */}
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
    
    {/* Announcements skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SkeletonLoader variant="text" width="120px" className="h-5 mb-3" />
      <SkeletonLoader variant="text" lines={2} />
    </div>
  </div>
);