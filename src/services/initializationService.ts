import { FirebaseService } from './firebaseService';
import { NetworkService } from './networkService';
import { isFirebaseConfigured } from '../config/firebase';

export interface InitializationStatus {
  firebase: boolean;
  network: boolean;
  offlinePersistence: boolean;
  error?: string;
}

export class InitializationService {
  private static initialized = false;
  private static status: InitializationStatus = {
    firebase: false,
    network: false,
    offlinePersistence: false,
  };

  /**
   * Initialize all services required for the application
   */
  static async initialize(): Promise<InitializationStatus> {
    if (this.initialized) {
      return this.status;
    }

    try {
      console.warn('🚀 Initializing Parents Madrasa Portal services...');

      // Initialize network monitoring first
      await this.initializeNetworkService();

      // Initialize Firebase services if configured
      if (isFirebaseConfigured()) {
        await this.initializeFirebaseServices();
      } else {
        console.warn('⚠️ Firebase not configured - using mock data mode');
        this.status.firebase = false;
      }

      this.initialized = true;
      console.warn('✅ All services initialized successfully');

      return this.status;
    } catch (error) {
      let errorMessage =
        error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('❌ Service initialization failed:', errorMessage);

      this.status.error = errorMessage;
      return this.status;
    }
  }

  /**
   * Initialize network monitoring service
   */
  private static async initializeNetworkService(): Promise<void> {
    try {
      NetworkService.initialize();
      this.status.network = true;
      console.warn('📡 Network service initialized');
    } catch (error) {
      console.error('Failed to initialize network service:', error);
      throw error;
    }
  }

  /**
   * Initialize Firebase services
   */
  private static async initializeFirebaseServices(): Promise<void> {
    try {
      // Initialize offline persistence
      await FirebaseService.initializeOfflinePersistence();
      this.status.offlinePersistence = true;
      console.warn('💾 Firebase offline persistence initialized');

      this.status.firebase = true;
      console.warn('🔥 Firebase services initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase services:', error);
      // Don't throw here - app can still work with mock data
      this.status.firebase = false;
      this.status.offlinePersistence = false;
    }
  }

  /**
   * Get current initialization status
   */
  static getStatus(): InitializationStatus {
    return { ...this.status };
  }

  /**
   * Check if services are ready
   */
  static isReady(): boolean {
    return this.initialized && this.status.network;
  }

  /**
   * Check if Firebase is available
   */
  static isFirebaseAvailable(): boolean {
    return this.status.firebase;
  }

  /**
   * Cleanup all services
   */
  static cleanup(): void {
    try {
      NetworkService.cleanup();
      this.initialized = false;
      this.status = {
        firebase: false,
        network: false,
        offlinePersistence: false,
      };
      console.warn('🧹 Services cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Reinitialize services (useful for error recovery)
   */
  static async reinitialize(): Promise<InitializationStatus> {
    this.cleanup();
    return this.initialize();
  }
}
