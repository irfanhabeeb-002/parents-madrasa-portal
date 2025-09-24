/**
 * Analytics Service
 * Handles Google Analytics integration and custom event tracking
 */

import { config, logger } from '../config/environment';

// Google Analytics gtag types
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date | object,
      config?: object
    ) => void;
    dataLayer: any[];
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface UserProperties {
  user_id?: string;
  user_role?: string;
  app_version?: string;
  environment?: string;
}

class AnalyticsService {
  private initialized = false;
  private measurementId: string | null = null;

  /**
   * Initialize Google Analytics
   */
  async initialize(): Promise<void> {
    if (!config.analytics.enabled || !config.analytics.measurementId) {
      logger.debug('Analytics disabled or measurement ID not provided');
      return;
    }

    if (this.initialized) {
      logger.debug('Analytics already initialized');
      return;
    }

    try {
      this.measurementId = config.analytics.measurementId;

      // Load Google Analytics script
      await this.loadGoogleAnalytics();

      // Configure Google Analytics
      this.configureAnalytics();

      this.initialized = true;
      logger.log('Analytics initialized successfully');

      // Track app initialization
      this.trackEvent({
        action: 'app_initialized',
        category: 'app',
        label: config.APP_VERSION,
        custom_parameters: {
          environment: config.APP_ENV,
          app_version: config.APP_VERSION,
        },
      });
    } catch (error) {
      logger.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Load Google Analytics script
   */
  private async loadGoogleAnalytics(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gtag) {
        resolve();
        return;
      }

      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };

      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load Google Analytics script'));

      document.head.appendChild(script);
    });
  }

  /**
   * Configure Google Analytics
   */
  private configureAnalytics(): void {
    if (!window.gtag || !this.measurementId) {
      return;
    }

    // Initialize with timestamp
    window.gtag('js', new Date());

    // Configure measurement ID
    window.gtag('config', this.measurementId, {
      // Privacy settings
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,

      // Performance settings
      send_page_view: true,
      page_title: document.title,
      page_location: window.location.href,

      // Custom dimensions
      custom_map: {
        dimension1: 'app_version',
        dimension2: 'environment',
        dimension3: 'user_role',
      },

      // Enhanced measurement
      enhanced_measurements: {
        scrolls: true,
        outbound_clicks: true,
        site_search: false,
        video_engagement: true,
        file_downloads: true,
      },
    });
  }

  /**
   * Track custom events
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.initialized || !window.gtag) {
      logger.debug('Analytics not initialized, queuing event:', event);
      return;
    }

    try {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters,
      });

      logger.debug('Analytics event tracked:', event);
    } catch (error) {
      logger.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Track page views
   */
  trackPageView(pagePath: string, pageTitle?: string): void {
    if (!this.initialized || !window.gtag || !this.measurementId) {
      return;
    }

    try {
      window.gtag('config', this.measurementId, {
        page_path: pagePath,
        page_title: pageTitle || document.title,
      });

      logger.debug('Page view tracked:', { pagePath, pageTitle });
    } catch (error) {
      logger.error('Failed to track page view:', error);
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.initialized || !window.gtag) {
      return;
    }

    try {
      window.gtag('set', {
        user_id: properties.user_id,
        user_properties: {
          user_role: properties.user_role,
          app_version: properties.app_version || config.APP_VERSION,
          environment: properties.environment || config.APP_ENV,
        },
      });

      logger.debug('User properties set:', properties);
    } catch (error) {
      logger.error('Failed to set user properties:', error);
    }
  }

  /**
   * Track user authentication
   */
  trackLogin(method: string, userId?: string): void {
    this.trackEvent({
      action: 'login',
      category: 'authentication',
      label: method,
      custom_parameters: {
        method,
        user_id: userId,
      },
    });
  }

  /**
   * Track user logout
   */
  trackLogout(): void {
    this.trackEvent({
      action: 'logout',
      category: 'authentication',
    });
  }

  /**
   * Track class-related events
   */
  trackClassEvent(
    action: 'join' | 'leave' | 'schedule_view',
    classId?: string
  ): void {
    this.trackEvent({
      action: `class_${action}`,
      category: 'education',
      label: classId,
      custom_parameters: {
        class_id: classId,
      },
    });
  }

  /**
   * Track recording events
   */
  trackRecordingEvent(
    action: 'play' | 'pause' | 'complete',
    recordingId?: string
  ): void {
    this.trackEvent({
      action: `recording_${action}`,
      category: 'education',
      label: recordingId,
      custom_parameters: {
        recording_id: recordingId,
      },
    });
  }

  /**
   * Track exam events
   */
  trackExamEvent(
    action: 'start' | 'submit' | 'complete',
    examId?: string,
    score?: number
  ): void {
    this.trackEvent({
      action: `exam_${action}`,
      category: 'education',
      label: examId,
      value: score,
      custom_parameters: {
        exam_id: examId,
        score,
      },
    });
  }

  /**
   * Track accessibility events
   */
  trackAccessibilityEvent(action: string, feature: string): void {
    this.trackEvent({
      action: `accessibility_${action}`,
      category: 'accessibility',
      label: feature,
      custom_parameters: {
        feature,
      },
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent({
      action: 'performance_metric',
      category: 'performance',
      label: metric,
      value,
      custom_parameters: {
        metric,
        unit,
      },
    });
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: string): void {
    this.trackEvent({
      action: 'error',
      category: 'error',
      label: error.message,
      custom_parameters: {
        error_message: error.message,
        error_stack: error.stack,
        context,
      },
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action: string): void {
    this.trackEvent({
      action: `feature_${action}`,
      category: 'feature_usage',
      label: feature,
      custom_parameters: {
        feature,
      },
    });
  }

  /**
   * Track WhatsApp integration usage
   */
  trackWhatsAppUsage(context: string): void {
    this.trackEvent({
      action: 'whatsapp_click',
      category: 'communication',
      label: context,
      custom_parameters: {
        context,
      },
    });
  }

  /**
   * Track notification events
   */
  trackNotificationEvent(
    action: 'permission_granted' | 'permission_denied' | 'received' | 'clicked',
    type?: string
  ): void {
    this.trackEvent({
      action: `notification_${action}`,
      category: 'notifications',
      label: type,
      custom_parameters: {
        notification_type: type,
      },
    });
  }

  /**
   * Track PWA events
   */
  trackPWAEvent(
    action: 'install_prompt' | 'installed' | 'offline_usage'
  ): void {
    this.trackEvent({
      action: `pwa_${action}`,
      category: 'pwa',
      custom_parameters: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track PWA install funnel events
   */
  trackPWAInstallFunnel(
    stage:
      | 'banner_shown'
      | 'banner_clicked'
      | 'modal_opened'
      | 'install_clicked'
      | 'install_completed',
    source?: string,
    additionalData?: Record<string, any>
  ): void {
    this.trackEvent({
      action: `pwa_install_${stage}`,
      category: 'pwa_funnel',
      label: source,
      custom_parameters: {
        stage,
        source,
        timestamp: new Date().toISOString(),
        ...additionalData,
      },
    });
  }

  /**
   * Track comprehensive PWA install events with enhanced analytics
   */
  trackPWAInstallEvent(eventData: {
    action:
      | 'prompt_available'
      | 'prompt_shown'
      | 'prompt_dismissed'
      | 'install_started'
      | 'install_completed'
      | 'install_failed'
      | 'install_cancelled'
      | 'fallback_shown'
      | 'automatic_prompt_failed'
      | 'manual_install_triggered'
      | 'install_state_changed';
    source:
      | 'automatic_banner'
      | 'settings_button'
      | 'fallback_button'
      | 'modal'
      | 'hook'
      | 'system';
    context?: {
      placement?: 'banner' | 'settings' | 'navbar' | 'inline' | 'modal';
      trigger?:
        | 'user_click'
        | 'automatic_timing'
        | 'fallback_detection'
        | 'system_event';
      installMethod?: 'beforeinstallprompt' | 'manual' | 'not-supported';
      displayMode?: string;
      browserInfo?: Record<string, any>;
      confidence?: 'high' | 'medium' | 'low';
      retryCount?: number;
      sessionDuration?: number;
      userAgent?: string;
      platforms?: string[];
      errorType?: string;
      errorMessage?: string;
      duration?: number;
      outcome?: 'accepted' | 'dismissed';
      platform?: string;
    };
  }): void {
    const { action, source, context = {} } = eventData;

    // Generate session ID if not exists
    if (!sessionStorage.getItem('pwa_install_session_id')) {
      sessionStorage.setItem(
        'pwa_install_session_id',
        `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      );
    }

    const sessionId = sessionStorage.getItem('pwa_install_session_id');
    const sessionStartTime =
      parseInt(sessionStorage.getItem('sessionStartTime') || '0') || Date.now();
    const currentSessionDuration = Date.now() - sessionStartTime;

    this.trackEvent({
      action: `pwa_install_${action}`,
      category: 'pwa_install_analytics',
      label: source,
      custom_parameters: {
        // Core event data
        install_action: action,
        install_source: source,

        // Session tracking
        session_id: sessionId,
        session_duration: currentSessionDuration,
        timestamp: new Date().toISOString(),

        // Context data
        placement: context.placement,
        trigger: context.trigger,
        install_method: context.installMethod,
        display_mode: context.displayMode,
        confidence: context.confidence,
        retry_count: context.retryCount || 0,

        // Browser and platform info
        user_agent: context.userAgent || navigator.userAgent,
        platforms: context.platforms,
        browser_info: context.browserInfo,

        // Error tracking
        error_type: context.errorType,
        error_message: context.errorMessage,

        // Performance tracking
        duration_ms: context.duration,

        // User choice tracking
        outcome: context.outcome,
        platform: context.platform,

        // App context
        app_version: config.APP_VERSION,
        environment: config.APP_ENV,
      },
    });
  }

  /**
   * Track install success/failure rates with aggregated metrics
   */
  trackPWAInstallMetrics(metrics: {
    type:
      | 'success_rate'
      | 'failure_rate'
      | 'abandonment_rate'
      | 'conversion_rate'
      | 'retry_rate';
    value: number;
    timeframe: 'session' | 'daily' | 'weekly';
    source?: string;
    context?: Record<string, any>;
  }): void {
    const { type, value, timeframe, source, context = {} } = metrics;

    this.trackEvent({
      action: `pwa_install_metric_${type}`,
      category: 'pwa_install_metrics',
      label: `${timeframe}_${source || 'all'}`,
      value: Math.round(value * 100), // Convert to percentage
      custom_parameters: {
        metric_type: type,
        metric_value: value,
        timeframe,
        source,
        timestamp: new Date().toISOString(),
        app_version: config.APP_VERSION,
        ...context,
      },
    });
  }

  /**
   * Track user interaction patterns for install flow
   */
  trackPWAInstallUserPattern(pattern: {
    type:
      | 'funnel_progression'
      | 'abandonment_point'
      | 'retry_behavior'
      | 'source_switching'
      | 'timing_preference';
    stage: string;
    previousStage?: string;
    timeBetweenStages?: number;
    totalFunnelTime?: number;
    abandonmentReason?: string;
    retryAttempts?: number;
    sourceSequence?: string[];
    userBehavior?: Record<string, any>;
  }): void {
    const sessionId =
      sessionStorage.getItem('pwa_install_session_id') || 'unknown';

    this.trackEvent({
      action: `pwa_install_pattern_${pattern.type}`,
      category: 'pwa_install_patterns',
      label: pattern.stage,
      custom_parameters: {
        pattern_type: pattern.type,
        current_stage: pattern.stage,
        previous_stage: pattern.previousStage,
        stage_transition_time: pattern.timeBetweenStages,
        total_funnel_time: pattern.totalFunnelTime,
        abandonment_reason: pattern.abandonmentReason,
        retry_attempts: pattern.retryAttempts,
        source_sequence: pattern.sourceSequence,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        user_behavior: pattern.userBehavior,
      },
    });
  }

  /**
   * Track install errors with comprehensive categorization
   */
  trackPWAInstallError(error: {
    type:
      | 'event_listener_failed'
      | 'prompt_failed'
      | 'user_choice_timeout'
      | 'installation_failed'
      | 'state_detection_failed'
      | 'browser_not_supported'
      | 'already_installed'
      | 'permission_denied'
      | 'network_error'
      | 'unknown_error';
    source: string;
    stage: string;
    errorDetails: {
      message: string;
      stack?: string;
      code?: string | number;
      browserInfo?: Record<string, any>;
      installState?: string;
      retryCount?: number;
      context?: Record<string, any>;
    };
  }): void {
    const sessionId =
      sessionStorage.getItem('pwa_install_session_id') || 'unknown';

    this.trackEvent({
      action: `pwa_install_error_${error.type}`,
      category: 'pwa_install_errors',
      label: `${error.source}_${error.stage}`,
      custom_parameters: {
        error_type: error.type,
        error_source: error.source,
        error_stage: error.stage,
        error_message: error.errorDetails.message,
        error_stack: error.errorDetails.stack,
        error_code: error.errorDetails.code,
        browser_info: error.errorDetails.browserInfo,
        install_state: error.errorDetails.installState,
        retry_count: error.errorDetails.retryCount || 0,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        context: error.errorDetails.context,
        app_version: config.APP_VERSION,
        environment: config.APP_ENV,
      },
    });
  }

  /**
   * Track install source effectiveness and conversion rates
   */
  trackPWAInstallSourceAnalytics(sourceData: {
    source:
      | 'automatic_banner'
      | 'settings_button'
      | 'fallback_button'
      | 'modal'
      | 'hook'
      | 'system';
    placement: 'banner' | 'settings' | 'navbar' | 'inline' | 'modal';
    action: 'shown' | 'clicked' | 'converted' | 'abandoned';
    conversionTime?: number;
    userJourney?: string[];
    context?: Record<string, any>;
  }): void {
    const sessionId =
      sessionStorage.getItem('pwa_install_session_id') || 'unknown';

    this.trackEvent({
      action: `pwa_install_source_${sourceData.action}`,
      category: 'pwa_install_sources',
      label: `${sourceData.source}_${sourceData.placement}`,
      custom_parameters: {
        install_source: sourceData.source,
        source_placement: sourceData.placement,
        source_action: sourceData.action,
        conversion_time: sourceData.conversionTime,
        user_journey: sourceData.userJourney,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        context: sourceData.context,
      },
    });
  }

  /**
   * Track PWA user engagement patterns
   */
  trackPWAEngagement(
    action: 'session_start' | 'feature_used' | 'offline_interaction',
    context?: string,
    value?: number
  ): void {
    this.trackEvent({
      action: `pwa_engagement_${action}`,
      category: 'pwa_engagement',
      label: context,
      value,
      custom_parameters: {
        context,
        timestamp: new Date().toISOString(),
        session_time:
          Date.now() -
          (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
            Date.now()),
      },
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
