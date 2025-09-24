import { ApiResponse } from '../types/common';
import { StorageService } from './storageService';
import { Recording } from '../types/recording';
import { Note } from '../types/note';
import { Exercise } from '../types/exercise';
import { Attendance } from '../types/attendance';
import { User } from '../types/user';

// Supported data types
type DataType =
  | 'recordings'
  | 'notes'
  | 'exercises'
  | 'attendance'
  | 'users'
  | 'all';

interface ExportData {
  version: string;
  exportedAt: Date;
  dataType: DataType;
  metadata: {
    totalRecords: number;
    collections: string[];
    appVersion: string;
  };
  data: {
    recordings?: Recording[];
    notes?: Note[];
    exercises?: Exercise[];
    attendance?: Attendance[];
    users?: User[];
  };
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  collections: string[];
}

/**
 * Data Import/Export Service for JSON file-based data management
 */
export class DataImportExportService {
  // Export data to JSON
  static async exportData(
    dataType: DataType = 'all'
  ): Promise<ApiResponse<ExportData>> {
    try {
      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date(),
        dataType,
        metadata: {
          totalRecords: 0,
          collections: [],
          appVersion: '1.0.0',
        },
        data: {},
      };

      let totalRecords = 0;
      const collections: string[] = [];

      // Export recordings
      if (dataType === 'all' || dataType === 'recordings') {
        const recordings = StorageService.getArray<Recording>('recordings');
        if (recordings.length > 0) {
          exportData.data.recordings = recordings;
          totalRecords += recordings.length;
          collections.push('recordings');
        }
      }

      // Export notes
      if (dataType === 'all' || dataType === 'notes') {
        const notes = StorageService.getArray<Note>('notes');
        if (notes.length > 0) {
          exportData.data.notes = notes;
          totalRecords += notes.length;
          collections.push('notes');
        }
      }

      // Export exercises
      if (dataType === 'all' || dataType === 'exercises') {
        const exercises = StorageService.getArray<Exercise>('exercises');
        if (exercises.length > 0) {
          exportData.data.exercises = exercises;
          totalRecords += exercises.length;
          collections.push('exercises');
        }
      }

      // Export attendance
      if (dataType === 'all' || dataType === 'attendance') {
        const attendance = StorageService.getArray<Attendance>('attendance');
        if (attendance.length > 0) {
          exportData.data.attendance = attendance;
          totalRecords += attendance.length;
          collections.push('attendance');
        }
      }

      // Export users
      if (dataType === 'all' || dataType === 'users') {
        const users = StorageService.getArray<User>('users');
        if (users.length > 0) {
          exportData.data.users = users;
          totalRecords += users.length;
          collections.push('users');
        }
      }

      exportData.metadata.totalRecords = totalRecords;
      exportData.metadata.collections = collections;

      return {
        data: exportData,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {} as ExportData,
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
        timestamp: new Date(),
      };
    }
  }

  // Download data as JSON file
  static async downloadDataAsFile(
    dataType: DataType = 'all',
    filename?: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const exportResult = await this.exportData(dataType);

      if (!exportResult.success) {
        return {
          data: false,
          success: false,
          error: exportResult.error,
          timestamp: new Date(),
        };
      }

      const jsonString = JSON.stringify(exportResult.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      const defaultFilename = `madrasa_portal_${dataType}_${new Date().toISOString().split('T')[0]}.json`;
      const finalFilename = filename || defaultFilename;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        data: true,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
        timestamp: new Date(),
      };
    }
  }

  // Import data from JSON
  static async importData(
    jsonData: string | ExportData,
    options: {
      replaceExisting?: boolean;
      validateData?: boolean;
      skipDuplicates?: boolean;
    } = {}
  ): Promise<ApiResponse<ImportResult>> {
    try {
      const {
        replaceExisting = false,
        validateData = true,
        skipDuplicates = true,
      } = options;

      // Parse JSON if string
      let importData: ExportData;
      if (typeof jsonData === 'string') {
        importData = JSON.parse(jsonData);
      } else {
        importData = jsonData;
      }

      // Validate import data structure
      if (validateData && !this.validateImportData(importData)) {
        return {
          data: {
            success: false,
            imported: 0,
            skipped: 0,
            errors: ['Invalid data format'],
            collections: [],
          },
          success: false,
          error: 'Invalid data format',
          timestamp: new Date(),
        };
      }

      const result: ImportResult = {
        success: true,
        imported: 0,
        skipped: 0,
        errors: [],
        collections: [],
      };

      // Import recordings
      if (importData.data.recordings) {
        const importResult = await this.importCollection(
          'recordings',
          importData.data.recordings,
          { replaceExisting, skipDuplicates }
        );
        result.imported += importResult.imported;
        result.skipped += importResult.skipped;
        result.errors.push(...importResult.errors);
        if (importResult.imported > 0) {
          result.collections.push('recordings');
        }
      }

      // Import notes
      if (importData.data.notes) {
        const importResult = await this.importCollection(
          'notes',
          importData.data.notes,
          { replaceExisting, skipDuplicates }
        );
        result.imported += importResult.imported;
        result.skipped += importResult.skipped;
        result.errors.push(...importResult.errors);
        if (importResult.imported > 0) {
          result.collections.push('notes');
        }
      }

      // Import exercises
      if (importData.data.exercises) {
        const importResult = await this.importCollection(
          'exercises',
          importData.data.exercises,
          { replaceExisting, skipDuplicates }
        );
        result.imported += importResult.imported;
        result.skipped += importResult.skipped;
        result.errors.push(...importResult.errors);
        if (importResult.imported > 0) {
          result.collections.push('exercises');
        }
      }

      // Import attendance
      if (importData.data.attendance) {
        const importResult = await this.importCollection(
          'attendance',
          importData.data.attendance,
          { replaceExisting, skipDuplicates }
        );
        result.imported += importResult.imported;
        result.skipped += importResult.skipped;
        result.errors.push(...importResult.errors);
        if (importResult.imported > 0) {
          result.collections.push('attendance');
        }
      }

      // Import users
      if (importData.data.users) {
        const importResult = await this.importCollection(
          'users',
          importData.data.users,
          { replaceExisting, skipDuplicates }
        );
        result.imported += importResult.imported;
        result.skipped += importResult.skipped;
        result.errors.push(...importResult.errors);
        if (importResult.imported > 0) {
          result.collections.push('users');
        }
      }

      result.success = result.errors.length === 0;

      return {
        data: result,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: {
          success: false,
          imported: 0,
          skipped: 0,
          errors: [error instanceof Error ? error.message : 'Import failed'],
          collections: [],
        },
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
        timestamp: new Date(),
      };
    }
  }

  // Import data from file
  static async importFromFile(
    file: File,
    options?: {
      replaceExisting?: boolean;
      validateData?: boolean;
      skipDuplicates?: boolean;
    }
  ): Promise<ApiResponse<ImportResult>> {
    try {
      if (!file.type.includes('json')) {
        return {
          data: {
            success: false,
            imported: 0,
            skipped: 0,
            errors: ['File must be JSON format'],
            collections: [],
          },
          success: false,
          error: 'File must be JSON format',
          timestamp: new Date(),
        };
      }

      const fileContent = await this.readFileAsText(file);
      return this.importData(fileContent, options);
    } catch (error) {
      return {
        data: {
          success: false,
          imported: 0,
          skipped: 0,
          errors: [error instanceof Error ? error.message : 'File read failed'],
          collections: [],
        },
        success: false,
        error: error instanceof Error ? error.message : 'File read failed',
        timestamp: new Date(),
      };
    }
  }

  // Import specific collection
  private static async importCollection<T extends { id: string }>(
    collectionName: string,
    items: T[],
    options: { replaceExisting?: boolean; skipDuplicates?: boolean }
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const { replaceExisting = false, skipDuplicates = true } = options;
    const result = { imported: 0, skipped: 0, errors: [] };

    try {
      if (replaceExisting) {
        // Replace entire collection
        StorageService.setArray(collectionName, items);
        result.imported = items.length;
      } else {
        // Merge with existing data
        const existingItems = StorageService.getArray<T>(collectionName);
        const existingIds = new Set(existingItems.map(item => item.id));

        const newItems: T[] = [];

        for (const item of items) {
          if (existingIds.has(item.id)) {
            if (skipDuplicates) {
              result.skipped++;
            } else {
              // Update existing item
              const existingIndex = existingItems.findIndex(
                existing => existing.id === item.id
              );
              if (existingIndex !== -1) {
                existingItems[existingIndex] = item;
                result.imported++;
              }
            }
          } else {
            newItems.push(item);
            result.imported++;
          }
        }

        // Save updated collection
        const finalItems = [...existingItems, ...newItems];
        StorageService.setArray(collectionName, finalItems);
      }
    } catch (error) {
      result.errors.push(
        `Failed to import ${collectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  // Validate import data structure
  private static validateImportData(data: any): data is ExportData {
    if (!data || typeof data !== 'object') {
      return false;
    }
    if (!data.version || !data.exportedAt || !data.dataType) {
      return false;
    }
    if (!data.metadata || !data.data) {
      return false;
    }

    // Check metadata structure
    const metadata = data.metadata;
    if (
      typeof metadata.totalRecords !== 'number' ||
      !Array.isArray(metadata.collections)
    ) {
      return false;
    }

    // Check data structure
    const dataObj = data.data;
    if (typeof dataObj !== 'object') {
      return false;
    }

    // Validate each collection if present
    const collections = [
      'recordings',
      'notes',
      'exercises',
      'attendance',
      'users',
    ];
    for (const collection of collections) {
      if (dataObj[collection] && !Array.isArray(dataObj[collection])) {
        return false;
      }
    }

    return true;
  }

  // Read file as text
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  }

  // Get export statistics
  static getExportStats(): {
    collections: { name: string; count: number; size: number }[];
    totalRecords: number;
    totalSize: number;
  } {
    const collections = [
      { name: 'recordings', key: 'recordings' },
      { name: 'notes', key: 'notes' },
      { name: 'exercises', key: 'exercises' },
      { name: 'attendance', key: 'attendance' },
      { name: 'users', key: 'users' },
    ];

    const stats = collections.map(collection => {
      const data = StorageService.getArray(collection.key);
      const size = JSON.stringify(data).length;
      return {
        name: collection.name,
        count: data.length,
        size,
      };
    });

    const totalRecords = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalSize = stats.reduce((sum, stat) => sum + stat.size, 0);

    return {
      collections: stats,
      totalRecords,
      totalSize,
    };
  }

  // Create backup
  static async createBackup(
    includeUserData: boolean = true
  ): Promise<ApiResponse<string>> {
    try {
      const dataType: DataType = includeUserData ? 'all' : 'recordings'; // Adjust as needed
      const exportResult = await this.exportData(dataType);

      if (!exportResult.success) {
        return {
          data: '',
          success: false,
          error: exportResult.error,
          timestamp: new Date(),
        };
      }

      const _backupData = JSON.stringify(exportResult.data, null, 2);
      const backupKey = `backup_${Date.now()}`;

      // Store backup in storage
      StorageService.set(backupKey, exportResult.data);

      return {
        data: backupKey,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: '',
        success: false,
        error:
          error instanceof Error ? error.message : 'Backup creation failed',
        timestamp: new Date(),
      };
    }
  }

  // Restore from backup
  static async restoreFromBackup(
    backupKey: string
  ): Promise<ApiResponse<ImportResult>> {
    try {
      const _backupData = StorageService.get<ExportData>(backupKey);

      if (!_backupData) {
        return {
          data: {
            success: false,
            imported: 0,
            skipped: 0,
            errors: ['Backup not found'],
            collections: [],
          },
          success: false,
          error: 'Backup not found',
          timestamp: new Date(),
        };
      }

      return this.importData(_backupData, {
        replaceExisting: true,
        validateData: true,
      });
    } catch (error) {
      return {
        data: {
          success: false,
          imported: 0,
          skipped: 0,
          errors: [error instanceof Error ? error.message : 'Restore failed'],
          collections: [],
        },
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
        timestamp: new Date(),
      };
    }
  }

  // List available backups
  static listBackups(): { key: string; createdAt: Date; size: number }[] {
    const allKeys = StorageService.getAllKeys();
    const backupKeys = allKeys.filter(key => key.startsWith('backup_'));

    return backupKeys
      .map(key => {
        const data = StorageService.get(key);
        const size = JSON.stringify(data).length;
        const timestamp = parseInt(key.replace('backup_', ''));

        return {
          key,
          createdAt: new Date(timestamp),
          size,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
