/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackInstallPromptAvailable,
  trackInstallPromptShown,
  trackInstallStarted,
  trackInstallCompleted,
  trackInstallFailed,
  trackInstallCancelled,
} from '../../../utils/installAnalytics';
import { analyticsService } from '../../../services/AnalyticsService';

// Mock the analytics service
vi.mock('../../../services/AnalyticsService', () => ({
  analyticsService: {
    trackPWAInstallEvent: vi.fn(),
    trackPWAInstallSourceAnalytics: vi.fn(),
    trackPWAInstallError: vi.fn(),
    trackPWAInstallMetrics: vi.fn(),
    trackPWAInstallUserPattern: vi.fn(),
  },
}));

// Mock install state detection
vi.mock('../../../utils/installStateDetection', () => ({
  getInstallState: vi.fn(() => ({
    isInstallable: true,
    isInstalled: false,
    displayMode: 'browser',
    installMethod: 'beforeinstallprompt',
    browserInfo: {
      isIOS: false,
      isAndroid: false,
      isChrome: true,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
      supportsBeforeInstallPrompt: true,
      supportsServiceWorker: true,
    },
    confidence: 'high',
  })),
}));

describe('Install Analytics Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should track install prompt available', () => {
    trackInstallPromptAvailable({
      source: 'automatic_banner',
      placement: 'banner',
      trigger: 'system_event',
      component: 'InstallPrompt',
    });

    expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
      action: 'prompt_available',
      source: 'automatic_banner',
      context: expect.objectContaining({
        placement: 'banner',
        trigger: 'system_event',
        installMethod: 'beforeinstallprompt',
        displayMode: 'browser',
        confidence: 'high',
      }),
    });
  });

  it('should track install started', () => {
    trackInstallStarted({
      source: 'settings_button',
      placement: 'settings',
      trigger: 'user_click',
      component: 'InstallButton',
    });

    expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
      action: 'install_started',
      source: 'settings_button',
      context: expect.objectContaining({
        placement: 'settings',
        trigger: 'user_click',
        installMethod: 'beforeinstallprompt',
        displayMode: 'browser',
        confidence: 'high',
      }),
    });

    expect(
      analyticsService.trackPWAInstallSourceAnalytics
    ).toHaveBeenCalledWith({
      source: 'settings_button',
      placement: 'settings',
      action: 'clicked',
      userJourney: expect.any(Array),
      context: expect.any(Object),
    });
  });

  it('should track install completed', () => {
    trackInstallCompleted({
      source: 'modal',
      placement: 'modal',
      trigger: 'user_click',
      component: 'InstallPrompt',
      outcome: 'accepted',
      platform: 'web',
      duration: 5000,
    });

    expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
      action: 'install_completed',
      source: 'modal',
      context: expect.objectContaining({
        placement: 'modal',
        installMethod: 'beforeinstallprompt',
        displayMode: 'browser',
        confidence: 'high',
        duration: 5000,
        outcome: 'accepted',
        platform: 'web',
      }),
    });

    expect(
      analyticsService.trackPWAInstallSourceAnalytics
    ).toHaveBeenCalledWith({
      source: 'modal',
      placement: 'modal',
      action: 'converted',
      conversionTime: 5000,
      userJourney: expect.any(Array),
      context: expect.any(Object),
    });
  });

  it('should track install failed', () => {
    trackInstallFailed({
      source: 'fallback_button',
      placement: 'navbar',
      trigger: 'user_click',
      component: 'FallbackInstallButton',
      errorType: 'PromptError',
      errorMessage: 'Install prompt failed',
      duration: 2000,
    });

    expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
      action: 'install_failed',
      source: 'fallback_button',
      context: expect.objectContaining({
        placement: 'navbar',
        installMethod: 'beforeinstallprompt',
        displayMode: 'browser',
        confidence: 'high',
        duration: 2000,
        errorType: 'PromptError',
        errorMessage: 'Install prompt failed',
      }),
    });

    expect(analyticsService.trackPWAInstallError).toHaveBeenCalledWith({
      type: 'unknown_error',
      source: 'fallback_button',
      stage: expect.any(String),
      errorDetails: expect.objectContaining({
        message: 'Install prompt failed',
        context: expect.any(Object),
      }),
    });
  });

  it('should track install cancelled', () => {
    trackInstallCancelled({
      source: 'automatic_banner',
      placement: 'banner',
      trigger: 'user_click',
      component: 'InstallPrompt',
      reason: 'user_dismissed',
      duration: 1500,
    });

    expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
      action: 'install_cancelled',
      source: 'automatic_banner',
      context: expect.objectContaining({
        placement: 'banner',
        installMethod: 'beforeinstallprompt',
        displayMode: 'browser',
        confidence: 'high',
        duration: 1500,
      }),
    });

    expect(
      analyticsService.trackPWAInstallSourceAnalytics
    ).toHaveBeenCalledWith({
      source: 'automatic_banner',
      placement: 'banner',
      action: 'abandoned',
      userJourney: expect.any(Array),
      context: expect.objectContaining({
        abandonment_reason: 'user_dismissed',
      }),
    });
  });
});
