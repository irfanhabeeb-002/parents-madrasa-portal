import { ApiResponse } from '../types/common';
import { StorageService } from './storageService';

// Sync queue item interface
interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: Date;
  pendingOperations: number;
  failedOperations: number;
}

/**
 * Data Synchronization Service for offline/online sync and backup
 */
export class DataSyncService {
  private static readonly SYNC_QUEUE_KEY = 'sync_queue';
  private static readonly SYNC_STATUS_KEY = 'sync_status';
  private static readonly LAST_SYNC_KEY = 'last_sync_timestamp';

  // Check online status
  static isOnline(): boolean {
    return navigator.onLine;
  }

  // Get sync status
  static getSyncStatus(): SyncStatus {
    const status = StorageService.get<SyncStatus>(this.SYNC_STATUS_KEY);
    const queue = StorageService.getArray<SyncQueueItem>(this.SYNC_QUEUE_KEY);
    const lastSync = StorageService.get<Date>(this.LAST_SYNC_KEY);

    return {
      isOnline: this.isOnline(),
      isSyncing: status?.isSyncing || false,
      lastSyncAt: lastSync || undefined,
      pendingOperations: queue.length,
      failedOperations: queue.filter(item => item.retryCount >= item.maxRetries)
        .length,
    };
  }

  // Add operation to sync queue
  static async queueOperation(
    operation: 'create' | 'update' | 'delete',
    collection: string,
    data: any,
    maxRetries: number = 3
  ): Promise<ApiResponse<boolean>> {
    try {
      const queueItem: SyncQueueItem = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation,
        collection,
        data,
        timestamp: new Date(),
        retryCount: 0,
        maxRetries,
      };

      const success = StorageService.appendToArray(
        this.SYNC_QUEUE_KEY,
        queueItem
      );

      if (success && this.isOnline()) {
        // Try to sync immediately if online
        this.processSyncQueue();
      }

      return {
        data: success,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to queue operation',
        timestamp: new Date(),
      };
    }
  }

  // Process sync queue
  static async processSyncQueue(): Promise<
    ApiResponse<{ processed: number; failed: number }>
  > {
    try {
      if (!this.isOnline()) {
        return {
          data: { processed: 0, failed: 0 },
          success: false,
          error: 'Device is offline',
          timestamp: new Date(),
        };
      }

      // Update sync status
      StorageService.set(this.SYNC_STATUS_KEY, {
        ...this.getSyncStatus(),
        isSyncing: true,
      });

      const queue = StorageService.getArray<SyncQueueItem>(this.SYNC_QUEUE_KEY);
      const processed = 0;
      const failed = 0;
      const remainingQueue: SyncQueueItem[] = [];

      for (const item of queue) {
        try {
          // Simulate API call (in real implementation, this would call actual API)
          await this.simulateApiCall(item);
          processed++;
        } catch (error) {
          item.retryCount++;
          if (item.retryCount < item.maxRetries) {
            remainingQueue.push(item);
          } else {
            failed++;
            console.error(
              `Failed to sync operation after ${item.maxRetries} retries:`,
              item,
              error
            );
          }
        }
      }

      // Update queue with remaining items
      StorageService.setArray(this.SYNC_QUEUE_KEY, remainingQueue);

      // Update sync status
      StorageService.set(this.SYNC_STATUS_KEY, {
        ...this.getSyncStatus(),
        isSyncing: false,
      });

      if (processed > 0) {
        StorageService.set(this.LAST_SYNC_KEY, new Date());
      }

      return {
        data: { processed, failed },
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      // Update sync status
      StorageService.set(this.SYNC_STATUS_KEY, {
        ...this.getSyncStatus(),
        isSyncing: false,
      });

      return {
        data: { processed: 0, failed: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        timestamp: new Date(),
      };
    }
  }

  // Simulate API call (replace with actual API calls in production)
  private static async simulateApiCall(item: SyncQueueItem): Promise<void> {
    // Simulate network delay
    await new Promise(resolve =>
      setTimeout(resolve, 100 + Math.random() * 200)
    );

    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      // 10% failure rate
      throw new Error('Simulated API failure');
    }

    console.warn(
      `Synced ${item.operation} operation for ${item.collection}:`,
      item.data
    );
  }

  // Clear sync queue
  static clearSyncQueue(): ApiResponse<boolean> {
    try {
      StorageService.setArray(this.SYNC_QUEUE_KEY, []);
      return {
        data: true,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to clear sync queue',
        timestamp: new Date(),
      };
    }
  }

  // Get failed operations
  static getFailedOperations(): SyncQueueItem[] {
    const queue = StorageService.getArray<SyncQueueItem>(this.SYNC_QUEUE_KEY);
    return queue.filter(item => item.retryCount >= item.maxRetries);
  }

  // Retry failed operations
  static async retryFailedOperations(): Promise<ApiResponse<boolean>> {
    try {
      const queue = StorageService.getArray<SyncQueueItem>(this.SYNC_QUEUE_KEY);
      const updatedQueue = queue.map(item => {
        if (item.retryCount >= item.maxRetries) {
          return { ...item, retryCount: 0 }; // Reset retry count
        }
        return item;
      });

      StorageService.setArray(this.SYNC_QUEUE_KEY, updatedQueue);

      if (this.isOnline()) {
        this.processSyncQueue();
      }

      return {
        data: true,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to retry operations',
        timestamp: new Date(),
      };
    }
  }

  // Setup online/offline event listeners
  static setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.warn('Device came online, processing sync queue...');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      console.warn(
        'Device went offline, operations will be queued for later sync'
      );
    });
  }

  // Force sync all data (full sync)
  static async forceSyncAll(): Promise<ApiResponse<boolean>> {
    try {
      if (!this.isOnline()) {
        return {
          data: false,
          success: false,
          error: 'Device is offline',
          timestamp: new Date(),
        };
      }

      // In a real implementation, this would:
      // 1. Fetch latest data from server
      // 2. Compare with local data
      // 3. Resolve conflicts
      // 4. Update local storage
      // 5. Push local changes to server

      console.warn('Force sync all data - simulated');

      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      StorageService.set(this.LAST_SYNC_KEY, new Date());

      return {
        data: true,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Force sync failed',
        timestamp: new Date(),
      };
    }
  }

  // Get sync statistics
  static getSyncStats(): {
    totalOperations: number;
    pendingOperations: number;
    failedOperations: number;
    lastSyncAge: number | null; // in milliseconds
    isOnline: boolean;
  } {
    const queue = StorageService.getArray<SyncQueueItem>(this.SYNC_QUEUE_KEY);
    const lastSync = StorageService.get<Date>(this.LAST_SYNC_KEY);

    return {
      totalOperations: queue.length,
      pendingOperations: queue.filter(item => item.retryCount < item.maxRetries)
        .length,
      failedOperations: queue.filter(item => item.retryCount >= item.maxRetries)
        .length,
      lastSyncAge: lastSync ? Date.now() - new Date(lastSync).getTime() : null,
      isOnline: this.isOnline(),
    };
  }
}
