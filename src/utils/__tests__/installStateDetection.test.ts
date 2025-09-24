/**
 * Tests for install state detection utility
 */

import { describe } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import {
  createInstallStateDetector,
  getInstallState,
  createDisplayModeListener,
} from '../installStateDetection';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Mock navigator
const mockNavigator = (standalone?: boolean, userAgent?: string) => {
  Object.defineProperty(window, 'navigator', {
    value: {
      ...window.navigator,
      standalone,
      userAgent:
        userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      serviceWorker: { register: vi.fn() },
    },
    writable: true,
  });
};

describe('installStateDetection', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock document.querySelector for manifest check
    document.querySelector = vi
      .fn()
      .mockReturnValue({ href: '/manifest.json' });
  });

  describe('createInstallStateDetector', () => {
    it('should detect standalone mode correctly', () => {
      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(display-mode: standalone)') {
          return mockMatchMedia(true);
        }
        return mockMatchMedia(false);
      });

      const detector = createInstallStateDetector();
      expect(detector.checkStandaloneMode()).toBe(true);
    });

    it('should detect PWA mode on iOS', () => {
      mockNavigator(
        true,
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      );

      const detector = createInstallStateDetector();
      expect(detector.checkPWAMode()).toBe(true);
    });

    it('should detect display mode correctly', () => {
      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(display-mode: standalone)') {
          return mockMatchMedia(true);
        }
        return mockMatchMedia(false);
      });

      const detector = createInstallStateDetector();
      expect(detector.checkDisplayMode()).toBe('standalone');
    });

    it('should detect iOS standalone correctly', () => {
      mockNavigator(
        true,
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      );
      window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia(false));

      const detector = createInstallStateDetector();
      expect(detector.checkIOSStandalone()).toBe(true);
    });

    it('should detect Android PWA correctly', () => {
      mockNavigator(false, 'Mozilla/5.0 (Linux; Android 10; SM-G975F)');
      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(display-mode: standalone)') {
          return mockMatchMedia(true);
        }
        return mockMatchMedia(false);
      });

      const detector = createInstallStateDetector();
      expect(detector.checkAndroidPWA()).toBe(true);
    });

    it('should detect installation status', () => {
      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(display-mode: standalone)') {
          return mockMatchMedia(true);
        }
        return mockMatchMedia(false);
      });

      const detector = createInstallStateDetector();
      expect(detector.isInstalled()).toBe(true);
    });

    it('should detect PWA support', () => {
      mockNavigator(
        false,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );
      window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia(false));

      const detector = createInstallStateDetector();
      expect(detector.isPWASupported()).toBe(true);
    });

    it('should get browser info correctly', () => {
      mockNavigator(
        false,
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      );

      const detector = createInstallStateDetector();
      const browserInfo = detector.getBrowserInfo();

      expect(browserInfo.isIOS).toBe(true);
      expect(browserInfo.isAndroid).toBe(false);
      expect(browserInfo.isSafari).toBe(true);
      expect(browserInfo.isChrome).toBe(false);
    });
  });

  describe('getInstallState', () => {
    it('should return correct install state when installed', () => {
      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(display-mode: standalone)') {
          return mockMatchMedia(true);
        }
        return mockMatchMedia(false);
      });

      const installState = getInstallState();

      expect(installState.isInstalled).toBe(true);
      expect(installState.isInstallable).toBe(false);
      expect(installState.displayMode).toBe('standalone');
      expect(installState.confidence).toBe('high');
    });

    it('should return correct install state when not installed but installable', () => {
      window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia(false));
      mockNavigator(
        false,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      const mockDeferredPrompt = { prompt: vi.fn() };
      const installState = getInstallState(mockDeferredPrompt);

      expect(installState.isInstalled).toBe(false);
      expect(installState.isInstallable).toBe(true);
      expect(installState.displayMode).toBe('browser');
      expect(installState.installMethod).toBe('beforeinstallprompt');
      expect(installState.confidence).toBe('high');
    });

    it('should return correct install state when not supported', () => {
      window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia(false));
      mockNavigator(
        false,
        'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)'
      );

      // Mock no service worker support
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          userAgent:
            'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
        },
        writable: true,
      });
      delete (window.navigator as any).serviceWorker;

      const installState = getInstallState();

      expect(installState.isInstalled).toBe(false);
      expect(installState.isInstallable).toBe(false);
      expect(installState.installMethod).toBe('not-supported');
      expect(installState.confidence).toBe('low');
    });
  });

  describe('createDisplayModeListener', () => {
    it('should create display mode listener correctly', () => {
      const mockMediaQuery = mockMatchMedia(false);
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery);

      const callback = vi.fn();
      const cleanup = createDisplayModeListener(callback);

      expect(typeof cleanup).toBe('function');
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should handle errors gracefully', () => {
      window.matchMedia = vi.fn().mockImplementation(() => {
        throw new Error('matchMedia not supported');
      });

      const callback = vi.fn();
      const cleanup = createDisplayModeListener(callback);

      expect(typeof cleanup).toBe('function');
      // Should not throw
      cleanup();
    });
  });

  describe('error handling', () => {
    it('should handle matchMedia errors gracefully', () => {
      window.matchMedia = vi.fn().mockImplementation(() => {
        throw new Error('matchMedia error');
      });

      const detector = createInstallStateDetector();

      expect(detector.checkStandaloneMode()).toBe(false);
      expect(detector.checkDisplayMode()).toBe('browser');
    });

    it('should handle navigator errors gracefully', () => {
      // Mock navigator to throw error
      Object.defineProperty(window, 'navigator', {
        get: () => {
          throw new Error('Navigator error');
        },
        configurable: true,
      });

      const detector = createInstallStateDetector();
      expect(detector.checkPWAMode()).toBe(false);
    });
  });
});
