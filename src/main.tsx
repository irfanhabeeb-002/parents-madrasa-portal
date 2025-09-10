import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeFirebase } from './config/firebaseInit';
import { analyticsService } from './services/AnalyticsService';
import { performanceService } from './services/PerformanceService';
import { config, logger } from './config/environment';
import { initializeSecurity } from './config/security';

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
