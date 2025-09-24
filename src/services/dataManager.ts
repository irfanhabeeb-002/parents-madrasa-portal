import {
  ApiResponse,
  PaginationOptions,
  SearchOptions,
  FilterOptions,
  _CacheOptions,
} from '../types/common';
import { StorageService } from './storageService';

/**
 * Generic Data Manager for CRUD operations with caching and offline support
 */
export class DataManager<
  T extends { id: string; createdAt: Date | string; updatedAt?: Date | string },
> {
  private storageKey: string;
  private cacheTTL: number;

  constructor(storageKey: string, cacheTTL: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.storageKey = storageKey;
    this.cacheTTL = cacheTTL;
  }

  // Create a new item
  async create(
    item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<T>> {
    try {
      const newItem: T = {
        ...item,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as T;

      const success = await StorageService.appendToArray(
        this.storageKey,
        newItem
      );

      if (!success) {
        return {
          data: {} as T,
          success: false,
          error: 'Failed to save item',
          timestamp: new Date(),
        };
      }

      // Clear cache to force refresh
      this.clearCache();

      return {
        data: newItem,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {} as T,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create item',
        timestamp: new Date(),
      };
    }
  }

  // Get all items with optional filtering, searching, and pagination
  async getAll(options?: {
    pagination?: PaginationOptions;
    search?: SearchOptions;
    filters?: FilterOptions;
    useCache?: boolean;
  }): Promise<ApiResponse<T[]>> {
    try {
      // Try to get from cache first
      if (options?.useCache !== false) {
        const cacheKey = `${this.storageKey}_all_${JSON.stringify(options)}`;
        const cachedData = StorageService.getWithCache<T[]>({
          key: cacheKey,
          ttl: this.cacheTTL,
        });
        if (cachedData) {
          return {
            data: cachedData,
            success: true,
            timestamp: new Date(),
          };
        }
      }

      // Get all items from storage
      const items = StorageService.getArray<T>(this.storageKey);

      // Apply filters
      if (options?.filters) {
        items = this.applyFilters(items, options.filters);
      }

      // Apply search
      if (options?.search) {
        items = this.applySearch(items, options.search);
      }

      // Apply sorting
      if (options?.pagination?.orderBy) {
        items = this.applySorting(items, options.pagination);
      }

      // Apply pagination
      if (options?.pagination) {
        items = this.applyPagination(items, options.pagination);
      }

      // Cache the results
      if (options?.useCache !== false) {
        const cacheKey = `${this.storageKey}_all_${JSON.stringify(options)}`;
        StorageService.setWithCache(cacheKey, items, this.cacheTTL);
      }

      return {
        data: items,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch items',
        timestamp: new Date(),
      };
    }
  }

  // Get item by ID
  async getById(
    id: string,
    useCache: boolean = true
  ): Promise<ApiResponse<T | null>> {
    try {
      // Try cache first
      if (useCache) {
        const cacheKey = `${this.storageKey}_${id}`;
        const cachedItem = StorageService.getWithCache<T>({
          key: cacheKey,
          ttl: this.cacheTTL,
        });
        if (cachedItem) {
          return {
            data: cachedItem,
            success: true,
            timestamp: new Date(),
          };
        }
      }

      const items = StorageService.getArray<T>(this.storageKey);
      const item = items.find(i => i.id === id) || null;

      // Cache the result
      if (useCache && item) {
        const cacheKey = `${this.storageKey}_${id}`;
        StorageService.setWithCache(cacheKey, item, this.cacheTTL);
      }

      return {
        data: item,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch item',
        timestamp: new Date(),
      };
    }
  }

  // Update an item
  async update(
    id: string,
    updates: Partial<T>
  ): Promise<ApiResponse<T | null>> {
    try {
      const items = StorageService.getArray<T>(this.storageKey);
      const itemIndex = items.findIndex(i => i.id === id);

      if (itemIndex === -1) {
        return {
          data: null,
          success: false,
          error: 'Item not found',
          timestamp: new Date(),
        };
      }

      const updatedItem: T = {
        ...items[itemIndex],
        ...updates,
        updatedAt: new Date(),
      };

      items[itemIndex] = updatedItem;
      const success = StorageService.setArray(this.storageKey, items);

      if (!success) {
        return {
          data: null,
          success: false,
          error: 'Failed to update item',
          timestamp: new Date(),
        };
      }

      // Clear cache
      this.clearCache();
      this.clearItemCache(id);

      return {
        data: updatedItem,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update item',
        timestamp: new Date(),
      };
    }
  }

  // Delete an item
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const success = StorageService.removeFromArray<T>(
        this.storageKey,
        item => item.id === id
      );

      if (!success) {
        return {
          data: false,
          success: false,
          error: 'Failed to delete item',
          timestamp: new Date(),
        };
      }

      // Clear cache
      this.clearCache();
      this.clearItemCache(id);

      return {
        data: true,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete item',
        timestamp: new Date(),
      };
    }
  }

  // Bulk operations
  async bulkCreate(
    items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<ApiResponse<T[]>> {
    try {
      const newItems: T[] = items.map(
        item =>
          ({
            ...item,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }) as T
      );

      const currentItems = StorageService.getArray<T>(this.storageKey);
      const allItems = [...currentItems, ...newItems];
      const success = StorageService.setArray(this.storageKey, allItems);

      if (!success) {
        return {
          data: [],
          success: false,
          error: 'Failed to save items',
          timestamp: new Date(),
        };
      }

      this.clearCache();

      return {
        data: newItems,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create items',
        timestamp: new Date(),
      };
    }
  }

  async bulkUpdate(
    updates: { id: string; data: Partial<T> }[]
  ): Promise<ApiResponse<T[]>> {
    try {
      const items = StorageService.getArray<T>(this.storageKey);
      const updatedItems: T[] = [];

      updates.forEach(update => {
        const itemIndex = items.findIndex(i => i.id === update.id);
        if (itemIndex !== -1) {
          items[itemIndex] = {
            ...items[itemIndex],
            ...update.data,
            updatedAt: new Date(),
          };
          updatedItems.push(items[itemIndex]);
        }
      });

      const success = StorageService.setArray(this.storageKey, items);

      if (!success) {
        return {
          data: [],
          success: false,
          error: 'Failed to update items',
          timestamp: new Date(),
        };
      }

      this.clearCache();

      return {
        data: updatedItems,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update items',
        timestamp: new Date(),
      };
    }
  }

  async bulkDelete(ids: string[]): Promise<ApiResponse<number>> {
    try {
      const items = StorageService.getArray<T>(this.storageKey);
      const initialCount = items.length;
      const filteredItems = items.filter(item => !ids.includes(item.id));
      const deletedCount = initialCount - filteredItems.length;

      const success = StorageService.setArray(this.storageKey, filteredItems);

      if (!success) {
        return {
          data: 0,
          success: false,
          error: 'Failed to delete items',
          timestamp: new Date(),
        };
      }

      this.clearCache();

      return {
        data: deletedCount,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: 0,
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete items',
        timestamp: new Date(),
      };
    }
  }

  // Utility methods
  private generateId(): string {
    return `${this.storageKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private applyFilters(items: T[], filters: FilterOptions): T[] {
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;

        const itemValue = (item as any)[key];

        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }

        if (typeof value === 'object' && value.operator) {
          switch (value.operator) {
            case 'gt':
              return itemValue > value.value;
            case 'gte':
              return itemValue >= value.value;
            case 'lt':
              return itemValue < value.value;
            case 'lte':
              return itemValue <= value.value;
            case 'ne':
              return itemValue !== value.value;
            case 'contains':
              return String(itemValue)
                .toLowerCase()
                .includes(String(value.value).toLowerCase());
            default:
              return itemValue === value.value;
          }
        }

        return itemValue === value;
      });
    });
  }

  private applySearch(items: T[], search: SearchOptions): T[] {
    const { query, fields = [], caseSensitive = false } = search;
    const searchTerm = caseSensitive ? query : query.toLowerCase();

    return items.filter(item => {
      if (fields.length === 0) {
        // Search all string fields
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return caseSensitive
              ? value.includes(searchTerm)
              : value.toLowerCase().includes(searchTerm);
          }
          return false;
        });
      }

      return fields.some(field => {
        const fieldValue = (item as any)[field];
        if (Array.isArray(fieldValue)) {
          return fieldValue.some(val =>
            caseSensitive
              ? String(val).includes(searchTerm)
              : String(val).toLowerCase().includes(searchTerm)
          );
        }
        if (typeof fieldValue === 'string') {
          return caseSensitive
            ? fieldValue.includes(searchTerm)
            : fieldValue.toLowerCase().includes(searchTerm);
        }
        return false;
      });
    });
  }

  private applySorting(items: T[], pagination: PaginationOptions): T[] {
    const { orderBy, orderDirection = 'asc' } = pagination;
    if (!orderBy) return items;

    return [...items].sort((a, b) => {
      const aValue = (a as any)[orderBy];
      const bValue = (b as any)[orderBy];
      const direction = orderDirection === 'desc' ? -1 : 1;

      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
  }

  private applyPagination(items: T[], pagination: PaginationOptions): T[] {
    const { offset = 0, limit } = pagination;
    if (!limit) return items.slice(offset);
    return items.slice(offset, offset + limit);
  }

  private clearCache(): void {
    const keys = StorageService.getAllKeys();
    keys.forEach(key => {
      if (key.startsWith(`${this.storageKey}_all_`)) {
        StorageService.remove(key);
      }
    });
  }

  private clearItemCache(id: string): void {
    StorageService.remove(`${this.storageKey}_${id}`);
  }

  // Export/Import functionality
  async exportData(): Promise<ApiResponse<T[]>> {
    try {
      const items = StorageService.getArray<T>(this.storageKey);
      return {
        data: items,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data',
        timestamp: new Date(),
      };
    }
  }

  async importData(
    items: T[],
    replaceExisting: boolean = false
  ): Promise<ApiResponse<number>> {
    try {
      if (replaceExisting) {
        StorageService.setArray(this.storageKey, items);
      } else {
        const existingItems = StorageService.getArray<T>(this.storageKey);
        const allItems = [...existingItems, ...items];
        StorageService.setArray(this.storageKey, allItems);
      }

      this.clearCache();

      return {
        data: items.length,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import data',
        timestamp: new Date(),
      };
    }
  }

  // Get statistics
  async getStats(): Promise<
    ApiResponse<{
      total: number;
      createdToday: number;
      updatedToday: number;
      storageSize: number;
    }>
  > {
    try {
      const items = StorageService.getArray<T>(this.storageKey);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const createdToday = items.filter(item => {
        const createdDate = new Date(item.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === today.getTime();
      }).length;

      const updatedToday = items.filter(item => {
        if (!item.updatedAt) return false;
        const updatedDate = new Date(item.updatedAt);
        updatedDate.setHours(0, 0, 0, 0);
        return updatedDate.getTime() === today.getTime();
      }).length;

      const storageSize = JSON.stringify(items).length;

      return {
        data: {
          total: items.length,
          createdToday,
          updatedToday,
          storageSize,
        },
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: { total: 0, createdToday: 0, updatedToday: 0, storageSize: 0 },
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get statistics',
        timestamp: new Date(),
      };
    }
  }
}
