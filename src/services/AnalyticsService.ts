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
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };

      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Analytics script'));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Configure Google Analytics
   */
  private configureAnalytics(): void {
    if (!window.gtag || !this.measurementId) return;

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
    if (!this.initialized || !window.gtag || !this.measurementId) return;

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
    if (!this.initialized || !window.gtag) return;

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
  trackClassEvent(action: 'join' | 'leave' | 'schedule_view', classId?: string): void {
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
  trackRecordingEvent(action: 'play' | 'pause' | 'complete', recordingId?: string): void {
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
  trackExamEvent(action: 'start' | 'submit' | 'complete', examId?: string, score?: number): void {
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
  trackNotificationEvent(action: 'permission_granted' | 'permission_denied' | 'received' | 'clicked', type?: string): void {
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
  trackPWAEvent(action: 'install_prompt' | 'installed' | 'offline_usage'): void {
    this.trackEvent({
      action: `pwa_${action}`,
      category: 'pwa',
      custom_parameters: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();