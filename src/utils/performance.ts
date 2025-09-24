/**
 * Performance monitoring utilities for InstallPrompt component
 */

interface PerformanceMetrics {
  themeChange: number;
  positioning: number;
  animation: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private startTimes: Partial<PerformanceMetrics> = {};

  startMeasurement(metric: keyof PerformanceMetrics): void {
    if (import.meta.env.DEV) {
      this.startTimes[metric] = performance.now();
    }
  }

  endMeasurement(
    metric: keyof PerformanceMetrics,
    warningThreshold: number = 16
  ): void {
    if (import.meta.env.DEV && this.startTimes[metric]) {
      const duration = performance.now() - this.startTimes[metric]!;
      this.metrics[metric] = duration;

      if (duration > warningThreshold) {
        console.warn(
          `InstallPrompt ${metric} took ${duration.toFixed(2)}ms (threshold: ${warningThreshold}ms) - consider optimization`
        );
      }

      delete this.startTimes[metric];
    }
  }

  measureAsync<T>(
    metric: keyof PerformanceMetrics,
    fn: () => Promise<T>,
    warningThreshold: number = 16
  ): Promise<T> {
    this.startMeasurement(metric);
    return fn().finally(() => {
      // Use requestAnimationFrame to measure after DOM updates
      requestAnimationFrame(() => {
        this.endMeasurement(metric, warningThreshold);
      });
    });
  }

  measureSync<T>(
    metric: keyof PerformanceMetrics,
    fn: () => T,
    warningThreshold: number = 16
  ): T {
    this.startMeasurement(metric);
    let result = fn();

    // Use requestAnimationFrame to measure after DOM updates
    requestAnimationFrame(() => {
      this.endMeasurement(metric, warningThreshold);
    });

    return result;
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {};
    this.startTimes = {};
  }
}

export const installPromptPerformanceMonitor = new PerformanceMonitor();

/**
 * Hook for monitoring InstallPrompt performance
 */
export const useInstallPromptPerformance = () => {
  return {
    monitor: installPromptPerformanceMonitor,
    measureThemeChange: (fn: () => void) =>
      installPromptPerformanceMonitor.measureSync('themeChange', fn, 16),
    measurePositioning: (fn: () => void) =>
      installPromptPerformanceMonitor.measureSync('positioning', fn, 100),
    measureAnimation: (fn: () => void) =>
      installPromptPerformanceMonitor.measureSync('animation', fn, 300),
  };
};
