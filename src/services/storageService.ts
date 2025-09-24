import { CacheOptions } from '../types/common';

/**
 * StorageService provides a unified interface for data persistence
 * using localStorage with fallback to in-memory storage
 */
export class StorageService {
  private static memoryStorage: Map<string, any> = new Map();
  private static isLocalStorageAvailable = this.checkLocalStorageAvailability();

  // Check if localStorage is available
  private static checkLocalStorageAvailability(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn(
        'localStorage is not available, falling back to memory storage'
      );
      return false;
    }
  }

  // Generic get method
  static get<T>(key: string): T | null {
    try {
      if (this.isLocalStorageAvailable) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } else {
        return this.memoryStorage.get(key) || null;
      }
    } catch (error) {
      console.error(`Error getting item from storage: ${key}`, error);
      return null;
    }
  }

  // Generic set method
  static set<T>(key: string, value: T): boolean {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        this.memoryStorage.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Error setting item in storage: ${key}`, error);
      return false;
    }
  }

  // Remove item
  static remove(key: string): boolean {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.removeItem(key);
      } else {
        this.memoryStorage.delete(key);
      }
      return true;
    } catch (error) {
      console.error(`Error removing item from storage: ${key}`, error);
      return false;
    }
  }

  // Clear all storage
  static clear(): boolean {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.clear();
      } else {
        this.memoryStorage.clear();
      }
      return true;
    } catch (error) {
      console.error('Error clearing storage', error);
      return false;
    }
  }

  // Get array (returns empty array if not found)
  static getArray<T>(key: string): T[] {
    const data = this.get<T[]>(key);
    return Array.isArray(data) ? data : [];
  }

  // Set array
  static setArray<T>(key: string, array: T[]): boolean {
    return this.set(key, array);
  }

  // Append to array
  static appendToArray<T>(key: string, item: T): boolean {
    try {
      const currentArray = this.getArray<T>(key);
      currentArray.push(item);
      return this.setArray(key, currentArray);
    } catch (error) {
      console.error(`Error appending to array: ${key}`, error);
      return false;
    }
  }

  // Remove from array by predicate
  static removeFromArray<T>(
    key: string,
    predicate: (item: T) => boolean
  ): boolean {
    try {
      const currentArray = this.getArray<T>(key);
      const filteredArray = currentArray.filter(item => !predicate(item));
      return this.setArray(key, filteredArray);
    } catch (error) {
      console.error(`Error removing from array: ${key}`, error);
      return false;
    }
  }

  // Update item in array
  static updateInArray<T>(
    key: string,
    predicate: (item: T) => boolean,
    updater: (item: T) => T
  ): boolean {
    try {
      const currentArray = this.getArray<T>(key);
      const updatedArray = currentArray.map(item =>
        predicate(item) ? updater(item) : item
      );
      return this.setArray(key, updatedArray);
    } catch (error) {
      console.error(`Error updating array item: ${key}`, error);
      return false;
    }
  }

  // Get with cache options
  static getWithCache<T>(options: CacheOptions): T | null {
    const { key, ttl, forceRefresh } = options;

    if (forceRefresh) {
      return null;
    }

    const cachedData = this.get<{ data: T; timestamp: number }>(key);

    if (!cachedData) {
      return null;
    }

    // Check if cache is expired
    if (ttl && Date.now() - cachedData.timestamp > ttl) {
      this.remove(key);
      return null;
    }

    return cachedData.data;
  }

  // Set with cache options
  static setWithCache<T>(key: string, data: T, ttl?: number): boolean {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };

    return this.set(key, cacheData);
  }

  // Get all keys
  static getAllKeys(): string[] {
    try {
      if (this.isLocalStorageAvailable) {
        return Object.keys(localStorage);
      } else {
        return Array.from(this.memoryStorage.keys());
      }
    } catch (error) {
      console.error('Error getting all keys', error);
      return [];
    }
  }

  // Get storage size (approximate)
  static getStorageSize(): number {
    try {
      if (this.isLocalStorageAvailable) {
        const total = 0;
        for (const key in localStorage) {
          if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
            total += localStorage[key].length + key.length;
          }
        }
        return total;
      } else {
        // Approximate size for memory storage
        return JSON.stringify(Array.from(this.memoryStorage.entries())).length;
      }
    } catch (error) {
      console.error('Error calculating storage size', error);
      return 0;
    }
  }

  // Check if key exists
  static exists(key: string): boolean {
    if (this.isLocalStorageAvailable) {
      return localStorage.getItem(key) !== null;
    } else {
      return this.memoryStorage.has(key);
    }
  }

  // Bulk operations
  static bulkSet<T>(items: Record<string, T>): boolean {
    try {
      Object.entries(items).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch (error) {
      console.error('Error in bulk set operation', error);
      return false;
    }
  }

  static bulkGet<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    keys.forEach(key => {
      result[key] = this.get<T>(key);
    });
    return result;
  }

  // Export data (for backup/sync)
  static exportData(): Record<string, any> {
    try {
      if (this.isLocalStorageAvailable) {
        const data: Record<string, any> = {};
        for (const i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            data[key] = JSON.parse(localStorage.getItem(key) || 'null');
          }
        }
        return data;
      } else {
        return Object.fromEntries(this.memoryStorage.entries());
      }
    } catch (error) {
      console.error('Error exporting data', error);
      return {};
    }
  }

  // Import data (for restore/sync)
  static importData(data: Record<string, any>): boolean {
    try {
      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch (error) {
      console.error('Error importing data', error);
      return false;
    }
  }

  // Clean expired cache entries
  static cleanExpiredCache(): number {
    const cleanedCount = 0;
    try {
      const keys = this.getAllKeys();
      keys.forEach(key => {
        const data = this.get<{ data: any; timestamp: number }>(key);
        if (data && typeof data === 'object' && 'timestamp' in data) {
          // Check if this looks like cached data and if it's old (older than 24 hours)
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          if (Date.now() - data.timestamp > maxAge) {
            this.remove(key);
            cleanedCount++;
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning expired cache', error);
    }
    return cleanedCount;
  }
}
