import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'circle' | 'rectangle' | 'image' | 'custom';
  lines?: number;
  className?: string;
  width?: string;
  height?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  lines = 1,
  className = '',
  width,
  height,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={`${baseClasses} h-4`}
            style={{
              width: width || (index === lines - 1 ? '75%' : '100%'),
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{
          width: width || '40px',
          height: height || width || '40px',
        }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'image') {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{
          width: width || '100px',
          height: height || '100px',
        }}
      />
    );
  }

  if (variant === 'custom') {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{
          width: width,
          height: height,
        }}
      />
    );
  }

  // Rectangle variant (default)
  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
      }}
    />
  );
};

// Additional skeleton components for convenience
export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = '',
}) => <SkeletonLoader variant="card" className={className} />;

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = '',
}) => <SkeletonLoader variant="text" lines={lines} className={className} />;

export const SkeletonCircle: React.FC<{
  size?: string;
  className?: string;
}> = ({ size = '40px', className = '' }) => (
  <SkeletonLoader
    variant="circle"
    width={size}
    height={size}
    className={className}
  />
);

export const SkeletonImage: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = '100px', height = '100px', className = '' }) => (
  <SkeletonLoader
    variant="image"
    width={width}
    height={height}
    className={className}
  />
);

export const SkeletonButton: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <SkeletonLoader
    variant="rectangle"
    width="120px"
    height="44px"
    className={`rounded-lg ${className}`}
  />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="space-y-2">
      <SkeletonLoader variant="text" lines={1} width="200px" />
      <SkeletonLoader variant="text" lines={1} width="150px" />
    </div>

    {/* Cards grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>

    {/* Content skeleton */}
    <div className="space-y-4">
      <SkeletonLoader variant="text" lines={3} />
      <SkeletonLoader variant="rectangle" height="200px" />
    </div>
  </div>
);
