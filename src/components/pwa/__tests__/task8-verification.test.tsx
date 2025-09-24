/**
 * Task 8 Verification Test: Comprehensive Install Event Tracking and Analytics
 *
 * This test verifies that all requirements for task 8 are implemented:
 * - Enhanced analytics tracking in both InstallPrompt and InstallButton components
 * - Tracking for install success/failure rates and user interaction patterns
 * - Proper event tracking for different install sources (banner, settings, fallback)
 * - Error tracking for install-related failures and edge cases
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InstallPrompt } from '../InstallPrompt';
import { InstallButton } from '../InstallButton';
import { FallbackInstallButton } from '../FallbackInstallButton';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { analyticsService } from '../../../services/AnalyticsService';
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

// Mock analytics service
vi.mock('../../../services/AnalyticsService', () => ({
  analyticsService: {
    trackPWAInstallEvent: vi.fn(),
    trackPWAInstallSourceAnalytics: vi.fn(),
    trackPWAInstallError: vi.fn(),
    trackPWAInstallMetrics: vi.fn(),
    trackPWAInstallUserPattern: vi.fn(),
    trackEvent: vi.fn(),
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
  createDisplayModeListener: vi.fn(() => vi.fn()),
  createInstallStateDetector: vi.fn(),
}));

// Mock install prompt hook
vi.mock('../InstallPrompt', () => ({
  InstallPrompt: vi.fn(() => (
    <div data-testid="install-prompt">Install Prompt</div>
  )),
  useInstallPrompt: vi.fn(() => ({
    isInstallable: true,
    isInstalled: false,
    installState: 'available',
    promptInstall: vi.fn().mockResolvedValue(true),
    wasRecentlyDismissed: false,
  })),
}));

// Mock performance hooks
vi.mock('../../../utils/performance', () => ({
  useInstallPromptPerformance: vi.fn(() => ({
    measureThemeChange: vi.fn(fn => fn()),
    measurePositioning: vi.fn(fn => fn()),
  })),
}));

// Mock timing hooks
vi.mock('../../../hooks/useInstallPromptTiming', () => ({
  useInstallPromptTiming: vi.fn(() => ({
    canShowPrompt: true,
    promptDelay: 5000,
    handleDismissal: vi.fn(),
    handleInstallation: vi.fn(),
    handlePromptShown: vi.fn(),
    handlePromptInteraction: vi.fn(),
  })),
}));

// Mock localization
vi.mock('../../../constants/installLocalization', () => ({
  INSTALL_LOCALIZATION: {
    english: {
      buttonText: 'Install App',
      modalTitle: 'Install Madrasa Portal',
      actions: {
        install: 'Install',
        installing: 'Installing...',
        learnMore: 'Learn More',
      },
      status: {
        installed: 'App Installed',
        notAvailable: 'Installation not available',
        dismissed: 'Installation dismissed',
      },
    },
    malayalam: {
      buttonText: 'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക',
      actions: {
        install: 'ഇൻസ്റ്റാൾ ചെയ്യുക',
      },
      status: {
        installed: 'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തു',
        notAvailable: 'ഇൻസ്റ്റാളേഷൻ ലഭ്യമല്ല',
        dismissed: 'ഇൻസ്റ്റാളേഷൻ നിരസിച്ചു',
      },
    },
  },
  getBilingualAriaLabel: vi.fn(key => `Aria label for ${key}`),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Task 8: Comprehensive Install Event Tracking and Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    installAnalyticsTracker.clearSession();
  });

  describe('Enhanced Analytics Tracking in Components', () => {
    it('should track analytics events in InstallPrompt component', async () => {
      render(
        <TestWrapper>
          <InstallPrompt />
        </TestWrapper>
      );

      // Verify that InstallPrompt component is rendered
      expect(screen.getByTestId('install-prompt')).toBeInTheDocument();

      // Verify that the component has analytics tracking capabilities
      expect(typeof trackInstallPromptAvailable).toBe('function');
      expect(typeof trackInstallPromptShown).toBe('function');
      expect(typeof trackInstallStarted).toBe('function');
      expect(typeof trackInstallCompleted).toBe('function');
      expect(typeof trackInstallFailed).toBe('function');
      expect(typeof trackInstallCancelled).toBe('function');
    });

    it('should track analytics events in InstallButton component', async () => {
      render(
        <TestWrapper>
          <InstallButton source="settings" placement="settings" />
        </TestWrapper>
      );

      // Verify that InstallButton component has analytics integration
      const installButton = screen.getByRole('button');
      expect(installButton).toBeInTheDocument();

      // Simulate button click to trigger analytics
      fireEvent.click(installButton);

      // Verify analytics tracking functions are available
      expect(typeof trackInstallStarted).toBe('function');
      expect(typeof trackInstallCompleted).toBe('function');
      expect(typeof trackInstallFailed).toBe('function');
    });

    it('should track analytics events in FallbackInstallButton component', async () => {
      render(
        <TestWrapper>
          <FallbackInstallButton placement="navbar" />
        </TestWrapper>
      );

      // Verify that FallbackInstallButton has analytics integration
      expect(typeof trackFallbackShown).toBe('function');
      expect(typeof trackAutomaticPromptFailed).toBe('function');
    });
  });

  describe('Install Success/Failure Rate Tracking', () => {
    it('should track install success rates', () => {
      // Test successful installation tracking
      trackInstallCompleted({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
        outcome: 'accepted',
        platform: 'web',
        duration: 3000,
      });

      expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
        action: 'install_completed',
        source: 'settings_button',
        context: expect.objectContaining({
          placement: 'settings',
          outcome: 'accepted',
          platform: 'web',
          duration: 3000,
        }),
      });

      expect(
        analyticsService.trackPWAInstallSourceAnalytics
      ).toHaveBeenCalledWith({
        source: 'settings_button',
        placement: 'settings',
        action: 'converted',
        conversionTime: 3000,
        userJourney: expect.any(Array),
        context: expect.any(Object),
      });
    });

    it('should track install failure rates', () => {
      // Test failed installation tracking
      trackInstallFailed({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'user_click',
        component: 'InstallPrompt',
        errorType: 'NetworkError',
        errorMessage: 'Network connection failed',
        errorStack: 'Error stack trace',
        duration: 2000,
      });

      expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
        action: 'install_failed',
        source: 'automatic_banner',
        context: expect.objectContaining({
          placement: 'banner',
          errorType: 'NetworkError',
          errorMessage: 'Network connection failed',
          duration: 2000,
        }),
      });

      expect(analyticsService.trackPWAInstallError).toHaveBeenCalledWith({
        type: 'network_error',
        source: 'automatic_banner',
        stage: expect.any(String),
        errorDetails: expect.objectContaining({
          message: 'Network connection failed',
          stack: 'Error stack trace',
        }),
      });
    });

    it('should track session metrics for success/failure rates', () => {
      // Simulate a complete install session
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

      trackInstallCompleted({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'user_click',
        component: 'InstallPrompt',
        outcome: 'accepted',
        platform: 'web',
        duration: 5000,
      });

      // Verify that session metrics are tracked
      expect(analyticsService.trackPWAInstallMetrics).toHaveBeenCalledWith({
        type: 'success_rate',
        value: 1,
        timeframe: 'session',
        context: expect.objectContaining({
          stages_completed: expect.any(Number),
          errors_encountered: 0,
          retry_attempts: expect.any(Number),
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
  });

  describe('User Interaction Pattern Tracking', () => {
    it('should track user interaction patterns across different sources', () => {
      // Simulate user journey across multiple sources
      trackInstallPromptShown({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'automatic_timing',
        component: 'InstallPrompt',
      });

      trackInstallCancelled({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'user_click',
        component: 'InstallPrompt',
        reason: 'user_dismissed',
        duration: 1000,
      });

      // User later tries from settings
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
        duration: 2000,
      });

      // Verify user pattern tracking
      expect(analyticsService.trackPWAInstallUserPattern).toHaveBeenCalled();

      // Verify session tracks multiple sources
      const sessionSummary = installAnalyticsTracker.getSessionSummary();
      expect(sessionSummary?.sourcesUsed).toContain('automatic_banner');
      expect(sessionSummary?.sourcesUsed).toContain('settings_button');
    });

    it('should track retry behavior patterns', () => {
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
        errorType: 'PromptError',
        errorMessage: 'Install prompt failed',
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
        duration: 3000,
        retryCount: 1,
      });

      // Verify retry metrics are tracked
      expect(analyticsService.trackPWAInstallMetrics).toHaveBeenCalledWith({
        type: 'retry_rate',
        value: expect.any(Number),
        timeframe: 'session',
        context: expect.objectContaining({
          total_retries: expect.any(Number),
        }),
      });
    });

    it('should track abandonment patterns', () => {
      trackInstallPromptShown({
        source: 'modal',
        placement: 'modal',
        trigger: 'user_click',
        component: 'InstallPrompt',
      });

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
        duration: 2000,
      });

      // Verify abandonment tracking
      expect(
        analyticsService.trackPWAInstallSourceAnalytics
      ).toHaveBeenCalledWith({
        source: 'modal',
        placement: 'modal',
        action: 'abandoned',
        userJourney: expect.any(Array),
        context: expect.objectContaining({
          abandonment_reason: 'user_dismissed',
        }),
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
  });

  describe('Install Source Tracking', () => {
    it('should track events from banner source', () => {
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
        }),
      });

      expect(
        analyticsService.trackPWAInstallSourceAnalytics
      ).toHaveBeenCalledWith({
        source: 'automatic_banner',
        placement: 'banner',
        action: 'shown',
        userJourney: expect.any(Array),
        context: expect.any(Object),
      });
    });

    it('should track events from settings source', () => {
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

    it('should track events from fallback source', () => {
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
        }),
      });
    });

    it('should track automatic prompt failures', () => {
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

  describe('Error Tracking for Install-Related Failures', () => {
    it('should track and categorize different error types', () => {
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
          errorType: 'browser_not_supported',
          expectedCategory: 'browser_not_supported',
        },
        {
          errorType: 'network_error',
          expectedCategory: 'network_error',
        },
      ];

      errorTests.forEach(({ errorType, expectedCategory }) => {
        vi.clearAllMocks();

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

    it('should track edge case errors with proper context', () => {
      trackInstallFailed({
        source: 'modal',
        placement: 'modal',
        trigger: 'user_click',
        component: 'InstallPrompt',
        errorType: 'invalid_event_structure',
        errorMessage: 'BeforeInstallPrompt event missing required properties',
        errorStack: 'Error: Invalid event\n    at handleInstall...',
        duration: 1500,
        retryCount: 2,
      });

      expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
        action: 'install_failed',
        source: 'modal',
        context: expect.objectContaining({
          placement: 'modal',
          errorType: 'invalid_event_structure',
          errorMessage: 'BeforeInstallPrompt event missing required properties',
          duration: 1500,
          retryCount: 2,
        }),
      });

      expect(analyticsService.trackPWAInstallError).toHaveBeenCalledWith({
        type: 'browser_not_supported',
        source: 'modal',
        stage: expect.any(String),
        errorDetails: expect.objectContaining({
          message: 'BeforeInstallPrompt event missing required properties',
          stack: 'Error: Invalid event\n    at handleInstall...',
          retryCount: 2,
        }),
      });
    });

    it('should track session-level error patterns', () => {
      // Simulate multiple errors in a session
      trackInstallFailed({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'user_click',
        component: 'InstallPrompt',
        errorType: 'network_error',
        errorMessage: 'Network timeout',
      });

      trackInstallFailed({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
        errorType: 'user_choice_timeout',
        errorMessage: 'User choice promise timeout',
      });

      // Verify session tracks errors
      const sessionSummary = installAnalyticsTracker.getSessionSummary();
      expect(sessionSummary?.errors).toHaveLength(2);
      expect(sessionSummary?.errors[0]).toMatchObject({
        type: 'network_error',
        message: 'Network timeout',
        stage: expect.any(String),
      });
      expect(sessionSummary?.errors[1]).toMatchObject({
        type: 'user_choice_timeout',
        message: 'User choice promise timeout',
        stage: expect.any(String),
      });
    });
  });

  describe('Session Management and Persistence', () => {
    it('should maintain session data across events', () => {
      // Track multiple events in sequence
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

      // Verify session data is maintained
      const sessionSummary = installAnalyticsTracker.getSessionSummary();
      expect(sessionSummary?.stages).toHaveLength(3);
      expect(sessionSummary?.sourcesUsed).toContain('automatic_banner');
      expect(sessionSummary?.completed).toBe(false);
      expect(sessionSummary?.abandoned).toBe(false);

      // Verify session ID is consistent
      const sessionId = sessionStorage.getItem('pwa_install_session_id');
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
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

      // Verify new session is created
      const newSessionId = sessionStorage.getItem('pwa_install_session_id');
      expect(newSessionId).toBeTruthy();

      const sessionSummary = installAnalyticsTracker.getSessionSummary();
      expect(sessionSummary?.stages).toHaveLength(0);
      expect(sessionSummary?.completed).toBe(false);
      expect(sessionSummary?.abandoned).toBe(false);
    });
  });

  describe('Analytics Service Integration', () => {
    it('should integrate with the main analytics service', () => {
      // Verify analytics service methods are available
      expect(typeof analyticsService.trackPWAInstallEvent).toBe('function');
      expect(typeof analyticsService.trackPWAInstallSourceAnalytics).toBe(
        'function'
      );
      expect(typeof analyticsService.trackPWAInstallError).toBe('function');
      expect(typeof analyticsService.trackPWAInstallMetrics).toBe('function');
      expect(typeof analyticsService.trackPWAInstallUserPattern).toBe(
        'function'
      );
    });

    it('should call analytics service with proper event structure', () => {
      trackInstallStarted({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
        sessionDuration: 30000,
      });

      expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
        action: 'install_started',
        source: 'settings_button',
        context: expect.objectContaining({
          placement: 'settings',
          trigger: 'user_click',
          sessionDuration: 30000,
          installMethod: expect.any(String),
          displayMode: expect.any(String),
          confidence: expect.any(String),
          userAgent: expect.any(String),
        }),
      });
    });
  });

  describe('Requirements Verification', () => {
    it('should verify requirement 1.4: track user response for analytics', () => {
      trackInstallCompleted({
        source: 'automatic_banner',
        placement: 'banner',
        trigger: 'user_click',
        component: 'InstallPrompt',
        outcome: 'accepted',
        platform: 'web',
      });

      // Verify user response tracking
      expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
        action: 'install_completed',
        source: 'automatic_banner',
        context: expect.objectContaining({
          outcome: 'accepted',
          platform: 'web',
        }),
      });
    });

    it('should verify requirement 5.1: track success/failure rates', () => {
      // Track successful installation
      trackInstallCompleted({
        source: 'settings_button',
        placement: 'settings',
        trigger: 'user_click',
        component: 'InstallButton',
        outcome: 'accepted',
        platform: 'web',
      });

      // Verify success rate tracking
      expect(analyticsService.trackPWAInstallMetrics).toHaveBeenCalledWith({
        type: 'success_rate',
        value: 1,
        timeframe: 'session',
        context: expect.any(Object),
      });
    });

    it('should verify requirement 5.2: track user interaction patterns', () => {
      // Simulate user interaction pattern
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

      // Verify user pattern tracking is called
      expect(analyticsService.trackPWAInstallUserPattern).toHaveBeenCalled();
    });

    it('should verify requirement 5.3: track different install sources', () => {
      const sources = [
        'automatic_banner',
        'settings_button',
        'fallback_button',
        'modal',
      ];

      sources.forEach(source => {
        vi.clearAllMocks();

        trackInstallStarted({
          source: source as any,
          placement: 'inline',
          trigger: 'user_click',
          component: 'InstallButton',
        });

        expect(analyticsService.trackPWAInstallEvent).toHaveBeenCalledWith({
          action: 'install_started',
          source,
          context: expect.any(Object),
        });

        expect(
          analyticsService.trackPWAInstallSourceAnalytics
        ).toHaveBeenCalledWith({
          source,
          placement: 'inline',
          action: 'clicked',
          userJourney: expect.any(Array),
          context: expect.any(Object),
        });
      });
    });
  });
});
