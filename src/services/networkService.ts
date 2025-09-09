import { FirebaseService } from './firebaseService';

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
}

export class NetworkService {
  private static listeners: ((status: NetworkStatus) => void)[] = [];
  private static currentStatus: NetworkStatus = {
    isOnline: navigator.onLine
  };

  /**
   * Initialize network monitoring
   */
  static initialize(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for connection changes if supported
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
      
      // Update initial connection info
      this.currentStatus.connectionType = connection.type;
      this.currentStatus.effectiveType = connection.effectiveType;
    }

    // Initial Firebase state setup
    this.updateFirebaseNetworkState();
  }

  /**
   * Get current network status
   */
  static getNetworkStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Subscribe to network status changes
   */
  static subscribe(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current status
    callback(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Handle online event
   */
  private static handleOnline(): void {
    this.currentStatus.isOnline = true;
    this.notifyListeners();
    this.updateFirebaseNetworkState();
  }

  /**
   * Handle offline event
   */
  private static handleOffline(): void {
    this.currentStatus.isOnline = false;
    this.notifyListeners();
    this.updateFirebaseNetworkState();
  }

  /**
   * Handle connection change
   */
  private static handleConnectionChange(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.currentStatus.connectionType = connection.type;
      this.currentStatus.effectiveType = connection.effectiveType;
      this.notifyListeners();
    }
  }

  /**
   * Notify all listeners of status change
   */
  private static notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Update Firebase network state based on connectivity
   */
  private static updateFirebaseNetworkState(): void {
    FirebaseService.handleNetworkStateChange(this.currentStatus.isOnline)
      .catch(error => {
        console.error('Failed to update Firebase network state:', error);
      });
  }

  /**
   * Check if connection is slow (2G or slower)
   */
  static isSlowConnection(): boolean {
    const effectiveType = this.currentStatus.effectiveType;
    return effectiveType === 'slow-2g' || effectiveType === '2g';
  }

  /**
   * Check if connection is fast (4G or better)
   */
  static isFastConnection(): boolean {
    const effectiveType = this.currentStatus.effectiveType;
    return effectiveType === '4g' || !effectiveType; // Assume fast if unknown
  }

  /**
   * Cleanup event listeners
   */
  static cleanup(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.removeEventListener('change', this.handleConnectionChange.bind(this));
    }
    
    this.listeners = [];
  }
}