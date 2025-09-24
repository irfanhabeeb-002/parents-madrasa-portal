import React, { Component, ErrorInfo, ReactNode } from 'react';
import { analyticsService } from '../../services/AnalyticsService';
import { trackInstallFailed } from '../../utils/installAnalytics';

interface PWAInstallErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  source?: string;
  placement?: string;
}

interface PWAInstallErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class PWAInstallErrorBoundary extends Component<
  PWAInstallErrorBoundaryProps,
  PWAInstallErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: PWAInstallErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<PWAInstallErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const {
      componentName = 'PWAInstallComponent',
      source = 'unknown',
      placement = 'unknown',
    } = this.props;

    // Log the error with enhanced context
    console.error(
      `PWA Install Error Boundary caught error in ${componentName}:`,
      error,
      errorInfo
    );

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Track install-related error with enhanced analytics
    trackInstallFailed({
      source: source as any,
      placement: placement as any,
      trigger: 'component_error',
      component: componentName,
      errorType: error.constructor.name,
      errorMessage: error.message,
      errorStack: error.stack,
      sessionDuration:
        Date.now() -
        (parseInt(sessionStorage.getItem('sessionStartTime') || '0') ||
          Date.now()),
    });

    // Legacy analytics for backward compatibility
    analyticsService.trackEvent({
      action: 'pwa_install_component_error',
      category: 'pwa',
      label: 'error_boundary_triggered',
      custom_parameters: {
        component_name: componentName,
        error_message: error.message,
        error_type: error.constructor.name,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        source,
        placement,
        retry_count: this.state.retryCount,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    // Clean up any pending retry timeouts
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    // Track retry attempt
    analyticsService.trackEvent({
      action: 'pwa_install_error_retry',
      category: 'pwa',
      label: 'error_boundary_retry',
      custom_parameters: {
        component_name: this.props.componentName || 'PWAInstallComponent',
        retry_count: newRetryCount,
        source: this.props.source || 'unknown',
        placement: this.props.placement || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });

    // Reset error state with incremented retry count
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: newRetryCount,
    });
  };

  handleRefresh = () => {
    // Track page refresh
    analyticsService.trackEvent({
      action: 'pwa_install_error_refresh',
      category: 'pwa',
      label: 'error_boundary_refresh',
      custom_parameters: {
        component_name: this.props.componentName || 'PWAInstallComponent',
        retry_count: this.state.retryCount,
        source: this.props.source || 'unknown',
        placement: this.props.placement || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });

    // Clear any PWA-related session storage before refresh
    try {
      sessionStorage.removeItem('pwa-install-dismissed');
      sessionStorage.removeItem('pwa-fallback-dismissed');
    } catch (error) {
      console.warn('Failed to clear PWA session storage:', error);
    }

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default PWA install-specific fallback UI
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-5 lg:p-6 mx-2 sm:mx-0">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-orange-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-medium text-orange-900 mb-2">
                Install Feature Unavailable
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-orange-700 mb-4 leading-relaxed">
                The app installation feature encountered an error. You can still
                use the app normally in your browser.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center justify-center px-4 py-2 border border-orange-300 rounded-md shadow-sm bg-white text-sm font-medium text-orange-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 min-h-[48px]"
                  aria-label="Try to restore install feature"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again{' '}
                  {this.state.retryCount > 0 && `(${this.state.retryCount})`}
                </button>
                <button
                  onClick={this.handleRefresh}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 min-h-[48px]"
                  aria-label="Refresh page to restore install feature"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Page
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for PWA install components
export const withPWAInstallErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  source?: string,
  placement?: string
) => {
  const WrappedComponent = (props: P) => (
    <PWAInstallErrorBoundary
      componentName={componentName}
      source={source}
      placement={placement}
    >
      <Component {...props} />
    </PWAInstallErrorBoundary>
  );

  WrappedComponent.displayName = `withPWAInstallErrorBoundary(${componentName})`;
  return WrappedComponent;
};
