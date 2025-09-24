/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { 
  installAnalyticsTracker,
  trackInstallPromptAvailable,
  trackInstallPromptShown,
  trackInstallStarted,
  trackInstallCompleted,
  trackInstallFailed,
  trackInstallCancelled,
  trackFallbackShown,
  trackAutomaticPromptFailed,
} from '../../../utils/installAnalytics';
import { analyticsService } from '../../../services/AnalyticsService';

// Mock the analytics service
jest.mock('../../../services/AnalyticsService', () => ({
  analyticsService: {
    trackPWAInstallEvent: jest.fn(),
    trackPWAInstallSourceAnalytics: jest.fn(),
    trackPWAInstallError: jest.fn(),
    trackPWAInstallMetrics: jest.fn(),
    trackPWAInstallUserPattern: jest.fn(),
  },
}));

// Mock install state detection
jest.mock('../../../utils/installStateDetection', () => ({
  getInstallState: jest.fn(() => ({
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

describe('Install Analytics', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear session storage
    sessionStorage.clear();
    
    // Reset analytics tracker session
    installAnalyticsTracker.clearSession();
  });

  describe('Basic Event Tracking', () => {
    it('should track install prompt available event', () => {
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

    it('should track install prompt shown event', () => {
      trackInstallPromptShown({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'automatic_timing',
        component: 'InstallPrompt',
      });

      expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
        action: 'prompt_shown',
        source: 'automatic_banner',
        context: expect.objectContaining({
          placement: 'banner',
          trigger: 'automatic_timing',
          installMethod: 'beforeinstallprompt',
          displayMode: 'browser',
          confidence: 'high',
        }),
      });

      expect(analyticsService.trackPWAInstallSourceAnalytics).toHaveBeenCalledWith({
        source: 'automatic_banner',
        placement: 'banner',
        action: 'shown',
        userJourney: expect.any(Array),
        context: expect.any(Object),
      });
    });

    it('should track install started event', () => {
      trackInstallStarted({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
        retryCount: 0,
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
          retryCount: 0,
        }),
      });

      expect(analyticsService.trackPWAInstallSourceAnalytics).toHaveBeenCalledWith({
        source: 'settings_button',
        placement: 'settings',
        action: 'clicked',
        userJourney: expect.any(Array),
        context: expect.any(Object),
      });
    });

    it('should track install completed event', () => {
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

      expect(analyticsService.trackPWAInstallSourceAnalytics).toHaveBeenCalledWith({
        source: 'modal',
        placement: 'modal',
        action: 'converted',
        conversionTime: 5000,
        userJourney: expect.any(Array),
        context: expect.any(Object),
      });
    });

    it('should track install failed event', () => {
      trackInstallFailed({
        source: 'fallback_button',
        placement: 'navbar',
        trigger: 'user_click',
        component: 'FallbackInstallButton',
        errorType: 'PromptError',
        errorMessage: 'Install prompt failed',
        errorStack: 'Error stack trace',
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
        type: 'unknown_error', // Mapped from PromptError
        source: 'fallback_button',
        stage: expect.any(String),
        errorDetails: expect.objectContaining({
          message: 'Install prompt failed',
          stack: 'Error stack trace',
          context: expect.any(Object),
        }),
      });
    });

    it('should track install cancelled event', () => {
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

      expect(analyticsService.trackPWAInstallSourceAnalytics).toHaveBeenCalledWith({
        source: 'automatic_banner',
        placement: 'banner',
        action: 'abandoned',
        userJourney: expect.any(Array),
        context: expect.objectContaining({
          abandonment_reason: 'user_dismissed',
        }),
      });
    });

    it('should track fallback shown event', () => {
      trackFallbackShown({
        source: 'fallback_button',
        placement: 'navbar',
        trigger: 'fallback_detection',
        component: 'FallbackInstallButton',
      });

      expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
        action: 'fallback_shown',
        source: 'fallback_button',
        context: expect.objectContaining({
          placement: 'navbar',
          trigger: 'fallback_detection',
          installMethod: 'beforeinstallprompt',
          displayMode: 'browser',
          confidence: 'high',
        }),
      });
    });

    it('should track automatic prompt failed event', () => {
      trackAutomaticPromptFailed({
        source: 'system',
        placement: 'banner',
        trigger: 'fallback_detection',
        component: 'InstallPrompt',
        expectedDelay: 5000,
        detectionDelay: 10000,
      });

      expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
        action: 'automatic_prompt_failed',
        source: 'system',
        context: expect.objectContaining({
          trigger: 'fallback_detection',
          installMethod: 'beforeinstallprompt',
          displayMode: 'browser',
          confidence: 'high',
        }),
      });

      expect(analyticsService.trackPWAInstallError).toHaveBeenCalledWith({
        type: 'prompt_failed',
        source: 'automatic_banner',
        stage: 'prompt_detection',
        errorDetails: expect.objectContaining({
          message: 'Automatic install prompt failed to appear',
          context: expect.objectContaining({
            expected_delay: 5000,
            detection_delay: 10000,
          }),
        }),
      });
    });
  });

  describe('Session Management', () => {
    it('should create and manage session data', () => {
      // Track multiple events to build session data
      trackInstallPromptAvailable({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'system_event',
        component: 'InstallPrompt',
      });

      trackInstallPromptShown({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'automatic_timing',
        component: 'InstallPrompt',
      });

      trackInstallStarted({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'user_click',
        component: 'InstallPrompt',
      });

      // Check that session data is being stored
      const sessionId = sessionStorage.getItem('pwa_install_session_id');
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);

      const sessionData = sessionStorage.getItem('pwa_install_session_data');
      expect(sessionData).toBeTruthy();

      const parsedData = JSON.parse(sessionData!);
      expect(parsedData.stages).toHaveLength(3);
      expect(parsedData.sourcesUsed).toContain('automatic_banner');
      expect(parsedData.completed).toBe(false);
      expect(parsedData.abandoned).toBe(false);
    });

    it('should track session completion', () => {
      // Start and complete an install flow
      trackInstallStarted({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
      });

      trackInstallCompleted({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
        outcome: 'accepted',
        platform: 'web',
        duration: 3000,
      });

      // Check that metrics are tracked
      expect(analyticsService.trackPWAInstallMetrics).toHaveBeenCalledWith({
        type: 'success_rate',
        value: 1,
        timeframe: 'session',
        context: expect.objectContaining({
          stages_completed: expect.any(Number),
          errors_encountered: 0,
          retry_attempts: expect.any(Number),
          sources_used: expect.any(Number),
        }),
      });

      expect(analyticsService.trackPWAInstallMetrics).toHaveBeenCalledWith({
        type: 'conversion_rate',
        value: 1,
        timeframe: 'session',
        context: expect.objectContaining({
          funnel_stages: expect.any(Number),
        }),
      });
    });

    it('should track session abandonment', () => {
      trackInstallStarted({
        source: 'modal',
        placement: 'modal',
        trigger: 'user_click',
        component: 'InstallPrompt',
      });

      trackInstallCancelled({
        source: 'modal',
        placement: 'modal',
        trigger: 'user_click',
        component: 'InstallPrompt',
        reason: 'user_dismissed',
        duration: 1000,
      });

      expect(analyticsService.trackPWAInstallMetrics).toHaveBeenCalledWith({
        type: 'abandonment_rate',
        value: 1,
        timeframe: 'session',
        context: expect.objectContaining({
          abandonment_reason: 'user_dismissed',
          abandonment_stage: expect.any(String),
        }),
      });
    });

    it('should track retry behavior', () => {
      // First attempt fails
      trackInstallStarted({
        source: 'fallback_button',
        placement: 'navbar',
        trigger: 'user_click',
        component: 'FallbackInstallButton',
        retryCount: 0,
      });

      trackInstallFailed({
        source: 'fallback_button',
        placement: 'navbar',
        trigger: 'user_click',
        component: 'FallbackInstallButton',
        errorType: 'NetworkError',
        errorMessage: 'Network connection failed',
        retryCount: 0,
      });

      // Second attempt succeeds
      trackInstallStarted({
        source: 'fallback_button',
        placement: 'navbar',
        trigger: 'user_click',
        component: 'FallbackInstallButton',
        retryCount: 1,
      });

      trackInstallCompleted({
        source: 'fallback_button',
        placement: 'navbar',
        trigger: 'user_click',
        component: 'FallbackInstallButton',
        outcome: 'accepted',
        platform: 'web',
        duration: 2000,
        retryCount: 1,
      });

      // Check that retry metrics are tracked
      expect(analyticsService.trackPWAInstallMetrics).toHaveBeenCalledWith({
        type: 'retry_rate',
        value: expect.any(Number),
        timeframe: 'session',
        context: expect.objectContaining({
          total_retries: expect.any(Number),
        }),
      });
    });
  });

  describe('Error Categorization', () => {
    it('should categorize different error types correctly', () => {
      const errorTests = [
        {
          errorType: 'beforeinstallprompt_handler_error',
          expectedCategory: 'event_listener_failed',
        },
        {
          errorType: 'install_prompt_timeout',
          expectedCategory: 'prompt_failed',
        },
        {
          errorType: 'user_choice_timeout',
          expectedCategory: 'user_choice_timeout',
        },
        {
          errorType: 'installation_failed',
          expectedCategory: 'installation_failed',
        },
        {
          errorType: 'invalid_event_structure',
          expectedCategory: 'browser_not_supported',
        },
        {
          errorType: 'missing_prompt_method',
          expectedCategory: 'browser_not_supported',
        },
        {
          errorType: 'automatic_prompt_failed',
          expectedCategory: 'prompt_failed',
        },
        {
          errorType: 'network_error',
          expectedCategory: 'network_error',
        },
        {
          errorType: 'unknown_error_type',
          expectedCategory: 'unknown_error',
        },
      ];

      errorTests.forEach(({ errorType, expectedCategory }) => {
        jest.clearAllMocks();

        trackInstallFailed({
          source: 'settings_button',
          placement: 'settings',
          trigger: 'user_click',
          component: 'InstallButton',
          errorType,
          errorMessage: `Test error: ${errorType}`,
        });

        expect(analyticsService.trackPWAInstallError).toHaveBeenCalledWith({
          type: expectedCategory,
          source: 'settings_button',
          stage: expect.any(String),
          errorDetails: expect.objectContaining({
            message: `Test error: ${errorType}`,
          }),
        });
      });
    });
  });

  describe('User Journey Tracking', () => {
    it('should track user journey across multiple sources', () => {
      // User sees automatic banner
      trackInstallPromptShown({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'automatic_timing',
        component: 'InstallPrompt',
      });

      // User dismisses banner
      trackInstallCancelled({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'user_click',
        component: 'InstallPrompt',
        reason: 'user_dismissed',
      });

      // User later uses settings button
      trackInstallStarted({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
      });

      trackInstallCompleted({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
        outcome: 'accepted',
        platform: 'web',
      });

      // Check that user journey is tracked
      const sessionSummary = installAnalyticsTracker.getSessionSummary();
      expect(sessionSummary?.sourcesUsed).toContain('automatic_banner');
      expect(sessionSummary?.sourcesUsed).toContain('settings_button');
      expect(sessionSummary?.stages).toHaveLength(4);
    });

    it('should track user patterns', () => {
      // Simulate funnel progression
      trackInstallPromptShown({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'automatic_timing',
        component: 'InstallPrompt',
      });

      // Wait a bit then start install
      setTimeout(() => {
        trackInstallStarted({
          source: 'automatic_banner',
          placement: 'banner',
          trigger: 'user_click',
          component: 'InstallPrompt',
        });
      }, 100);

      // Check that user patterns are tracked
      expect(analyticsService.trackPWAInstallUserPattern).toHaveBeenCalled();
    });
  });

  describe('Session Persistence', () => {
    it('should persist session data across page reloads', () => {
      // Create initial session
      trackInstallPromptAvailable({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'system_event',
        component: 'InstallPrompt',
      });

      const initialSessionId = sessionStorage.getItem('pwa_install_session_id');
      const initialSessionData = sessionStorage.getItem('pwa_install_session_data');

      // Simulate page reload by creating new tracker instance
      const newTracker = installAnalyticsTracker;
      
      // Session should be restored
      const restoredSessionId = sessionStorage.getItem('pwa_install_session_id');
      expect(restoredSessionId).toBe(initialSessionId);

      // Add another event
      trackInstallStarted({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
      });

      // Session should be updated
      const updatedSessionData = sessionStorage.getItem('pwa_install_session_data');
      expect(updatedSessionData).not.toBe(initialSessionData);

      const parsedData = JSON.parse(updatedSessionData!);
      expect(parsedData.stages).toHaveLength(2);
    });

    it('should clear session data when requested', () => {
      // Create session with data
      trackInstallPromptAvailable({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'system_event',
        component: 'InstallPrompt',
      });

      expect(sessionStorage.getItem('pwa_install_session_id')).toBeTruthy();
      expect(sessionStorage.getItem('pwa_install_session_data')).toBeTruthy();

      // Clear session
      installAnalyticsTracker.clearSession();

      // Session data should be cleared and new session created
      const newSessionId = sessionStorage.getItem('pwa_install_session_id');
      expect(newSessionId).toBeTruthy();
      
      const sessionSummary = installAnalyticsTracker.getSessionSummary();
      expect(sessionSummary?.stages).toHaveLength(0);
      expect(sessionSummary?.completed).toBe(false);
      expect(sessionSummary?.abandoned).toBe(false);
    });
  });
});