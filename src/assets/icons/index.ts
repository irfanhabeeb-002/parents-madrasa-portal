// Centralized icon management for the Parents Madrasa Portal
// This file provides consistent access to app icons across the application
// Supports WebP format with fallbacks for better performance

import appIconJpg from './app-icon.jpg';
import appIcon512Jpg from './app-icon-512.jpg';

export const AppIcons = {
  // Main app icon (192x192) with WebP support
  main: appIconJpg,
  mainWebP: '/src/assets/icons/app-icon.webp',
  
  // Large app icon (512x512) with WebP support
  large: appIcon512Jpg,
  largeWebP: '/src/assets/icons/app-icon-512.webp',
  
  // Icon paths for components with format options
  paths: {
    main: {
      webp: '/src/assets/icons/app-icon.webp',
      jpg: '/src/assets/icons/app-icon.jpg',
    },
    large: {
      webp: '/src/assets/icons/app-icon-512.webp',
      jpg: '/src/assets/icons/app-icon-512.jpg',
    },
  },
  
  // Public assets (used by PWA manifest and HTML) with WebP support
  favicon: '/icons/favicon.ico',
  appleTouchIcon: {
    webp: '/icons/apple-touch-icon.webp',
    png: '/icons/apple-touch-icon.png',
  },
  maskedIcon: '/icons/masked-icon.svg',
  pwa192: {
    webp: '/icons/pwa-192x192.webp',
    jpg: '/icons/pwa-192x192.jpg',
    png: '/icons/pwa-192x192.png',
  },
  pwa512: {
    webp: '/icons/pwa-512x512.webp',
    jpg: '/icons/pwa-512x512.jpg',
  },
} as const;

export type IconSize = '192' | '512';
export type IconFormat = 'webp' | 'jpg' | 'png' | 'ico' | 'svg';

// Helper function to get icon by size with WebP support
export const getAppIcon = (size: IconSize = '192', preferWebP: boolean = true): string => {
  if (size === '512') {
    return preferWebP ? AppIcons.largeWebP : AppIcons.large;
  }
  return preferWebP ? AppIcons.mainWebP : AppIcons.main;
};

// Helper function for PWA manifest icons with format preference
export const getManifestIcon = (size: IconSize = '192', format: IconFormat = 'webp'): string => {
  const iconSet = size === '512' ? AppIcons.pwa512 : AppIcons.pwa192;
  
  if (typeof iconSet === 'string') {
    return iconSet;
  }
  
  return iconSet[format] || iconSet.jpg || iconSet.png || '';
};

// Helper function to check WebP support and return appropriate format
export const getOptimizedIcon = (size: IconSize = '192'): { webp: string; fallback: string } => {
  const paths = AppIcons.paths[size === '512' ? 'large' : 'main'];
  return {
    webp: paths.webp,
    fallback: paths.jpg,
  };
};

// Helper function for responsive image sources
export const getIconSources = (size: IconSize = '192') => {
  const optimized = getOptimizedIcon(size);
  return [
    { srcSet: optimized.webp, type: 'image/webp' },
    { srcSet: optimized.fallback, type: 'image/jpeg' },
  ];
};