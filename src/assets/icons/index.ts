// Centralized icon management for the Parents Madrasa Portal
// This file provides consistent access to app icons across the application

import appIconJpg from './app-icon.jpg';
import appIcon512Jpg from './app-icon-512.jpg';

export const AppIcons = {
  // Main app icon (192x192)
  main: appIconJpg,
  
  // Large app icon (512x512)
  large: appIcon512Jpg,
  
  // Icon paths for components
  paths: {
    main: '/src/assets/icons/app-icon.jpg',
    large: '/src/assets/icons/app-icon-512.jpg',
  },
  
  // Public assets (used by PWA manifest and HTML)
  favicon: '/favicon.ico',
  appleTouchIcon: '/apple-touch-icon.png',
  maskedIcon: '/masked-icon.svg',
  pwa192: '/pwa-192x192.jpg',
  pwa512: '/pwa-512x512.jpg',
} as const;

export type IconSize = '192' | '512';
export type IconFormat = 'jpg' | 'png' | 'ico' | 'svg';

// Helper function to get icon by size
export const getAppIcon = (size: IconSize = '192'): string => {
  return size === '512' ? AppIcons.large : AppIcons.main;
};

// Helper function for PWA manifest icons
export const getManifestIcon = (size: IconSize = '192'): string => {
  return size === '512' ? AppIcons.pwa512 : AppIcons.pwa192;
};