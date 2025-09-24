import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeFirebase } from './config/firebaseInit';
import { analyticsService } from './services/AnalyticsService';
import { performanceService } from './services/PerformanceService';
import { logger } from './config/environment';
import { initializeSecurity } from './config/security';

// Service worker registration function that integrates with useServiceWorkerUpdate hook
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const { registerSW } = await import('virtual:pwa-register');

      const updateSW = registerSW({
        onNeedRefresh() {
          logger.log('Service worker update available');
          // Dispatch event for useServiceWorkerUpdate hook to handle
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        },
        onOfflineReady() {
          logger.log('Service worker registered and app ready for offline use');
          // Dispatch event for useServiceWorkerUpdate hook to handle
          window.dispatchEvent(new CustomEvent('sw-offline-ready'));
        },
        onRegistered(registration) {
          logger.log('Service worker registered successfully', registration);

          // Check for updates periodically (every 60 seconds)
          if (registration) {
            setInterval(() => {
              registration.update();
            }, 60000);
          }
        },
        onRegisterError(error) {
          logger.error('Service worker registration failed:', error);
          // Dispatch error event for useServiceWorkerUpdate hook to handle
          window.dispatchEvent(
            new CustomEvent('sw-registration-error', { detail: error })
          );
        },
      });

      // Store the update function globally for useServiceWorkerUpdate hook to access
      (window as any).updateServiceWorker = updateSW;

      logger.log('Service worker registration completed');
    } catch (error) {
      logger.error('Failed to register service worker:', error);
      // Dispatch error event for useServiceWorkerUpdate hook to handle
      window.dispatchEvent(
        new CustomEvent('sw-registration-error', { detail: error })
      );
    }
  } else {
    logger.warn('Service workers are not supported in this browser');
  }
};

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize security configuration first
    initializeSecurity();

    // Initialize Firebase with offline persistence
    await initializeFirebase();

    // Initialize analytics service
    await analyticsService.initialize();

    // Initialize performance monitoring
    performanceService.initialize();

    // Register service worker for PWA functionality using useServiceWorkerUpdate hook integration
    await registerServiceWorker();

    // Initialize session tracking for PWA install timing
    if (!sessionStorage.getItem('sessionStartTime')) {
      sessionStorage.setItem('sessionStartTime', Date.now().toString());
    }

    logger.log('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
  }
};

// Initialize services
initializeServices();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
