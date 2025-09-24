/**
 * Security Configuration
 * Centralized security settings and utilities
 */

import { config, logger } from './environment';

export interface SecurityConfig {
  csp: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    mediaSrc: string[];
    objectSrc: string[];
    frameSrc: string[];
  };
  headers: {
    xFrameOptions: string;
    xContentTypeOptions: string;
    xXSSProtection: string;
    referrerPolicy: string;
    permissionsPolicy: string;
  };
  validation: {
    maxInputLength: number;
    allowedFileTypes: string[];
    maxFileSize: number;
  };
}

/**
 * Get security configuration
 */
export const getSecurityConfig = (): SecurityConfig => {
  return {
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "'unsafe-eval'", // Required for development tools
        'https://firebase.googleapis.com',
        'https://www.gstatic.com',
        'https://zoom.us',
        'https://source.zoom.us',
        'https://fcm.googleapis.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for dynamic styles
        'https://fonts.googleapis.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://firebasestorage.googleapis.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
      ],
      connectSrc: [
        "'self'",
        'https://firebase.googleapis.com',
        'https://firestore.googleapis.com',
        'https://api.zoom.us',
        'https://zoom.us',
        'wss://zoom.us',
        'https://fcm.googleapis.com',
        'https://www.google-analytics.com',
        'https://analytics.google.com',
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      mediaSrc: [
        "'self'",
        'blob:',
        'https://firebasestorage.googleapis.com',
        'https://zoom.us',
      ],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
    headers: {
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      xXSSProtection: '1; mode=block',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy:
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
    },
    validation: {
      maxInputLength: 10000,
      allowedFileTypes: [
        '.pdf',
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.mp4',
        '.webm',
      ],
      maxFileSize: 50 * 1024 * 1024, // 50MB
    },
  };
};

/**
 * Input sanitization utilities
 */
export class SecurityUtils {
  /**
   * Sanitize HTML input to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Validate input length
   */
  static validateInputLength(input: string, maxLength?: number): boolean {
    const limit = maxLength || getSecurityConfig().validation.maxInputLength;
    return input.length <= limit;
  }

  /**
   * Validate file type
   */
  static validateFileType(fileName: string): boolean {
    const allowedTypes = getSecurityConfig().validation.allowedFileTypes;
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf('.'));
    return allowedTypes.includes(extension);
  }

  /**
   * Validate file size
   */
  static validateFileSize(fileSize: number): boolean {
    const maxSize = getSecurityConfig().validation.maxFileSize;
    return fileSize <= maxSize;
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  /**
   * Validate URL to prevent open redirect
   */
  static validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);

      // Only allow HTTPS in production
      if (config.APP_ENV === 'production' && parsedUrl.protocol !== 'https:') {
        return false;
      }

      // Check against allowed domains
      const allowedDomains = [
        'firebase.googleapis.com',
        'firestore.googleapis.com',
        'firebasestorage.googleapis.com',
        'zoom.us',
        'api.zoom.us',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'www.google-analytics.com',
        'analytics.google.com',
      ];

      // Allow same origin
      if (parsedUrl.origin === window.location.origin) {
        return true;
      }

      // Check if domain is in allowed list
      return allowedDomains.some(
        domain =>
          parsedUrl.hostname === domain ||
          parsedUrl.hostname.endsWith('.' + domain)
      );
    } catch (error) {
      logger.error('Invalid URL:', error);
      return false;
    }
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Indian phone number format: +91XXXXXXXXXX or 91XXXXXXXXXX or XXXXXXXXXX
    const indianPhoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');
    return indianPhoneRegex.test(cleanNumber);
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Rate limiting utility
   */
  static createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const record = attempts.get(identifier);

      if (!record || now > record.resetTime) {
        attempts.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (record.count >= maxAttempts) {
        return false;
      }

      record.count++;
      return true;
    };
  }

  /**
   * Secure storage utilities
   */
  static secureStorage = {
    /**
     * Store sensitive data with encryption (basic implementation)
     */
    setItem(key: string, value: string): void {
      try {
        // In a real implementation, you would use proper encryption
        const encoded = btoa(value);
        localStorage.setItem(`secure_${key}`, encoded);
      } catch (error) {
        logger.error('Failed to store secure item:', error);
      }
    },

    /**
     * Retrieve sensitive data with decryption
     */
    getItem(key: string): string | null {
      try {
        const encoded = localStorage.getItem(`secure_${key}`);
        return encoded ? atob(encoded) : null;
      } catch (error) {
        logger.error('Failed to retrieve secure item:', error);
        return null;
      }
    },

    /**
     * Remove sensitive data
     */
    removeItem(key: string): void {
      localStorage.removeItem(`secure_${key}`);
    },

    /**
     * Clear all secure storage
     */
    clear(): void {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('secure_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    },
  };

  /**
   * Content Security Policy violation handler
   */
  static handleCSPViolation(event: SecurityPolicyViolationEvent): void {
    logger.error('CSP Violation:', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
    });

    // Report to analytics if enabled
    if (config.security.enableErrorReporting) {
      // This would send the violation to your monitoring service
      console.error('CSP Violation reported');
    }
  }

  /**
   * Initialize security event listeners
   */
  static initializeSecurityListeners(): void {
    // Listen for CSP violations
    document.addEventListener(
      'securitypolicyviolation',
      this.handleCSPViolation
    );

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      logger.error('Unhandled promise rejection:', event.reason);
    });

    // Listen for global errors
    window.addEventListener('error', event => {
      logger.error('Global error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });
  }
}

/**
 * Initialize security configuration
 */
export const initializeSecurity = (): void => {
  try {
    // Initialize security event listeners
    SecurityUtils.initializeSecurityListeners();

    // Set up rate limiters for common actions
    const loginRateLimit = SecurityUtils.createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
    const apiRateLimit = SecurityUtils.createRateLimiter(100, 60 * 1000); // 100 requests per minute

    // Store rate limiters globally for use in components
    (window as any).__rateLimiters = {
      login: loginRateLimit,
      api: apiRateLimit,
    };

    logger.log('Security configuration initialized');
  } catch (error) {
    logger.error('Failed to initialize security configuration:', error);
  }
};

// Export security configuration
export const securityConfig = getSecurityConfig();
