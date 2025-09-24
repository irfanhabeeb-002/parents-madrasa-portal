/**
 * Install Analytics Utility
 * Provides comprehensive analytics tracking for PWA install functionality
 */

import { analyticsService } from '../services/AnalyticsService';
import { getInstallState } from './installStateDetection';

// Types for install analytics
export interface InstallAnalyticsContext {
  source:
    | 'automatic_banner'
    | 'settings_button'
    | 'fallback_button'
    | 'modal'
    | 'hook'
    | 'system';
  placement?: 'banner' | 'settings' | 'navbar' | 'inline' | 'modal';
  trigger?:
    | 'user_click'
    | 'automatic_timing'
    | 'fallback_detection'
    | 'system_event';
  component?: 'InstallPrompt' | 'InstallButton' | 'FallbackInstallButton';
  retryCount?: number;
  sessionDuration?: number;
}

export interface InstallFunnelStage {
  stage: string;
  timestamp: number;
  source: string;
  context?: Record<string, any>;
}

export interface InstallSessionMetrics {
  sessionId: string;
  startTime: number;
  stages: InstallFunnelStage[];
  currentStage?: string;
  completed: boolean;
  abandoned: boolean;
  abandonmentReason?: string;
  totalRetries: number;
  sourcesUsed: string[];
  errors: Array<{
    type: string;
    message: string;
    timestamp: number;
    stage: string;
  }>;
}

class InstallAnalyticsTracker {
  private sessionMetrics: InstallSessionMetrics | null = null;
  private funnelStages: InstallFunnelStage[] = [];
  private sessionStartTime: number = Date.now();

  constructor() {
    this.initializeSession();
  }

  /**
   * Initialize analytics session
   */
  private initializeSession(): void {
    const existingSessionId = sessionStorage.getItem('pwa_install_session_id');
    const sessionId =
      existingSessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    if (!existingSessionId) {
      sessionStorage.setItem('pwa_install_session_id', sessionId);
      sessionStorage.setItem(
        'pwa_install_session_start',
        Date.now().toString()
      );
    }

    this.sessionStartTime = parseInt(
      sessionStorage.getItem('pwa_install_session_start') ||
        Date.now().toString()
    );

    this.sessionMetrics = {
      sessionId,
      startTime: this.sessionStartTime,
      stages: [],
      completed: false,
      abandoned: false,
      totalRetries: 0,
      sourcesUsed: [],
      errors: [],
    };

    // Load existing session data if available
    const existingData = sessionStorage.getItem('pwa_install_session_data');
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        this.sessionMetrics = { ...this.sessionMetrics, ...parsed };
        this.funnelStages = this.sessionMetrics.stages;
      } catch (error) {
        console.warn('Failed to parse existing session data:', error);
      }
    }
  }

  /**
   * Save session data to storage
   */
  private saveSessionData(): void {
    if (this.sessionMetrics) {
      sessionStorage.setItem(
        'pwa_install_session_data',
        JSON.stringify(this.sessionMetrics)
      );
    }
  }

  /**
   * Track install prompt availability
   */
  trackPromptAvailable(context: InstallAnalyticsContext): void {
    const installState = getInstallState();

    analyticsService.trackPWAInstallEvent({
      action: 'prompt_available',
      source: context.source,
      context: {
        placement: context.placement,
        trigger: context.trigger,
        installMethod: installState.installMethod,
        displayMode: installState.displayMode,
        browserInfo: installState.browserInfo,
        confidence: installState.confidence,
        userAgent: navigator.userAgent,
      },
    });

    this.addFunnelStage('prompt_available', context.source, context);
  }

  /**
   * Track install prompt shown to user
   */
  trackPromptShown(context: InstallAnalyticsContext): void {
    const installState = getInstallState();

    analyticsService.trackPWAInstallEvent({
      action: 'prompt_shown',
      source: context.source,
      context: {
        placement: context.placement,
        trigger: context.trigger,
        installMethod: installState.installMethod,
        displayMode: installState.displayMode,
        confidence: installState.confidence,
        sessionDuration: Date.now() - this.sessionStartTime,
        userAgent: navigator.userAgent,
      },
    });

    // Track source analytics
    analyticsService.trackPWAInstallSourceAnalytics({
      source: context.source,
      placement: context.placement || 'inline',
      action: 'shown',
      userJourney: this.getSourceSequence(),
      context,
    });

    this.addFunnelStage('prompt_shown', context.source, context);
  }

  /**
   * Track install attempt started
   */
  trackInstallStarted(context: InstallAnalyticsContext): void {
    const installState = getInstallState();

    analyticsService.trackPWAInstallEvent({
      action: 'install_started',
      source: context.source,
      context: {
        placement: context.placement,
        trigger: 'user_click',
        installMethod: installState.installMethod,
        displayMode: installState.displayMode,
        confidence: installState.confidence,
        retryCount: context.retryCount || 0,
        sessionDuration: Date.now() - this.sessionStartTime,
        userAgent: navigator.userAgent,
      },
    });

    // Track source analytics
    analyticsService.trackPWAInstallSourceAnalytics({
      source: context.source,
      placement: context.placement || 'inline',
      action: 'clicked',
      userJourney: this.getSourceSequence(),
      context,
    });

    this.addFunnelStage('install_started', context.source, context);
    this.incrementRetryCount();
  }

  /**
   * Track successful installation
   */
  trackInstallCompleted(
    context: InstallAnalyticsContext & {
      outcome?: 'accepted' | 'dismissed';
      platform?: string;
      duration?: number;
    }
  ): void {
    const installState = getInstallState();

    analyticsService.trackPWAInstallEvent({
      action: 'install_completed',
      source: context.source,
      context: {
        placement: context.placement,
        installMethod: installState.installMethod,
        displayMode: installState.displayMode,
        confidence: installState.confidence,
        retryCount: context.retryCount || 0,
        sessionDuration: Date.now() - this.sessionStartTime,
        duration: context.duration,
        outcome: context.outcome,
        platform: context.platform,
        userAgent: navigator.userAgent,
      },
    });

    // Track source conversion
    analyticsService.trackPWAInstallSourceAnalytics({
      source: context.source,
      placement: context.placement || 'inline',
      action: 'converted',
      conversionTime: context.duration,
      userJourney: this.getSourceSequence(),
      context,
    });

    this.addFunnelStage('install_completed', context.source, context);
    this.markSessionCompleted();
    this.calculateAndTrackMetrics();
  }

  /**
   * Track installation failure
   */
  trackInstallFailed(
    context: InstallAnalyticsContext & {
      errorType: string;
      errorMessage: string;
      errorStack?: string;
      duration?: number;
    }
  ): void {
    const installState = getInstallState();

    analyticsService.trackPWAInstallEvent({
      action: 'install_failed',
      source: context.source,
      context: {
        placement: context.placement,
        installMethod: installState.installMethod,
        displayMode: installState.displayMode,
        confidence: installState.confidence,
        retryCount: context.retryCount || 0,
        sessionDuration: Date.now() - this.sessionStartTime,
        duration: context.duration,
        errorType: context.errorType,
        errorMessage: context.errorMessage,
        userAgent: navigator.userAgent,
      },
    });

    // Track detailed error
    analyticsService.trackPWAInstallError({
      type: this.categorizeError(context.errorType),
      source: context.source,
      stage: this.getCurrentStage(),
      errorDetails: {
        message: context.errorMessage,
        stack: context.errorStack,
        browserInfo: installState.browserInfo,
        installState: installState.installMethod,
        retryCount: context.retryCount || 0,
        context,
      },
    });

    this.addError(context.errorType, context.errorMessage, 'install_failed');
    this.addFunnelStage('install_failed', context.source, context);
  }

  /**
   * Track installation cancellation/dismissal
   */
  trackInstallCancelled(
    context: InstallAnalyticsContext & {
      reason: 'user_dismissed' | 'user_cancelled' | 'timeout' | 'error';
      duration?: number;
    }
  ): void {
    const installState = getInstallState();

    analyticsService.trackPWAInstallEvent({
      action: 'install_cancelled',
      source: context.source,
      context: {
        placement: context.placement,
        installMethod: installState.installMethod,
        displayMode: installState.displayMode,
        confidence: installState.confidence,
        retryCount: context.retryCount || 0,
        sessionDuration: Date.now() - this.sessionStartTime,
        duration: context.duration,
        userAgent: navigator.userAgent,
      },
    });

    // Track source abandonment
    analyticsService.trackPWAInstallSourceAnalytics({
      source: context.source,
      placement: context.placement || 'inline',
      action: 'abandoned',
      userJourney: this.getSourceSequence(),
      context: { ...context, abandonment_reason: context.reason },
    });

    this.addFunnelStage('install_cancelled', context.source, context);
    this.markSessionAbandoned(context.reason);
  }

  /**
   * Track fallback install button shown
   */
  trackFallbackShown(context: InstallAnalyticsContext): void {
    const installState = getInstallState();

    analyticsService.trackPWAInstallEvent({
      action: 'fallback_shown',
      source: 'fallback_button',
      context: {
        placement: context.placement,
        trigger: 'fallback_detection',
        installMethod: installState.installMethod,
        displayMode: installState.displayMode,
        confidence: installState.confidence,
        sessionDuration: Date.now() - this.sessionStartTime,
        userAgent: navigator.userAgent,
      },
    });

    this.addFunnelStage('fallback_shown', 'fallback_button', context);
  }

  /**
   * Track automatic prompt failure
   */
  trackAutomaticPromptFailed(
    context: InstallAnalyticsContext & {
      expectedDelay: number;
      detectionDelay: number;
    }
  ): void {
    const installState = getInstallState();

    analyticsService.trackPWAInstallEvent({
      action: 'automatic_prompt_failed',
      source: 'system',
      context: {
        trigger: 'fallback_detection',
        installMethod: installState.installMethod,
        displayMode: installState.displayMode,
        confidence: installState.confidence,
        sessionDuration: Date.now() - this.sessionStartTime,
        userAgent: navigator.userAgent,
      },
    });

    // Track as error
    analyticsService.trackPWAInstallError({
      type: 'prompt_failed',
      source: 'automatic_banner',
      stage: 'prompt_detection',
      errorDetails: {
        message: 'Automatic install prompt failed to appear',
        context: {
          expected_delay: context.expectedDelay,
          detection_delay: context.detectionDelay,
          can_show_prompt: true,
          has_deferred_prompt: false,
        },
      },
    });

    this.addError(
      'automatic_prompt_failed',
      'Automatic install prompt failed to appear',
      'prompt_detection'
    );
  }

  /**
   * Track user interaction patterns
   */
  trackUserPattern(pattern: {
    type:
      | 'funnel_progression'
      | 'abandonment_point'
      | 'retry_behavior'
      | 'source_switching';
    context?: Record<string, any>;
  }): void {
    const currentStage = this.getCurrentStage();
    const previousStage = this.getPreviousStage();
    const timeBetweenStages = this.getTimeBetweenStages();

    analyticsService.trackPWAInstallUserPattern({
      type: pattern.type,
      stage: currentStage,
      previousStage,
      timeBetweenStages,
      totalFunnelTime: Date.now() - this.sessionStartTime,
      retryAttempts: this.sessionMetrics?.totalRetries || 0,
      sourceSequence: this.getSourceSequence(),
      userBehavior: pattern.context,
    });
  }

  /**
   * Add funnel stage
   */
  private addFunnelStage(stage: string, source: string, context?: any): void {
    const funnelStage: InstallFunnelStage = {
      stage,
      timestamp: Date.now(),
      source,
      context,
    };

    this.funnelStages.push(funnelStage);

    if (this.sessionMetrics) {
      this.sessionMetrics.stages = this.funnelStages;
      this.sessionMetrics.currentStage = stage;

      // Track unique sources
      if (!this.sessionMetrics.sourcesUsed.includes(source)) {
        this.sessionMetrics.sourcesUsed.push(source);
      }
    }

    this.saveSessionData();
  }

  /**
   * Add error to session
   */
  private addError(type: string, message: string, stage: string): void {
    if (this.sessionMetrics) {
      this.sessionMetrics.errors.push({
        type,
        message,
        timestamp: Date.now(),
        stage,
      });
      this.saveSessionData();
    }
  }

  /**
   * Increment retry count
   */
  private incrementRetryCount(): void {
    if (this.sessionMetrics) {
      this.sessionMetrics.totalRetries++;
      this.saveSessionData();
    }
  }

  /**
   * Mark session as completed
   */
  private markSessionCompleted(): void {
    if (this.sessionMetrics) {
      this.sessionMetrics.completed = true;
      this.saveSessionData();
    }
  }

  /**
   * Mark session as abandoned
   */
  private markSessionAbandoned(reason: string): void {
    if (this.sessionMetrics) {
      this.sessionMetrics.abandoned = true;
      this.sessionMetrics.abandonmentReason = reason;
      this.saveSessionData();
    }
  }

  /**
   * Get current funnel stage
   */
  private getCurrentStage(): string {
    return this.sessionMetrics?.currentStage || 'unknown';
  }

  /**
   * Get previous funnel stage
   */
  private getPreviousStage(): string | undefined {
    const stages = this.funnelStages;
    return stages.length > 1 ? stages[stages.length - 2].stage : undefined;
  }

  /**
   * Get time between current and previous stage
   */
  private getTimeBetweenStages(): number | undefined {
    const stages = this.funnelStages;
    if (stages.length < 2) {
      return undefined;
    }

    const current = stages[stages.length - 1];
    const previous = stages[stages.length - 2];
    return current.timestamp - previous.timestamp;
  }

  /**
   * Get sequence of sources used
   */
  private getSourceSequence(): string[] {
    return this.sessionMetrics?.sourcesUsed || [];
  }

  /**
   * Categorize error type for analytics
   */
  private categorizeError(errorType: string): any {
    const errorMap: Record<string, any> = {
      beforeinstallprompt_handler_error: 'event_listener_failed',
      install_prompt_timeout: 'prompt_failed',
      user_choice_timeout: 'user_choice_timeout',
      installation_failed: 'installation_failed',
      invalid_event_structure: 'browser_not_supported',
      missing_prompt_method: 'browser_not_supported',
      automatic_prompt_failed: 'prompt_failed',
      network_error: 'network_error',
    };

    return errorMap[errorType] || 'unknown_error';
  }

  /**
   * Calculate and track session metrics
   */
  private calculateAndTrackMetrics(): void {
    if (!this.sessionMetrics) {
      return;
    }

    const sessionDuration = Date.now() - this.sessionStartTime;
    const stageCount = this.funnelStages.length;
    const errorCount = this.sessionMetrics.errors.length;
    const retryCount = this.sessionMetrics.totalRetries;
    const sourcesUsed = this.sessionMetrics.sourcesUsed.length;

    // Track success rate (completed vs total sessions)
    analyticsService.trackPWAInstallMetrics({
      type: 'success_rate',
      value: this.sessionMetrics.completed ? 1 : 0,
      timeframe: 'session',
      context: {
        session_duration: sessionDuration,
        stages_completed: stageCount,
        errors_encountered: errorCount,
        retry_attempts: retryCount,
        sources_used: sourcesUsed,
      },
    });

    // Track conversion rate based on funnel progression
    const conversionRate =
      stageCount > 0 ? (this.sessionMetrics.completed ? 1 : 0) : 0;
    analyticsService.trackPWAInstallMetrics({
      type: 'conversion_rate',
      value: conversionRate,
      timeframe: 'session',
      context: {
        funnel_stages: stageCount,
        session_duration: sessionDuration,
      },
    });

    // Track retry rate
    if (retryCount > 0) {
      analyticsService.trackPWAInstallMetrics({
        type: 'retry_rate',
        value: retryCount,
        timeframe: 'session',
        context: {
          total_retries: retryCount,
          session_duration: sessionDuration,
        },
      });
    }

    // Track abandonment rate
    if (this.sessionMetrics.abandoned) {
      analyticsService.trackPWAInstallMetrics({
        type: 'abandonment_rate',
        value: 1,
        timeframe: 'session',
        context: {
          abandonment_reason: this.sessionMetrics.abandonmentReason,
          abandonment_stage: this.getCurrentStage(),
          session_duration: sessionDuration,
        },
      });
    }
  }

  /**
   * Get session summary for debugging
   */
  getSessionSummary(): InstallSessionMetrics | null {
    return this.sessionMetrics;
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    sessionStorage.removeItem('pwa_install_session_id');
    sessionStorage.removeItem('pwa_install_session_start');
    sessionStorage.removeItem('pwa_install_session_data');
    this.initializeSession();
  }
}

// Export singleton instance
export const installAnalyticsTracker = new InstallAnalyticsTracker();

// Convenience functions for common tracking scenarios
export const trackInstallPromptAvailable = (
  context: InstallAnalyticsContext
) => {
  installAnalyticsTracker.trackPromptAvailable(context);
};

export const trackInstallPromptShown = (context: InstallAnalyticsContext) => {
  installAnalyticsTracker.trackPromptShown(context);
};

export const trackInstallStarted = (context: InstallAnalyticsContext) => {
  installAnalyticsTracker.trackInstallStarted(context);
};

export const trackInstallCompleted = (
  context: InstallAnalyticsContext & {
    outcome?: 'accepted' | 'dismissed';
    platform?: string;
    duration?: number;
  }
) => {
  installAnalyticsTracker.trackInstallCompleted(context);
};

export const trackInstallFailed = (
  context: InstallAnalyticsContext & {
    errorType: string;
    errorMessage: string;
    errorStack?: string;
    duration?: number;
  }
) => {
  installAnalyticsTracker.trackInstallFailed(context);
};

export const trackInstallCancelled = (
  context: InstallAnalyticsContext & {
    reason: 'user_dismissed' | 'user_cancelled' | 'timeout' | 'error';
    duration?: number;
  }
) => {
  installAnalyticsTracker.trackInstallCancelled(context);
};

export const trackFallbackShown = (context: InstallAnalyticsContext) => {
  installAnalyticsTracker.trackFallbackShown(context);
};

export const trackAutomaticPromptFailed = (
  context: InstallAnalyticsContext & {
    expectedDelay: number;
    detectionDelay: number;
  }
) => {
  installAnalyticsTracker.trackAutomaticPromptFailed(context);
};
