// Background Sync Service for PWA
// This service handles background synchronization of data when the app comes back online

interface SyncData {
  type: 'attendance' | 'exam-result' | 'exercise-result' | 'notification-preference';
  data: any;
  timestamp: number;
  userId: string;
}

class BackgroundSyncService {
  private readonly SYNC_TAG_PREFIX = 'madrasa-portal-sync';
  private readonly SYNC_STORAGE_KEY = 'background-sync-data';

  // Register background sync
  async registerSync(type: SyncData['type'], data: any, userId: string): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Store data for sync
      const syncData: SyncData = {
        type,
        data,
        timestamp: Date.now(),
        userId,
      };
      
      await this.storeSyncData(syncData);
      
      // Register sync event
      const syncTag = `${this.SYNC_TAG_PREFIX}-${type}-${Date.now()}`;
      await registration.sync.register(syncTag);
      
      console.log(`Background sync registered: ${syncTag}`);
    } catch (error) {
      console.error('Failed to register background sync:', error);
      throw error;
    }
  }

  // Store sync data in IndexedDB
  private async storeSyncData(syncData: SyncData): Promise<void> {
    try {
      // Use IndexedDB for more reliable storage
      const db = await this.openDatabase();
      const transaction = db.transaction(['syncData'], 'readwrite');
      const store = transaction.objectStore('syncData');
      
      await store.add({
        ...syncData,
        id: `${syncData.type}-${syncData.timestamp}`,
      });
      
      await transaction.complete;
    } catch (error) {
      console.error('Failed to store sync data:', error);
      // Fallback to localStorage
      this.storeSyncDataInLocalStorage(syncData);
    }
  }

  // Fallback storage method
  private storeSyncDataInLocalStorage(syncData: SyncData): void {
    try {
      const stored = localStorage.getItem(this.SYNC_STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : [];
      data.push(syncData);
      localStorage.setItem(this.SYNC_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store sync data in localStorage:', error);
    }
  }

  // Open IndexedDB database
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MadrasaPortalDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for sync data
        if (!db.objectStoreNames.contains('syncData')) {
          const store = db.createObjectStore('syncData', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }

  // Get pending sync data
  async getPendingSyncData(): Promise<SyncData[]> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['syncData'], 'readonly');
      const store = transaction.objectStore('syncData');
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get sync data from IndexedDB:', error);
      // Fallback to localStorage
      return this.getSyncDataFromLocalStorage();
    }
  }

  // Fallback method to get sync data
  private getSyncDataFromLocalStorage(): SyncData[] {
    try {
      const stored = localStorage.getItem(this.SYNC_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get sync data from localStorage:', error);
      return [];
    }
  }

  // Remove synced data
  async removeSyncData(id: string): Promise<void> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['syncData'], 'readwrite');
      const store = transaction.objectStore('syncData');
      await store.delete(id);
      await transaction.complete;
    } catch (error) {
      console.error('Failed to remove sync data from IndexedDB:', error);
      // Fallback to localStorage
      this.removeSyncDataFromLocalStorage(id);
    }
  }

  // Fallback method to remove sync data
  private removeSyncDataFromLocalStorage(id: string): void {
    try {
      const stored = localStorage.getItem(this.SYNC_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const filtered = data.filter((item: SyncData & { id: string }) => item.id !== id);
        localStorage.setItem(this.SYNC_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Failed to remove sync data from localStorage:', error);
    }
  }

  // Process sync data (called by service worker)
  async processSyncData(syncData: SyncData): Promise<boolean> {
    try {
      const endpoint = this.getEndpointForType(syncData.type);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(syncData.data),
      });

      if (response.ok) {
        console.log(`Successfully synced ${syncData.type} data`);
        return true;
      } else {
        console.error(`Failed to sync ${syncData.type} data:`, response.status);
        return false;
      }
    } catch (error) {
      console.error(`Error syncing ${syncData.type} data:`, error);
      return false;
    }
  }

  // Get API endpoint for sync type
  private getEndpointForType(type: SyncData['type']): string {
    const endpoints = {
      'attendance': '/api/attendance',
      'exam-result': '/api/exam-results',
      'exercise-result': '/api/exercise-results',
      'notification-preference': '/api/user/preferences',
    };
    return endpoints[type];
  }

  // Get authentication token
  private async getAuthToken(): Promise<string> {
    // In a real implementation, this would get the token from your auth system
    // For now, return a placeholder
    return 'auth-token-placeholder';
  }

  // Check if background sync is supported
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    );
  }

  // Initialize background sync
  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Background sync not supported in this browser');
      return;
    }

    try {
      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered for background sync');
        
        // Listen for sync events
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SYNC_COMPLETE') {
            console.log('Background sync completed:', event.data.syncTag);
            // Dispatch custom event for UI updates
            window.dispatchEvent(new CustomEvent('background-sync-complete', {
              detail: event.data
            }));
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize background sync:', error);
    }
  }
}

// Create singleton instance
export const backgroundSync = new BackgroundSyncService();

// Convenience functions
export const syncAttendance = (attendanceData: any, userId: string) => {
  return backgroundSync.registerSync('attendance', attendanceData, userId);
};

export const syncExamResult = (examData: any, userId: string) => {
  return backgroundSync.registerSync('exam-result', examData, userId);
};

export const syncExerciseResult = (exerciseData: any, userId: string) => {
  return backgroundSync.registerSync('exercise-result', exerciseData, userId);
};

export const syncNotificationPreference = (preferenceData: any, userId: string) => {
  return backgroundSync.registerSync('notification-preference', preferenceData, userId);
};