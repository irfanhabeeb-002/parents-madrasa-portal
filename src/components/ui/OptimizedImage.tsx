import React from 'react';

interface OptimizedImageProps {
  src: string;
  webpSrc?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  sizes?: string;
}

/**
 * OptimizedImage component that provides WebP support with fallbacks
 * Automatically serves WebP when supported, falls back to original format
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  webpSrc,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  sizes,
}) => {
  // If no WebP source provided, try to generate one
  const webpSource = webpSrc || src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  
  return (
    <picture className={className}>
      {/* WebP source for modern browsers */}
      <source srcSet={webpSource} type="image/webp" sizes={sizes} />
      
      {/* Fallback for browsers that don't support WebP */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className="w-full h-full object-cover"
        sizes={sizes}
      />
    </picture>
  );
};

export default OptimizedImage;