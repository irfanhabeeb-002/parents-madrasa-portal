/**
 * Comprehensive PWA Install Error Handling and Fallback Strategies
 * Provides robust error handling for unsupported browsers and PWA features
 */

import { analyticsService } from '../services/AnalyticsService';
import { ErrorHandlingService } from '../services/errorHandlingService';
import { trackInstallFailed } from './installAnalytics';

export interface PWAErrorContext {
  component: 'InstallPrompt' | 'InstallButton' | 'FallbackInstallButton';
  source: string;
  placement: string;
  userAgent: string;
  browserInfo: BrowserInfo;
  installState: string;
}

export interface BrowserInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  supportsBeforeInstallPrompt: boolean;
  supportsServiceWorker: boolean;
  version?: string;
}

export enum PWAErrorType {
  BROWSER_NOT_SUPPORTED = 'browser_not_supported',
  SERVICE_WORKER_FAILED = 'service_worker_failed',
  MANIFEST_MISSING = 'manifest_missing',
  BEFOREINSTALLPROMPT_FAILED = 'beforeinstallprompt_failed',
  PROMPT_FAILED = 'prompt_failed',
  USER_CHOICE_TIMEOUT = 'user_choice_timeout',
  INSTALLATION_FAILED = 'installation_failed',
  ALREADY_INSTALLED = 'already_installed',
  PERMISSION_DENIED = 'permission_denied',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
  EVENT_LISTENER_FAILED = 'event_listener_failed',
  STATE_DETECTION_FAILED = 'state_detection_failed'
}

export interface PWAError extends Error {
  type: PWAErrorType;
  context: PWAErrorContext;
  recoverable: boolean;
  userMessage: string;
  malayalamMessage: string;
  fallbackAction?: string;
}

export class PWAErrorHandler {
  private static errorLog: PWAError[] = [];
  private static maxLogSize = 50;

  /**
   * Create a PWA-specific error with context
   */
  static createError(
    type: PWAErrorType,
    message: string,
    context: PWAErrorContext,
    originalError?: Error
  ): PWAError {
    const error = new Error(message) as PWAError;
    error.type = type;
    error.context = context;
    error.recoverable = this.isRecoverable(type);
    error.userMessage = this.getUserMessage(type, context);
    error.malayalamMessage = this.getMalayalamMessage(type, context);
    error.fallbackAction = this.getFallbackAction(type, context);

    if (originalError) {
      error.stack = originalError.stack;
      error.cause = originalError;
    }

    return error;
  }

  /**
   * Handle PWA errors with comprehensive logging and user feedback
   */
  static handleError(error: PWAError | Error, context?: PWAErrorContext): void {
    let pwaError: PWAError;

    if (this.isPWAError(error)) {
      pwaError = error;
    } else {
      // Convert generic error to PWA error
      const errorType = this.classifyError(error);
      pwaError = this.createError(
        errorType,
        error.message,
        context || this.getDefaultContext(),
        error
      );
    }

    // Log error
    this.logError(pwaError);

    // Track analytics
    this.trackError(pwaError);

    // Handle based on error type
    this.processError(pwaError);
  }

  /**
   * Check if browser supports PWA features
   */
  static checkBrowserSupport(): {
    supported: boolean;
    issues: string[];
    browserInfo: BrowserInfo;
  } {
    const issues: string[] = [];
    const browserInfo = this.getBrowserInfo();

    // Check service worker support
    if (!browserInfo.supportsServiceWorker) {
      issues.push('Service Worker not supported');
    }

    // Check manifest support
    if (!document.querySelector('link[rel="manifest"]')) {
      issues.push('Web App Manifest not found');
    }

    // Check HTTPS requirement
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push('HTTPS required for PWA features');
    }

    // Browser-specific checks
    if (browserInfo.isIOS && !browserInfo.isSafari) {
      issues.push('iOS PWA support limited to Safari');
    }

    if (browserInfo.isFirefox) {
      issues.push('Firefox has limited PWA support');
    }

    return {
      supported: issues.length === 0,
      issues,
      browserInfo
    };
  }

  /**
   * Get fallback installation instructions for unsupported browsers
   */
  static getFallbackInstructions(browserInfo: BrowserInfo): {
    english: string[];
    malayalam: string[];
    canInstall: boolean;
  } {
    if (browserInfo.isIOS && browserInfo.isSafari) {
      return {
        english: [
          'Tap the Share button at the bottom of the screen',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install the app'
        ],
        malayalam: [
          'സ്ക്രീനിന്റെ താഴെയുള്ള ഷെയർ ബട്ടൺ ടാപ്പ് ചെയ്യുക',
          'താഴേക്ക് സ്ക്രോൾ ചെയ്ത് "ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക" ടാപ്പ് ചെയ്യുക',
          'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാൻ "ചേർക്കുക" ടാപ്പ് ചെയ്യുക'
        ],
        canInstall: true
      };
    }

    if (browserInfo.isAndroid && browserInfo.isChrome) {
      return {
        english: [
          'Tap the menu button (three dots) in the top right',
          'Select "Add to Home screen" or "Install app"',
          'Tap "Add" or "Install" to confirm'
        ],
        malayalam: [
          'മുകളിൽ വലതുവശത്തുള്ള മെനു ബട്ടൺ (മൂന്ന് ഡോട്ടുകൾ) ടാപ്പ് ചെയ്യുക',
          '"ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക" അല്ലെങ്കിൽ "ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക" തിരഞ്ഞെടുക്കുക',
          'സ്ഥിരീകരിക്കാൻ "ചേർക്കുക" അല്ലെങ്കിൽ "ഇൻസ്റ്റാൾ" ടാപ്പ് ചെയ്യുക'
        ],
        canInstall: true
      };
    }

    if (browserInfo.isEdge || browserInfo.isChrome) {
      return {
        english: [
          'Click the install button in the address bar',
          'Or go to browser menu and select "Install app"',
          'Click "Install" to add to your desktop'
        ],
        malayalam: [
          'വിലാസ ബാറിലെ ഇൻസ്റ്റാൾ ബട്ടൺ ക്ലിക്ക് ചെയ്യുക',
          'അല്ലെങ്കിൽ ബ്രൗസർ മെനുവിൽ പോയി "ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക" തിരഞ്ഞെടുക്കുക',
          'നിങ്ങളുടെ ഡെസ്ക്ടോപ്പിലേക്ക് ചേർക്കാൻ "ഇൻസ്റ്റാൾ" ക്ലിക്ക് ചെയ്യുക'
        ],
        canInstall: true
      };
    }

    return {
      english: [
        'This browser has limited PWA support',
        'For the best experience, use Chrome, Edge, or Safari',
        'You can still bookmark this page for quick access'
      ],
      malayalam: [
        'ഈ ബ്രൗസറിന് പരിമിതമായ PWA പിന്തുണയുണ്ട്',
        'മികച്ച അനുഭവത്തിനായി Chrome, Edge, അല്ലെങ്കിൽ Safari ഉപയോഗിക്കുക',
        'വേഗത്തിലുള്ള ആക്സസിനായി നിങ്ങൾക്ക് ഈ പേജ് ബുക്ക്മാർക്ക് ചെയ്യാം'
      ],
      canInstall: false
    };
  }

  /**
   * Create user-friendly error message component
   */
  static createErrorMessage(error: PWAError): {
    title: string;
    message: string;
    malayalamTitle: string;
    malayalamMessage: string;
    actions: Array<{
      label: string;
      malayalamLabel: string;
      action: () => void;
      primary?: boolean;
    }>;
  } {
    const actions: Array<{
      label: string;
      malayalamLabel: string;
      action: () => void;
      primary?: boolean;
    }> = [];

    // Add retry action for recoverable errors
    if (error.recoverable) {
      actions.push({
        label: 'Try Again',
        malayalamLabel: 'വീണ്ടും ശ്രമിക്കുക',
        action: () => this.retryLastAction(error),
        primary: true
      });
    }

    // Add fallback action if available
    if (error.fallbackAction) {
      actions.push({
        label: 'Show Instructions',
        malayalamLabel: 'നിർദ്ദേശങ്ങൾ കാണിക്കുക',
        action: () => this.showFallbackInstructions(error.context.browserInfo)
      });
    }

    // Add dismiss action
    actions.push({
      label: 'Dismiss',
      malayalamLabel: 'തള്ളിക്കളയുക',
      action: () => this.dismissError(error)
    });

    return {
      title: this.getErrorTitle(error.type),
      message: error.userMessage,
      malayalamTitle: this.getMalayalamErrorTitle(error.type),
      malayalamMessage: error.malayalamMessage,
      actions
    };
  }

  /**
   * Log error for debugging
   */
  private static logError(error: PWAError): void {
    console.error('PWA Install Error:', {
      type: error.type,
      message: error.message,
      context: error.context,
      recoverable: error.recoverable,
      stack: error.stack
    });

    // Add to error log
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Use existing error handling service
    ErrorHandlingService.handleError(error, {
      service: 'PWAInstallService',
      operation: 'install_operation',
      timestamp: new Date(),
      networkStatus: navigator.onLine
    }, {
      showToUser: false,
      logToConsole: false,
      retryable: error.recoverable
    });
  }

  /**
   * Track error in analytics
   */
  private static trackError(error: PWAError): void {
    // Use enhanced analytics
    trackInstallFailed({
      source: error.context.source as any,
      placement: error.context.placement as any,
      trigger: 'error_handler',
      component: error.context.component,
      errorType: error.type,
      errorMessage: error.message,
      errorStack: error.stack,
      sessionDuration: Date.now() - (parseInt(sessionStorage.getItem('sessionStartTime') || '0') || Date.now())
    });

    // Legacy analytics
    analyticsService.trackEvent({
      action: 'pwa_install_error',
      category: 'pwa',
      label: error.type,
      custom_parameters: {
        error_type: error.type,
        error_message: error.message,
        component: error.context.component,
        source: error.context.source,
        placement: error.context.placement,
        browser_info: JSON.stringify(error.context.browserInfo),
        install_state: error.context.installState,
        recoverable: error.recoverable,
        user_agent: error.context.userAgent,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Process error based on type
   */
  private static processError(error: PWAError): void {
    switch (error.type) {
      case PWAErrorType.BROWSER_NOT_SUPPORTED:
        this.handleUnsupportedBrowser(error);
        break;
      case PWAErrorType.SERVICE_WORKER_FAILED:
        this.handleServiceWorkerError(error);
        break;
      case PWAErrorType.BEFOREINSTALLPROMPT_FAILED:
        this.handlePromptError(error);
        break;
      default:
        this.handleGenericError(error);
    }
  }

  /**
   * Handle unsupported browser
   */
  private static handleUnsupportedBrowser(error: PWAError): void {
    const instructions = this.getFallbackInstructions(error.context.browserInfo);
    
    if (instructions.canInstall) {
      // Show manual installation instructions
      this.showFallbackInstructions(error.context.browserInfo);
    } else {
      // Show browser recommendation
      this.showBrowserRecommendation(error.context.browserInfo);
    }
  }

  /**
   * Handle service worker errors
   */
  private static handleServiceWorkerError(error: PWAError): void {
    // Try to re-register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          console.warn('Service worker re-registered successfully');
        })
        .catch((swError) => {
          console.error('Service worker re-registration failed:', swError);
        });
    }
  }

  /**
   * Handle prompt errors
   */
  private static handlePromptError(error: PWAError): void {
    // Clear any stored prompt state
    sessionStorage.removeItem('pwa-install-dismissed');
    
    // Show fallback instructions
    this.showFallbackInstructions(error.context.browserInfo);
  }

  /**
   * Handle generic errors
   */
  private static handleGenericError(error: PWAError): void {
    // Log for debugging
    console.warn('Generic PWA error handled:', error.type, error.message);
  }

  /**
   * Show fallback installation instructions
   */
  private static showFallbackInstructions(browserInfo: BrowserInfo): void {
    const instructions = this.getFallbackInstructions(browserInfo);
    
    // This would integrate with your UI notification system
    console.warn('Fallback installation instructions:', instructions);
    
    // Store instructions for UI components to display
    sessionStorage.setItem('pwa-fallback-instructions', JSON.stringify(instructions));
    
    // Dispatch custom event for UI components to listen
    window.dispatchEvent(new CustomEvent('pwa-show-fallback-instructions', {
      detail: instructions
    }));
  }

  /**
   * Show browser recommendation
   */
  private static showBrowserRecommendation(browserInfo: BrowserInfo): void {
    const recommendation = {
      english: 'For the best experience, please use Chrome, Edge, or Safari',
      malayalam: 'മികച്ച അനുഭവത്തിനായി, ദയവായി Chrome, Edge, അല്ലെങ്കിൽ Safari ഉപയോഗിക്കുക',
      currentBrowser: this.getBrowserName(browserInfo)
    };

    console.warn('Browser recommendation:', recommendation);
    
    // Store for UI components
    sessionStorage.setItem('pwa-browser-recommendation', JSON.stringify(recommendation));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('pwa-show-browser-recommendation', {
      detail: recommendation
    }));
  }

  /**
   * Retry last action
   */
  private static retryLastAction(error: PWAError): void {
    // This would be implemented by the calling component
    console.warn('Retry action for error:', error.type);
    
    // Dispatch retry event
    window.dispatchEvent(new CustomEvent('pwa-retry-install', {
      detail: { error }
    }));
  }

  /**
   * Dismiss error
   */
  private static dismissError(error: PWAError): void {
    // Track dismissal
    analyticsService.trackEvent({
      action: 'pwa_error_dismissed',
      category: 'pwa',
      label: error.type,
      custom_parameters: {
        error_type: error.type,
        component: error.context.component,
        timestamp: new Date().toISOString()
      }
    });

    // Dispatch dismiss event
    window.dispatchEvent(new CustomEvent('pwa-dismiss-error', {
      detail: { error }
    }));
  }

  /**
   * Utility methods
   */
  private static isPWAError(error: any): error is PWAError {
    return error && typeof error.type === 'string' && error.context;
  }

  private static classifyError(error: Error): PWAErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('service worker')) {
      return PWAErrorType.SERVICE_WORKER_FAILED;
    }
    if (message.includes('beforeinstallprompt')) {
      return PWAErrorType.BEFOREINSTALLPROMPT_FAILED;
    }
    if (message.includes('prompt')) {
      return PWAErrorType.PROMPT_FAILED;
    }
    if (message.includes('network')) {
      return PWAErrorType.NETWORK_ERROR;
    }
    if (message.includes('permission')) {
      return PWAErrorType.PERMISSION_DENIED;
    }
    
    return PWAErrorType.UNKNOWN_ERROR;
  }

  private static isRecoverable(type: PWAErrorType): boolean {
    const recoverableTypes = [
      PWAErrorType.PROMPT_FAILED,
      PWAErrorType.USER_CHOICE_TIMEOUT,
      PWAErrorType.NETWORK_ERROR,
      PWAErrorType.EVENT_LISTENER_FAILED
    ];
    return recoverableTypes.includes(type);
  }

  private static getFallbackAction(type: PWAErrorType, context: PWAErrorContext): string | undefined {
    if (type === PWAErrorType.BROWSER_NOT_SUPPORTED) {
      const instructions = this.getFallbackInstructions(context.browserInfo);
      return instructions.canInstall ? 'show_instructions' : 'show_browser_recommendation';
    }
    
    if (type === PWAErrorType.BEFOREINSTALLPROMPT_FAILED || type === PWAErrorType.PROMPT_FAILED) {
      return 'show_instructions';
    }
    
    return undefined;
  }

  private static getUserMessage(type: PWAErrorType, context: PWAErrorContext): string {
    switch (type) {
      case PWAErrorType.BROWSER_NOT_SUPPORTED:
        return `Your browser (${this.getBrowserName(context.browserInfo)}) has limited PWA support. You can still install the app manually.`;
      case PWAErrorType.SERVICE_WORKER_FAILED:
        return 'App installation requires service worker support. Please try refreshing the page.';
      case PWAErrorType.BEFOREINSTALLPROMPT_FAILED:
        return 'Automatic installation is not available. You can install the app manually through your browser menu.';
      case PWAErrorType.PROMPT_FAILED:
        return 'Installation prompt failed. Please try again or install manually through your browser.';
      case PWAErrorType.ALREADY_INSTALLED:
        return 'The app is already installed on your device.';
      case PWAErrorType.PERMISSION_DENIED:
        return 'Installation permission was denied. You can try again or install manually.';
      case PWAErrorType.NETWORK_ERROR:
        return 'Network error occurred during installation. Please check your connection and try again.';
      default:
        return 'An error occurred during app installation. Please try again.';
    }
  }

  private static getMalayalamMessage(type: PWAErrorType, context: PWAErrorContext): string {
    switch (type) {
      case PWAErrorType.BROWSER_NOT_SUPPORTED:
        return `നിങ്ങളുടെ ബ്രൗസറിന് (${this.getBrowserName(context.browserInfo)}) പരിമിതമായ PWA പിന്തുണയുണ്ട്. നിങ്ങൾക്ക് ഇപ്പോഴും ആപ്പ് സ്വമേധയാ ഇൻസ്റ്റാൾ ചെയ്യാം.`;
      case PWAErrorType.SERVICE_WORKER_FAILED:
        return 'ആപ്പ് ഇൻസ്റ്റാളേഷന് സർവീസ് വർക്കർ പിന്തുണ ആവശ്യമാണ്. ദയവായി പേജ് പുതുക്കി ശ്രമിക്കുക.';
      case PWAErrorType.BEFOREINSTALLPROMPT_FAILED:
        return 'ഓട്ടോമാറ്റിക് ഇൻസ്റ്റാളേഷൻ ലഭ്യമല്ല. നിങ്ങളുടെ ബ്രൗസർ മെനു വഴി ആപ്പ് സ്വമേധയാ ഇൻസ്റ്റാൾ ചെയ്യാം.';
      case PWAErrorType.PROMPT_FAILED:
        return 'ഇൻസ്റ്റാളേഷൻ പ്രോംപ്റ്റ് പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ ബ്രൗസർ വഴി സ്വമേധയാ ഇൻസ്റ്റാൾ ചെയ്യുക.';
      case PWAErrorType.ALREADY_INSTALLED:
        return 'ആപ്പ് ഇതിനകം നിങ്ങളുടെ ഉപകരണത്തിൽ ഇൻസ്റ്റാൾ ചെയ്തിട്ടുണ്ട്.';
      case PWAErrorType.PERMISSION_DENIED:
        return 'ഇൻസ്റ്റാളേഷൻ അനുമതി നിരസിച്ചു. നിങ്ങൾക്ക് വീണ്ടും ശ്രമിക്കാം അല്ലെങ്കിൽ സ്വമേധയാ ഇൻസ്റ്റാൾ ചെയ്യാം.';
      case PWAErrorType.NETWORK_ERROR:
        return 'ഇൻസ്റ്റാളേഷൻ സമയത്ത് നെറ്റ്‌വർക്ക് പിശക് സംഭവിച്ചു. നിങ്ങളുടെ കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.';
      default:
        return 'ആപ്പ് ഇൻസ്റ്റാളേഷൻ സമയത്ത് ഒരു പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.';
    }
  }

  private static getErrorTitle(type: PWAErrorType): string {
    switch (type) {
      case PWAErrorType.BROWSER_NOT_SUPPORTED:
        return 'Limited Browser Support';
      case PWAErrorType.SERVICE_WORKER_FAILED:
        return 'Service Worker Error';
      case PWAErrorType.BEFOREINSTALLPROMPT_FAILED:
      case PWAErrorType.PROMPT_FAILED:
        return 'Installation Prompt Failed';
      case PWAErrorType.ALREADY_INSTALLED:
        return 'Already Installed';
      case PWAErrorType.PERMISSION_DENIED:
        return 'Permission Denied';
      case PWAErrorType.NETWORK_ERROR:
        return 'Network Error';
      default:
        return 'Installation Error';
    }
  }

  private static getMalayalamErrorTitle(type: PWAErrorType): string {
    switch (type) {
      case PWAErrorType.BROWSER_NOT_SUPPORTED:
        return 'പരിമിതമായ ബ്രൗസർ പിന്തുണ';
      case PWAErrorType.SERVICE_WORKER_FAILED:
        return 'സർവീസ് വർക്കർ പിശക്';
      case PWAErrorType.BEFOREINSTALLPROMPT_FAILED:
      case PWAErrorType.PROMPT_FAILED:
        return 'ഇൻസ്റ്റാളേഷൻ പ്രോംപ്റ്റ് പരാജയപ്പെട്ടു';
      case PWAErrorType.ALREADY_INSTALLED:
        return 'ഇതിനകം ഇൻസ്റ്റാൾ ചെയ്തു';
      case PWAErrorType.PERMISSION_DENIED:
        return 'അനുമതി നിരസിച്ചു';
      case PWAErrorType.NETWORK_ERROR:
        return 'നെറ്റ്‌വർക്ക് പിശക്';
      default:
        return 'ഇൻസ്റ്റാളേഷൻ പിശക്';
    }
  }

  private static getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    
    return {
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      isChrome: /Chrome/.test(userAgent) && !/Edg/.test(userAgent),
      isFirefox: /Firefox/.test(userAgent),
      isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
      isEdge: /Edg/.test(userAgent),
      supportsBeforeInstallPrompt: 'onbeforeinstallprompt' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      version: this.getBrowserVersion(userAgent)
    };
  }

  private static getBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'unknown';
  }

  private static getBrowserName(browserInfo: BrowserInfo): string {
    if (browserInfo.isChrome) return 'Chrome';
    if (browserInfo.isFirefox) return 'Firefox';
    if (browserInfo.isSafari) return 'Safari';
    if (browserInfo.isEdge) return 'Edge';
    return 'Unknown Browser';
  }

  private static getDefaultContext(): PWAErrorContext {
    return {
      component: 'InstallPrompt',
      source: 'unknown',
      placement: 'unknown',
      userAgent: navigator.userAgent,
      browserInfo: this.getBrowserInfo(),
      installState: 'unknown'
    };
  }

  /**
   * Get error statistics for debugging
   */
  static getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: PWAError[];
    browserIssues: Record<string, number>;
  } {
    const errorsByType: Record<string, number> = {};
    const browserIssues: Record<string, number> = {};

    this.errorLog.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      const browserName = this.getBrowserName(error.context.browserInfo);
      browserIssues[browserName] = (browserIssues[browserName] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      recentErrors: this.errorLog.slice(0, 10),
      browserIssues
    };
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Export types and utilities
export { PWAErrorHandler as default };