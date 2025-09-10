/**
 * Environment Configuration
 * Centralized configuration management for different environments
 */

export interface EnvironmentConfig {
  NODE_ENV: string;
  APP_ENV: string;
  APP_VERSION: string;
  
  // Firebase Configuration
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  
  // Zoom Configuration
  zoom: {
    enabled: boolean;
    apiKey?: string;
    apiSecret?: string;
    accountId?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUrl?: string;
  };
  
  // Analytics Configuration
  analytics: {
    enabled: boolean;
    measurementId?: string;
  };
  
  // Security Configuration
  security: {
    enableConsoleLogs: boolean;
    enableErrorReporting: boolean;
    sentryDsn?: string;
  };
  
  // Performance Configuration
  performance: {
    enableMonitoring: boolean;
    sampleRate: number;
  };
  
  // Feature Flags
  features: {
    offlineMode: boolean;
    pushNotifications: boolean;
    whatsappIntegration: boolean;
  };
  
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
  };
  
  // WhatsApp Configuration
  whatsapp: {
    enabled: boolean;
    teacherNumber: string;
  };
}

/**
 * Get environment configuration based on current environment
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const config: EnvironmentConfig = {
    NODE_ENV: import.meta.env.NODE_ENV || 'development',
    APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    },
    
    zoom: {
      enabled: import.meta.env.VITE_ZOOM_ENABLED === 'true',
      apiKey: import.meta.env.VITE_ZOOM_API_KEY,
      apiSecret: import.meta.env.VITE_ZOOM_API_SECRET,
      accountId: import.meta.env.VITE_ZOOM_ACCOUNT_ID,
      clientId: import.meta.env.VITE_ZOOM_CLIENT_ID,
      clientSecret: import.meta.env.VITE_ZOOM_CLIENT_SECRET,
      redirectUrl: import.meta.env.VITE_ZOOM_REDIRECT_URL,
    },
    
    analytics: {
      enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
      measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
    },
    
    security: {
      enableConsoleLogs: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
      enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    },
    
    performance: {
      enableMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
      sampleRate: parseFloat(import.meta.env.VITE_PERFORMANCE_SAMPLE_RATE || '0.1'),
    },
    
    features: {
      offlineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE !== 'false',
      pushNotifications: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS !== 'false',
      whatsappIntegration: import.meta.env.VITE_ENABLE_WHATSAPP_INTEGRATION !== 'false',
    },
    
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
    },
    
    whatsapp: {
      enabled: import.meta.env.VITE_WHATSAPP_ENABLED !== 'false',
      teacherNumber: import.meta.env.VITE_WHATSAPP_TEACHER_NUMBER || '+919876543210',
    },
  };
  
  // Validate required configuration in production
  if (config.APP_ENV === 'production') {
    validateProductionConfig(config);
  }
  
  return config;
};

/**
 * Validate required configuration for production environment
 */
const validateProductionConfig = (config: EnvironmentConfig): void => {
  const requiredFields = [
    'firebase.apiKey',
    'firebase.authDomain',
    'firebase.projectId',
    'firebase.storageBucket',
    'firebase.messagingSenderId',
    'firebase.appId',
  ];
  
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    const value = getNestedValue(config, field);
    if (!value) {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    const errorMessage = `Missing required production configuration: ${missingFields.join(', ')}`;
    console.error(errorMessage);
    
    if (config.security.enableErrorReporting) {
      // Report configuration error to monitoring service
      reportConfigurationError(errorMessage);
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Get nested object value by dot notation path
 */
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Report configuration errors to monitoring service
 */
const reportConfigurationError = (error: string): void => {
  // This would integrate with your error reporting service (Sentry, etc.)
  console.error('Configuration Error:', error);
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return getEnvironmentConfig().APP_ENV === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return getEnvironmentConfig().APP_ENV === 'production';
};

/**
 * Check if running in staging mode
 */
export const isStaging = (): boolean => {
  return getEnvironmentConfig().APP_ENV === 'staging';
};

/**
 * Get current environment name
 */
export const getEnvironmentName = (): string => {
  return getEnvironmentConfig().APP_ENV;
};

/**
 * Custom console logger that respects environment settings
 */
export const logger = {
  log: (...args: any[]) => {
    if (getEnvironmentConfig().security.enableConsoleLogs) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (getEnvironmentConfig().security.enableConsoleLogs) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors, but respect error reporting settings
    console.error(...args);
    
    if (getEnvironmentConfig().security.enableErrorReporting) {
      // Report to error monitoring service
      reportError(args);
    }
  },
  debug: (...args: any[]) => {
    if (getEnvironmentConfig().security.enableConsoleLogs && isDevelopment()) {
      console.debug(...args);
    }
  },
};

/**
 * Report errors to monitoring service
 */
const reportError = (args: any[]): void => {
  // This would integrate with your error reporting service (Sentry, etc.)
  console.error('Error reported:', args);
};

// Export the configuration instance
export const config = getEnvironmentConfig();