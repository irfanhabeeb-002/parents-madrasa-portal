/**
 * Performance Monitoring Service
 * Tracks application performance metrics and reports to analytics
 */

import { config, logger } from '../config/environment';
import { analyticsService } from './AnalyticsService';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: string;
}

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private initialized = false;

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (!config.performance.enableMonitoring) {
      logger.debug('Performance monitoring disabled');
      return;
    }

    if (this.initialized) {
      logger.debug('Performance monitoring already initialized');
      return;
    }

    try {
      this.setupPerformanceObserver();
      this.trackWebVitals();
      this.trackNavigationTiming();
      this.trackResourceTiming();

      this.initialized = true;
      logger.log('Performance monitoring initialized');
    } catch (error) {
      logger.error('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Set up Performance Observer for various metrics
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      const entryTypes = [
        'navigation',
        'resource',
        'paint',
        'largest-contentful-paint',
        'first-input',
        'layout-shift',
      ];

      entryTypes.forEach(type => {
        try {
          this.observer?.observe({ type, buffered: true });
        } catch (error) {
          logger.debug(
            `Performance observer type '${type}' not supported:`,
            error
          );
        }
      });
    } catch (error) {
      logger.error('Failed to setup performance observer:', error);
    }
  }

  /**
   * Process individual performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration || (entry as any).value || 0,
      unit: 'ms',
      timestamp: entry.startTime,
      context: entry.entryType,
    };

    this.recordMetric(metric);

    // Report specific metrics to analytics
    if (this.shouldReportMetric(entry)) {
      this.reportToAnalytics(metric);
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackWebVitals(): void {
    // First Contentful Paint (FCP)
    this.observeMetric('paint', entries => {
      const fcpEntry = entries.find(
        entry => entry.name === 'first-contentful-paint'
      );
      if (fcpEntry) {
        const fcp = fcpEntry.startTime;
        this.recordWebVital('FCP', fcp);
      }
    });

    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', entries => {
      const lcpEntry = entries[entries.length - 1];
      if (lcpEntry) {
        const lcp = lcpEntry.startTime;
        this.recordWebVital('LCP', lcp);
      }
    });

    // First Input Delay (FID)
    this.observeMetric('first-input', entries => {
      const fidEntry = entries[0];
      if (fidEntry) {
        const fid = (fidEntry as any).processingStart - fidEntry.startTime;
        this.recordWebVital('FID', fid);
      }
    });

    // Cumulative Layout Shift (CLS)
    this.observeMetric('layout-shift', entries => {
      const clsValue = 0;
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordWebVital('CLS', clsValue);
    });
  }

  /**
   * Observe specific performance metrics
   */
  private observeMetric(
    type: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver(list => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      logger.debug(`Cannot observe metric type '${type}':`, error);
    }
  }

  /**
   * Record Web Vital metric
   */
  private recordWebVital(name: WebVitalsMetric['name'], value: number): void {
    const rating = this.getWebVitalRating(name, value);

    const metric: PerformanceMetric = {
      name: `web_vital_${name.toLowerCase()}`,
      value,
      unit: name === 'CLS' ? 'score' : 'ms',
      timestamp: Date.now(),
      context: 'web_vitals',
    };

    this.recordMetric(metric);

    // Report to analytics with rating
    analyticsService.trackPerformance(`web_vital_${name}`, value, metric.unit);
    analyticsService.trackEvent({
      action: 'web_vital_measured',
      category: 'performance',
      label: name,
      value,
      custom_parameters: {
        metric_name: name,
        rating,
        value,
      },
    });
  }

  /**
   * Get Web Vital rating based on thresholds
   */
  private getWebVitalRating(
    name: WebVitalsMetric['name'],
    value: number
  ): WebVitalsMetric['rating'] {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Track navigation timing
   */
  private trackNavigationTiming(): void {
    if (!('performance' in window) || !performance.getEntriesByType) return;

    const navigationEntries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];
    if (navigationEntries.length === 0) return;

    const nav = navigationEntries[0];

    // Track key navigation metrics
    const metrics = [
      {
        name: 'dns_lookup',
        value: nav.domainLookupEnd - nav.domainLookupStart,
      },
      { name: 'tcp_connection', value: nav.connectEnd - nav.connectStart },
      { name: 'request_response', value: nav.responseEnd - nav.requestStart },
      { name: 'dom_processing', value: nav.domComplete - nav.domLoading },
      { name: 'page_load', value: nav.loadEventEnd - nav.navigationStart },
    ];

    metrics.forEach(metric => {
      if (metric.value > 0) {
        this.recordMetric({
          name: metric.name,
          value: metric.value,
          unit: 'ms',
          timestamp: Date.now(),
          context: 'navigation',
        });
      }
    });
  }

  /**
   * Track resource timing
   */
  private trackResourceTiming(): void {
    if (!('performance' in window) || !performance.getEntriesByType) return;

    const resourceEntries = performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[];

    // Group resources by type
    const resourceTypes = {
      script: [] as PerformanceResourceTiming[],
      stylesheet: [] as PerformanceResourceTiming[],
      image: [] as PerformanceResourceTiming[],
      font: [] as PerformanceResourceTiming[],
    };

    resourceEntries.forEach(entry => {
      const url = new URL(entry.name);
      const extension = url.pathname.split('.').pop()?.toLowerCase();

      if (extension) {
        if (['js', 'mjs'].includes(extension)) {
          resourceTypes.script.push(entry);
        } else if (['css'].includes(extension)) {
          resourceTypes.stylesheet.push(entry);
        } else if (
          ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)
        ) {
          resourceTypes.image.push(entry);
        } else if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) {
          resourceTypes.font.push(entry);
        }
      }
    });

    // Report resource loading metrics
    Object.entries(resourceTypes).forEach(([type, entries]) => {
      if (entries.length > 0) {
        const totalDuration = entries.reduce(
          (sum, entry) => sum + entry.duration,
          0
        );
        const averageDuration = totalDuration / entries.length;

        this.recordMetric({
          name: `resource_${type}_avg_load_time`,
          value: averageDuration,
          unit: 'ms',
          timestamp: Date.now(),
          context: 'resources',
        });
      }
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    logger.debug('Performance metric recorded:', metric);
  }

  /**
   * Check if metric should be reported to analytics
   */
  private shouldReportMetric(entry: PerformanceEntry): boolean {
    // Sample based on configuration
    return Math.random() < config.performance.sampleRate;
  }

  /**
   * Report metric to analytics
   */
  private reportToAnalytics(metric: PerformanceMetric): void {
    analyticsService.trackPerformance(metric.name, metric.value, metric.unit);
  }

  /**
   * Track custom timing
   */
  trackTiming(name: string, startTime: number, endTime?: number): void {
    const end = endTime || performance.now();
    const duration = end - startTime;

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      context: 'custom',
    });

    // Report to analytics if sampling allows
    if (Math.random() < config.performance.sampleRate) {
      analyticsService.trackPerformance(name, duration);
    }
  }

  /**
   * Start timing measurement
   */
  startTiming(name: string): () => void {
    const startTime = performance.now();

    return () => {
      this.trackTiming(name, startTime);
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalMetrics: number;
    averagePageLoad: number;
    webVitals: Record<string, number>;
  } {
    const webVitals: Record<string, number> = {};
    const totalPageLoad = 0;
    const pageLoadCount = 0;

    this.metrics.forEach(metric => {
      if (metric.context === 'web_vitals') {
        webVitals[metric.name] = metric.value;
      } else if (metric.name === 'page_load') {
        totalPageLoad += metric.value;
        pageLoadCount++;
      }
    });

    return {
      totalMetrics: this.metrics.length,
      averagePageLoad: pageLoadCount > 0 ? totalPageLoad / pageLoadCount : 0,
      webVitals,
    };
  }

  /**
   * Clear stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    logger.debug('Performance metrics cleared');
  }

  /**
   * Cleanup performance monitoring
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.clearMetrics();
    this.initialized = false;
    logger.debug('Performance monitoring cleaned up');
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
