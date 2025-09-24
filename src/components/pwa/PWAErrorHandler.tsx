/**
 * PWA Error Handler Component
 * Displays user-friendly error messages and fallback instructions for PWA install errors
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { AccessibleButton } from '../ui/AccessibleButton';
import { Modal } from '../ui/Modal';
import PWAErrorHandler, { PWAError, PWAErrorType } from '../../utils/pwaErrorHandling';

interface PWAErrorHandlerProps {
  error?: PWAError;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const PWAErrorHandlerComponent: React.FC<PWAErrorHandlerProps> = ({
  error,
  onDismiss,
  onRetry,
  className = ''
}) => {
  const { theme, isHighContrast } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [fallbackInstructions, setFallbackInstructions] = useState<any>(null);
  const [browserRecommendation, setBrowserRecommendation] = useState<any>(null);

  // Listen for PWA error events
  useEffect(() => {
    const handleShowFallbackInstructions = (event: CustomEvent) => {
      setFallbackInstructions(event.detail);
      setShowModal(true);
    };

    const handleShowBrowserRecommendation = (event: CustomEvent) => {
      setBrowserRecommendation(event.detail);
      setShowModal(true);
    };

    const handleRetryInstall = () => {
      if (onRetry) {
        onRetry();
      }
    };

    const handleDismissError = () => {
      setShowModal(false);
      if (onDismiss) {
        onDismiss();
      }
    };

    window.addEventListener('pwa-show-fallback-instructions', handleShowFallbackInstructions as EventListener);
    window.addEventListener('pwa-show-browser-recommendation', handleShowBrowserRecommendation as EventListener);
    window.addEventListener('pwa-retry-install', handleRetryInstall);
    window.addEventListener('pwa-dismiss-error', handleDismissError);

    return () => {
      window.removeEventListener('pwa-show-fallback-instructions', handleShowFallbackInstructions as EventListener);
      window.removeEventListener('pwa-show-browser-recommendation', handleShowBrowserRecommendation as EventListener);
      window.removeEventListener('pwa-retry-install', handleRetryInstall);
      window.removeEventListener('pwa-dismiss-error', handleDismissError);
    };
  }, [onRetry, onDismiss]);

  // Show error if provided
  useEffect(() => {
    if (error) {
      setShowModal(true);
    }
  }, [error]);

  if (!error && !fallbackInstructions && !browserRecommendation) {
    return null;
  }

  const getErrorIcon = (errorType?: PWAErrorType) => {
    switch (errorType) {
      case PWAErrorType.BROWSER_NOT_SUPPORTED:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case PWAErrorType.NETWORK_ERROR:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getThemeStyles = () => {
    if (isHighContrast) {
      return {
        container: 'bg-white text-black border-2 border-black',
        icon: 'text-black',
        button: 'bg-black text-white border-2 border-white hover:bg-gray-800',
        secondaryButton: 'bg-white text-black border-2 border-black hover:bg-gray-200'
      };
    }

    const isDark = theme === 'dark';
    return {
      container: isDark 
        ? 'bg-gray-800 text-white border border-gray-700' 
        : 'bg-white text-gray-900 border border-gray-200',
      icon: isDark ? 'text-orange-400' : 'text-orange-600',
      button: isDark
        ? 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
        : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
      secondaryButton: isDark
        ? 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
    };
  };

  const styles = getThemeStyles();

  const renderErrorContent = () => {
    if (error) {
      const errorMessage = PWAErrorHandler.createErrorMessage(error);
      
      return (
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className={`${styles.icon} mt-1`}>
              {getErrorIcon(error.type)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                {errorMessage.title}
              </h3>
              <p className="text-sm mb-2">
                {errorMessage.message}
              </p>
              <p className="text-sm opacity-75" lang="ml">
                {errorMessage.malayalamMessage}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {errorMessage.actions.map((action, index) => (
              <AccessibleButton
                key={index}
                onClick={action.action}
                className={action.primary ? styles.button : styles.secondaryButton}
                variant={action.primary ? 'primary' : 'secondary'}
                size="sm"
              >
                <span className="block">{action.label}</span>
                <span className="block text-xs opacity-75 mt-1" lang="ml">
                  {action.malayalamLabel}
                </span>
              </AccessibleButton>
            ))}
          </div>
        </div>
      );
    }

    if (fallbackInstructions) {
      return (
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className={`${styles.icon} mt-1`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Manual Installation Instructions
              </h3>
              <p className="text-sm mb-4">
                Follow these steps to install the app:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">English Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {fallbackInstructions.english.map((instruction: string, index: number) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2" lang="ml">മലയാളം നിർദ്ദേശങ്ങൾ:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm" lang="ml">
                    {fallbackInstructions.malayalam.map((instruction: string, index: number) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <AccessibleButton
              onClick={() => setShowModal(false)}
              className={styles.button}
              variant="primary"
              size="sm"
            >
              <span className="block">Got it</span>
              <span className="block text-xs opacity-75 mt-1" lang="ml">മനസ്സിലായി</span>
            </AccessibleButton>
          </div>
        </div>
      );
    }

    if (browserRecommendation) {
      return (
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className={`${styles.icon} mt-1`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Browser Recommendation
              </h3>
              <p className="text-sm mb-2">
                {browserRecommendation.english}
              </p>
              <p className="text-sm opacity-75 mb-4" lang="ml">
                {browserRecommendation.malayalam}
              </p>
              <p className="text-xs opacity-60">
                Current browser: {browserRecommendation.currentBrowser}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <AccessibleButton
              onClick={() => setShowModal(false)}
              className={styles.button}
              variant="primary"
              size="sm"
            >
              <span className="block">Understood</span>
              <span className="block text-xs opacity-75 mt-1" lang="ml">മനസ്സിലായി</span>
            </AccessibleButton>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
        if (onDismiss) onDismiss();
      }}
      title="App Installation"
      className={className}
    >
      <div className={`${styles.container} rounded-lg p-6 shadow-lg`}>
        {renderErrorContent()}
      </div>
    </Modal>
  );
};

export default PWAErrorHandlerComponent;