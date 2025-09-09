import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AccessibleButton } from './ui/AccessibleButton';
import { AlertBanner } from './ui/AlertBanner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
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
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-1">
                We're sorry, but something unexpected happened.
              </p>
              <p className="text-gray-500 text-sm" lang="ml">
                ക്ഷമിക്കണം, എന്തോ അപ്രതീക്ഷിതമായ കാര്യം സംഭവിച്ചു.
              </p>
            </div>

            <AlertBanner
              type="error"
              message="An error occurred while loading the component"
              malayalamMessage="കോംപോണന്റ് ലോഡ് ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു"
            />

            <div className="space-y-3">
              <AccessibleButton
                variant="primary"
                onClick={this.handleRetry}
                className="w-full"
                ariaLabel="Try again"
              >
                Try Again
                <span className="block text-sm mt-1" lang="ml">
                  വീണ്ടും ശ്രമിക്കുക
                </span>
              </AccessibleButton>

              <AccessibleButton
                variant="secondary"
                onClick={() => window.location.reload()}
                className="w-full"
                ariaLabel="Reload page"
              >
                Reload Page
                <span className="block text-sm mt-1" lang="ml">
                  പേജ് റീലോഡ് ചെയ്യുക
                </span>
              </AccessibleButton>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Error:</strong>
                    <pre className="mt-1 p-2 bg-red-50 text-red-800 rounded text-xs overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 p-2 bg-red-50 text-red-800 rounded text-xs overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Accessibility information */}
            <div className="text-xs text-gray-500 p-3 bg-gray-100 rounded-lg">
              <p>
                <strong>Accessibility:</strong> This error page is screen reader accessible.
                Use the "Try Again" button to retry loading the component.
              </p>
              <p lang="ml" className="mt-1">
                <strong>പ്രവേശനക്ഷമത:</strong> ഈ പിശക് പേജ് സ്ക്രീൻ റീഡർ ആക്സസ് ചെയ്യാവുന്നതാണ്.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specific error boundary for lazy loading failures
export const LazyLoadErrorBoundary: React.FC<{ children: ReactNode; componentName?: string }> = ({ 
  children, 
  componentName = 'component' 
}) => (
  <ErrorBoundary
    fallback={
      <div className="p-6 text-center bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-600 mb-2">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-900 mb-1">
          Failed to load {componentName}
        </h3>
        <p className="text-red-700 text-sm mb-3">
          The {componentName} could not be loaded. Please try refreshing the page.
        </p>
        <p className="text-red-600 text-xs" lang="ml">
          {componentName} ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല. പേജ് റിഫ്രഷ് ചെയ്യാൻ ശ്രമിക്കുക.
        </p>
        <AccessibleButton
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-3"
        >
          Refresh Page
        </AccessibleButton>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error(`Lazy loading error for ${componentName}:`, error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);