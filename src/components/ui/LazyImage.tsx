import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  webpSrc?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  webpSrc,
  sizes,
  loading = 'lazy',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate placeholder with proper aspect ratio
  const placeholderSrc =
    placeholder ||
    `data:image/svg+xml;base64,${btoa(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="14">
        Loading...
      </text>
    </svg>
  `)}`;

  const errorPlaceholder = `data:image/svg+xml;base64,${btoa(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fef2f2"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#ef4444" font-family="system-ui, sans-serif" font-size="14">
        Failed to load
      </text>
    </svg>
  `)}`;

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading state */}
      {!isLoaded && !hasError && (
        <img
          src={placeholderSrc}
          alt=""
          className="w-full h-full object-cover blur-sm transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Error state */}
      {hasError && (
        <img
          src={errorPlaceholder}
          alt="Failed to load image"
          className="w-full h-full object-cover"
        />
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <picture>
          {webpSrc && (
            <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            sizes={sizes}
            loading={loading}
          />
        </picture>
      )}

      {/* Loading indicator */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
};

// Hook for preloading images
export const useImagePreloader = (imageSources: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => reject(src);
        img.src = src;
      });
    };

    const preloadAll = async () => {
      const promises = imageSources.map(src =>
        preloadImage(src)
          .then(loadedSrc => {
            setLoadedImages(prev => new Set([...prev, loadedSrc]));
            return loadedSrc;
          })
          .catch(failedSrc => {
            setFailedImages(prev => new Set([...prev, failedSrc]));
            return failedSrc;
          })
      );

      await Promise.allSettled(promises);
    };

    if (imageSources.length > 0) {
      preloadAll();
    }
  }, [imageSources]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (src: string) => loadedImages.has(src),
    hasFailed: (src: string) => failedImages.has(src),
  };
};

// WebP support detection
export const supportsWebP = (() => {
  let supported: boolean | null = null;

  return (): Promise<boolean> => {
    if (supported !== null) {
      return Promise.resolve(supported);
    }

    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        supported = webP.height === 2;
        resolve(supported);
      };
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  };
})();

// Utility to generate WebP source URLs
export const generateWebPSource = (originalSrc: string): string => {
  // This would typically be handled by your image CDN or build process
  // For now, we'll assume WebP versions exist with .webp extension
  const lastDotIndex = originalSrc.lastIndexOf('.');
  if (lastDotIndex === -1) return originalSrc;

  return originalSrc.substring(0, lastDotIndex) + '.webp';
};
