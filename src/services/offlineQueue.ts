// Offline Queue Service for handling form submissions when offline

interface QueueItem {
  id: string;
  type:
    | 'attendance'
    | 'exam-result'
    | 'exercise-result'
    | 'notification-preference';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
}

interface QueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  maxAge?: number; // Maximum age in milliseconds
}

class OfflineQueueService {
  private readonly QUEUE_KEY = 'offline-queue';
  private readonly MAX_QUEUE_SIZE = 100;
  private isProcessing = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // Add item to offline queue
  async addToQueue(
    type: QueueItem['type'],
    data: any,
    url: string,
    method: QueueItem['method'] = 'POST',
    options: QueueOptions = {}
  ): Promise<string> {
    const item: QueueItem = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      url,
      method,
    };

    const queue = this.getQueue();

    // Remove oldest items if queue is full
    if (queue.length >= this.MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - this.MAX_QUEUE_SIZE + 1);
    }

    queue.push(item);
    this.saveQueue(queue);

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return item.id;
  }

  // Get current queue
  getQueue(): QueueItem[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY);
      if (!stored) {
        return [];
      }

      const queue: QueueItem[] = JSON.parse(stored);

      // Remove expired items
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      return queue.filter(item => now - item.timestamp < maxAge);
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  // Save queue to localStorage
  private saveQueue(queue: QueueItem[]): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  // Process queue items
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    const queue = this.getQueue();
    const processedIds: string[] = [];

    for (const item of queue) {
      try {
        const success = await this.processItem(item);
        if (success) {
          processedIds.push(item.id);
          this.clearRetryTimeout(item.id);
        } else {
          // Schedule retry if not exceeded max retries
          if (item.retryCount < item.maxRetries) {
            this.scheduleRetry(item);
          } else {
            // Remove item if max retries exceeded
            processedIds.push(item.id);
            console.warn(`Max retries exceeded for queue item ${item.id}`);
          }
        }
      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error);

        // Increment retry count
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          processedIds.push(item.id);
        } else {
          this.scheduleRetry(item);
        }
      }
    }

    // Remove processed items from queue
    if (processedIds.length > 0) {
      const updatedQueue = queue.filter(
        item => !processedIds.includes(item.id)
      );
      this.saveQueue(updatedQueue);
    }

    this.isProcessing = false;
  }

  // Process individual queue item
  private async processItem(item: QueueItem): Promise<boolean> {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data),
      });

      if (response.ok) {
        console.warn(
          `Successfully processed queue item ${item.id} (${item.type})`
        );

        // Dispatch success event
        this.dispatchQueueEvent('item-processed', {
          id: item.id,
          type: item.type,
          success: true,
        });

        return true;
      } else {
        console.warn(
          `Failed to process queue item ${item.id}: ${response.status}`
        );
        return false;
      }
    } catch (error) {
      console.error(`Network error processing queue item ${item.id}:`, error);
      return false;
    }
  }

  // Schedule retry for failed item
  private scheduleRetry(item: QueueItem): void {
    const delay = Math.min(1000 * Math.pow(2, item.retryCount), 30000); // Exponential backoff, max 30s

    this.clearRetryTimeout(item.id);

    const timeout = setTimeout(() => {
      item.retryCount++;
      this.processQueue();
    }, delay);

    this.retryTimeouts.set(item.id, timeout);
  }

  // Clear retry timeout
  private clearRetryTimeout(id: string): void {
    const timeout = this.retryTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(id);
    }
  }

  // Remove specific item from queue
  removeFromQueue(id: string): void {
    const queue = this.getQueue();
    const updatedQueue = queue.filter(item => item.id !== id);
    this.saveQueue(updatedQueue);
    this.clearRetryTimeout(id);
  }

  // Clear entire queue
  clearQueue(): void {
    localStorage.removeItem(this.QUEUE_KEY);
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }

  // Get queue statistics
  getQueueStats(): {
    totalItems: number;
    itemsByType: Record<string, number>;
    oldestItem: number | null;
    failedItems: number;
  } {
    const queue = this.getQueue();
    const stats = {
      totalItems: queue.length,
      itemsByType: {} as Record<string, number>,
      oldestItem: null as number | null,
      failedItems: 0,
    };

    queue.forEach(item => {
      // Count by type
      stats.itemsByType[item.type] = (stats.itemsByType[item.type] || 0) + 1;

      // Track oldest item
      if (!stats.oldestItem || item.timestamp < stats.oldestItem) {
        stats.oldestItem = item.timestamp;
      }

      // Count failed items
      if (item.retryCount > 0) {
        stats.failedItems++;
      }
    });

    return stats;
  }

  // Initialize service (call on app start)
  initialize(): void {
    // Process queue when coming online
    window.addEventListener('online', () => {
      console.warn('Back online, processing queue...');
      this.processQueue();
    });

    // Process queue on page load if online
    if (navigator.onLine) {
      // Small delay to allow other services to initialize
      setTimeout(() => {
        this.processQueue();
      }, 1000);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Dispatch custom events for queue operations
  private dispatchQueueEvent(type: string, detail: any): void {
    window.dispatchEvent(new CustomEvent(`offline-queue-${type}`, { detail }));
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueueService();

// Convenience functions for common operations
export const queueAttendance = (attendanceData: any) => {
  return offlineQueue.addToQueue(
    'attendance',
    attendanceData,
    '/api/attendance',
    'POST'
  );
};

export const queueExamResult = (examData: any) => {
  return offlineQueue.addToQueue(
    'exam-result',
    examData,
    '/api/exam-results',
    'POST'
  );
};

export const queueExerciseResult = (exerciseData: any) => {
  return offlineQueue.addToQueue(
    'exercise-result',
    exerciseData,
    '/api/exercise-results',
    'POST'
  );
};

export const queueNotificationPreference = (preferenceData: any) => {
  return offlineQueue.addToQueue(
    'notification-preference',
    preferenceData,
    '/api/user/preferences',
    'PUT'
  );
};

// Hook for using offline queue in React components
export const useOfflineQueue = () => {
  const [queueStats, setQueueStats] = React.useState(
    offlineQueue.getQueueStats()
  );
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const updateStats = () => {
      setQueueStats(offlineQueue.getQueueStats());
    };

    const handleOnline = () => {
      setIsOnline(true);
      updateStats();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleItemProcessed = () => {
      updateStats();
    };

    // Update stats periodically
    const interval = setInterval(updateStats, 5000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(
      'offline-queue-item-processed',
      handleItemProcessed
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'offline-queue-item-processed',
        handleItemProcessed
      );
    };
  }, []);

  return {
    queueStats,
    isOnline,
    addToQueue: offlineQueue.addToQueue.bind(offlineQueue),
    processQueue: offlineQueue.processQueue.bind(offlineQueue),
    clearQueue: offlineQueue.clearQueue.bind(offlineQueue),
  };
};

// Import React for the hook
import React from 'react';
