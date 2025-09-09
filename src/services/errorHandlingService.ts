import { FirebaseError } from '../types/firebase';

export interface ErrorContext {
  service: string;
  operation: string;
  userId?: string;
  timestamp: Date;
  networkStatus?: boolean;
  retryCount?: number;
}

export interface ErrorHandlingOptions {
  showToUser?: boolean;
  logToConsole?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export class ErrorHandlingService {
  private static errorLog: Array<{ context: ErrorContext; error: Error }> = [];
  private static maxLogSize = 100;

  /**
   * Handle and process errors with context
   */
  static handleError(
    error: Error | FirebaseError,
    context: ErrorContext,
    options: ErrorHandlingOptions = {}
  ): void {
    const {
      showToUser = true,
      logToConsole = true,
      retryable = false,
      maxRetries = 3,
      retryDelay = 1000
    } = options;

    // Log error
    if (logToConsole) {
      console.error(`[${context.service}] ${context.operation} failed:`, error);
    }

    // Add to error log
    this.addToErrorLog(error, context);

    // Handle Firebase-specific errors
    if (this.isFirebaseError(error)) {
      this.handleFirebaseError(error, context, options);
    } else {
      this.handleGenericError(error, context, options);
    }
  }

  /**
   * Handle Firebase-specific errors
   */
  private static handleFirebaseError(
    error: FirebaseError,
    context: ErrorContext,
    options: ErrorHandlingOptions
  ): void {
    // Check if error is retryable
    if (error.retryable && options.retryable) {
      const retryCount = context.retryCount || 0;
      if (retryCount < (options.maxRetries || 3)) {
        console.log(`Retrying ${context.operation} (attempt ${retryCount + 1})`);
        // Retry logic would be implemented by the calling service
        return;
      }
    }

    // Show user-friendly error message
    if (options.showToUser) {
      this.showUserError(error.message, error.malayalamMessage);
    }
  }

  /**
   * Handle generic errors
   */
  private static handleGenericError(
    error: Error,
    context: ErrorContext,
    options: ErrorHandlingOptions
  ): void {
    const userMessage = this.getUserFriendlyMessage(error, context);
    
    if (options.showToUser) {
      this.showUserError(userMessage);
    }
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(error: Error, context: ErrorContext): string {
    // Network-related errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return context.networkStatus === false 
        ? 'You appear to be offline. Please check your internet connection.'
        : 'Network error occurred. Please try again.';
    }

    // Service-specific messages
    switch (context.service) {
      case 'ClassService':
        return 'Unable to load class information. Please try again.';
      case 'RecordingService':
        return 'Unable to load recordings. Please try again.';
      case 'NoteService':
        return 'Unable to load notes. Please try again.';
      case 'ExerciseService':
        return 'Unable to load exercises. Please try again.';
      case 'AttendanceService':
        return 'Unable to load attendance data. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Show error to user (this would integrate with your UI notification system)
   */
  private static showUserError(message: string, malayalamMessage?: string): void {
    // This would integrate with your AlertBanner or notification system
    console.warn('User Error:', message);
    if (malayalamMessage) {
      console.warn('Malayalam:', malayalamMessage);
    }
    
    // In a real implementation, you would dispatch to your notification system
    // Example: NotificationService.showError(message, malayalamMessage);
  }

  /**
   * Add error to internal log
   */
  private static addToErrorLog(error: Error, context: ErrorContext): void {
    this.errorLog.unshift({ error, context });
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  /**
   * Check if error is a Firebase error
   */
  private static isFirebaseError(error: any): error is FirebaseError {
    return error && typeof error.code === 'string' && typeof error.retryable === 'boolean';
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    totalErrors: number;
    recentErrors: number;
    commonErrors: Array<{ message: string; count: number }>;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = this.errorLog.filter(
      entry => entry.context.timestamp >= oneHourAgo
    );

    // Count common error messages
    const errorCounts: Record<string, number> = {};
    this.errorLog.forEach(entry => {
      const message = entry.error.message;
      errorCounts[message] = (errorCounts[message] || 0) + 1;
    });

    const commonErrors = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorLog.length,
      recentErrors: recentErrors.length,
      commonErrors
    };
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Export error log for debugging
   */
  static exportErrorLog(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        const retryContext = { ...context, retryCount: attempt };
        
        if (attempt === maxRetries - 1) {
          // Last attempt failed
          this.handleError(lastError, retryContext, { 
            retryable: false,
            showToUser: true 
          });
          throw lastError;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        
        this.handleError(lastError, retryContext, { 
          retryable: true,
          showToUser: false,
          logToConsole: true 
        });
        
        console.log(`Retrying operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}