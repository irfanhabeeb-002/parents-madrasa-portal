/**
 * Data Backup and Recovery Service
 * Handles backup and recovery of user data and application state
 */

import { config, logger } from '../config/environment';
import { analyticsService } from './AnalyticsService';

export interface BackupData {
  version: string;
  timestamp: number;
  environment: string;
  data: {
    userPreferences?: any;
    offlineData?: any;
    examResults?: any;
    attendance?: any;
    notifications?: any;
    customSettings?: any;
  };
  metadata: {
    userId?: string;
    deviceId: string;
    appVersion: string;
    backupSize: number;
  };
}

export interface BackupOptions {
  includeUserPreferences: boolean;
  includeOfflineData: boolean;
  includeExamResults: boolean;
  includeAttendance: boolean;
  includeNotifications: boolean;
  compress: boolean;
}

export interface RestoreOptions {
  overwriteExisting: boolean;
  selectiveRestore: string[];
  validateData: boolean;
}

class BackupService {
  private readonly BACKUP_KEY_PREFIX = 'madrasa_backup_';
  private readonly MAX_BACKUPS = 5;
  private readonly BACKUP_VERSION = '1.0.0';

  /**
   * Create a backup of user data
   */
  async createBackup(options: Partial<BackupOptions> = {}): Promise<string> {
    try {
      logger.log('Creating data backup...');

      const defaultOptions: BackupOptions = {
        includeUserPreferences: true,
        includeOfflineData: true,
        includeExamResults: true,
        includeAttendance: true,
        includeNotifications: false, // Notifications are transient
        compress: true,
      };

      const backupOptions = { ...defaultOptions, ...options };

      // Collect data based on options
      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: Date.now(),
        environment: config.APP_ENV,
        data: {},
        metadata: {
          deviceId: this.getDeviceId(),
          appVersion: config.APP_VERSION,
          backupSize: 0,
        },
      };

      // Collect user preferences
      if (backupOptions.includeUserPreferences) {
        backupData.data.userPreferences = this.collectUserPreferences();
      }

      // Collect offline data
      if (backupOptions.includeOfflineData) {
        backupData.data.offlineData = await this.collectOfflineData();
      }

      // Collect exam results
      if (backupOptions.includeExamResults) {
        backupData.data.examResults = this.collectExamResults();
      }

      // Collect attendance data
      if (backupOptions.includeAttendance) {
        backupData.data.attendance = this.collectAttendanceData();
      }

      // Collect notifications
      if (backupOptions.includeNotifications) {
        backupData.data.notifications = this.collectNotifications();
      }

      // Collect custom settings
      backupData.data.customSettings = this.collectCustomSettings();

      // Calculate backup size
      const backupString = JSON.stringify(backupData);
      backupData.metadata.backupSize = new Blob([backupString]).size;

      // Compress if requested
      let finalBackupData = backupString;
      if (backupOptions.compress) {
        finalBackupData = await this.compressData(backupString);
      }

      // Store backup
      const backupId = this.generateBackupId();
      await this.storeBackup(backupId, finalBackupData, backupOptions.compress);

      // Clean up old backups
      await this.cleanupOldBackups();

      // Track backup creation
      analyticsService.trackEvent({
        action: 'backup_created',
        category: 'data_management',
        custom_parameters: {
          backup_size: backupData.metadata.backupSize,
          compressed: backupOptions.compress,
          data_types: Object.keys(backupData.data).join(','),
        },
      });

      logger.success(`Backup created successfully: ${backupId}`);
      return backupId;
    } catch (error) {
      logger.error('Failed to create backup:', error);
      analyticsService.trackError(error as Error, 'backup_creation');
      throw error;
    }
  }

  /**
   * Restore data from backup
   */
  async restoreBackup(
    backupId: string,
    options: Partial<RestoreOptions> = {}
  ): Promise<void> {
    try {
      logger.log(`Restoring backup: ${backupId}`);

      const defaultOptions: RestoreOptions = {
        overwriteExisting: false,
        selectiveRestore: [],
        validateData: true,
      };

      const restoreOptions = { ...defaultOptions, ...options };

      // Retrieve backup data
      const backupData = await this.retrieveBackup(backupId);
      if (!backupData) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Validate backup data
      if (restoreOptions.validateData) {
        this.validateBackupData(backupData);
      }

      // Restore data selectively or completely
      if (restoreOptions.selectiveRestore.length > 0) {
        await this.restoreSelective(
          backupData,
          restoreOptions.selectiveRestore,
          restoreOptions.overwriteExisting
        );
      } else {
        await this.restoreComplete(
          backupData,
          restoreOptions.overwriteExisting
        );
      }

      // Track restore operation
      analyticsService.trackEvent({
        action: 'backup_restored',
        category: 'data_management',
        custom_parameters: {
          backup_id: backupId,
          backup_version: backupData.version,
          selective: restoreOptions.selectiveRestore.length > 0,
          overwrite: restoreOptions.overwriteExisting,
        },
      });

      logger.success('Backup restored successfully');
    } catch (error) {
      logger.error('Failed to restore backup:', error);
      analyticsService.trackError(error as Error, 'backup_restoration');
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<
    Array<{ id: string; timestamp: number; size: number; version: string }>
  > {
    try {
      const backups: Array<{
        id: string;
        timestamp: number;
        size: number;
        version: string;
      }> = [];

      // Get all backup keys from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.BACKUP_KEY_PREFIX)) {
          const backupId = key.replace(this.BACKUP_KEY_PREFIX, '');
          const backupData = await this.retrieveBackup(backupId);

          if (backupData) {
            backups.push({
              id: backupId,
              timestamp: backupData.timestamp,
              size: backupData.metadata.backupSize,
              version: backupData.version,
            });
          }
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const key = this.BACKUP_KEY_PREFIX + backupId;
      localStorage.removeItem(key);

      analyticsService.trackEvent({
        action: 'backup_deleted',
        category: 'data_management',
        custom_parameters: {
          backup_id: backupId,
        },
      });

      logger.log(`Backup deleted: ${backupId}`);
    } catch (error) {
      logger.error('Failed to delete backup:', error);
      throw error;
    }
  }

  /**
   * Export backup to file
   */
  async exportBackup(backupId: string): Promise<void> {
    try {
      const backupData = await this.retrieveBackup(backupId);
      if (!backupData) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      const backupString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupString], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `madrasa-backup-${backupId}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      analyticsService.trackEvent({
        action: 'backup_exported',
        category: 'data_management',
        custom_parameters: {
          backup_id: backupId,
        },
      });

      logger.success('Backup exported successfully');
    } catch (error) {
      logger.error('Failed to export backup:', error);
      throw error;
    }
  }

  /**
   * Import backup from file
   */
  async importBackup(file: File): Promise<string> {
    try {
      logger.log('Importing backup from file...');

      const fileContent = await this.readFileAsText(file);
      const backupData: BackupData = JSON.parse(fileContent);

      // Validate imported data
      this.validateBackupData(backupData);

      // Generate new backup ID
      const backupId = this.generateBackupId();

      // Store imported backup
      await this.storeBackup(backupId, JSON.stringify(backupData), false);

      analyticsService.trackEvent({
        action: 'backup_imported',
        category: 'data_management',
        custom_parameters: {
          backup_id: backupId,
          file_size: file.size,
        },
      });

      logger.success(`Backup imported successfully: ${backupId}`);
      return backupId;
    } catch (error) {
      logger.error('Failed to import backup:', error);
      throw error;
    }
  }

  /**
   * Collect user preferences
   */
  private collectUserPreferences(): any {
    try {
      const preferences = {
        fontSize: localStorage.getItem('fontSize'),
        language: localStorage.getItem('language'),
        theme: localStorage.getItem('theme'),
        accessibility: localStorage.getItem('accessibility'),
        notifications: localStorage.getItem('notificationPreferences'),
      };

      return Object.fromEntries(
        Object.entries(preferences).filter(([_, value]) => value !== null)
      );
    } catch (error) {
      logger.error('Failed to collect user preferences:', error);
      return {};
    }
  }

  /**
   * Collect offline data
   */
  private async collectOfflineData(): Promise<any> {
    try {
      // This would integrate with IndexedDB or other offline storage
      const offlineData = {
        cachedClasses: localStorage.getItem('cachedClasses'),
        cachedRecordings: localStorage.getItem('cachedRecordings'),
        cachedNotes: localStorage.getItem('cachedNotes'),
        offlineQueue: localStorage.getItem('offlineQueue'),
      };

      return Object.fromEntries(
        Object.entries(offlineData).filter(([_, value]) => value !== null)
      );
    } catch (error) {
      logger.error('Failed to collect offline data:', error);
      return {};
    }
  }

  /**
   * Collect exam results
   */
  private collectExamResults(): any {
    try {
      const examResults = localStorage.getItem('examResults');
      return examResults ? JSON.parse(examResults) : {};
    } catch (error) {
      logger.error('Failed to collect exam results:', error);
      return {};
    }
  }

  /**
   * Collect attendance data
   */
  private collectAttendanceData(): any {
    try {
      const attendance = localStorage.getItem('attendance');
      return attendance ? JSON.parse(attendance) : {};
    } catch (error) {
      logger.error('Failed to collect attendance data:', error);
      return {};
    }
  }

  /**
   * Collect notifications
   */
  private collectNotifications(): any {
    try {
      let notifications = localStorage.getItem('notifications');
      return notifications ? JSON.parse(notifications) : {};
    } catch (error) {
      logger.error('Failed to collect notifications:', error);
      return {};
    }
  }

  /**
   * Collect custom settings
   */
  private collectCustomSettings(): any {
    try {
      const customSettings: Record<string, any> = {};

      // Collect any custom app settings
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('custom_') || key?.startsWith('app_')) {
          customSettings[key] = localStorage.getItem(key);
        }
      }

      return customSettings;
    } catch (error) {
      logger.error('Failed to collect custom settings:', error);
      return {};
    }
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}`;
  }

  /**
   * Get device ID
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Compress data using simple compression
   */
  private async compressData(data: string): Promise<string> {
    // Simple compression using built-in compression
    // In a real implementation, you might use a library like pako for gzip compression
    try {
      const compressed = btoa(data);
      return compressed;
    } catch (error) {
      logger.warning('Compression failed, using uncompressed data');
      return data;
    }
  }

  /**
   * Decompress data
   */
  private async decompressData(data: string): Promise<string> {
    try {
      const decompressed = atob(data);
      return decompressed;
    } catch (error) {
      // If decompression fails, assume data is not compressed
      return data;
    }
  }

  /**
   * Store backup in localStorage
   */
  private async storeBackup(
    backupId: string,
    data: string,
    compressed: boolean
  ): Promise<void> {
    try {
      const key = this.BACKUP_KEY_PREFIX + backupId;
      const backupEntry = {
        data,
        compressed,
        timestamp: Date.now(),
      };

      localStorage.setItem(key, JSON.stringify(backupEntry));
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'QuotaExceededError'
      ) {
        // Storage quota exceeded, clean up old backups and try again
        await this.cleanupOldBackups();
        localStorage.setItem(
          this.BACKUP_KEY_PREFIX + backupId,
          JSON.stringify({ data, compressed, timestamp: Date.now() })
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Retrieve backup from localStorage
   */
  private async retrieveBackup(backupId: string): Promise<BackupData | null> {
    try {
      const key = this.BACKUP_KEY_PREFIX + backupId;
      const backupEntry = localStorage.getItem(key);

      if (!backupEntry) {
        return null;
      }

      const { data, compressed } = JSON.parse(backupEntry);
      const backupString = compressed ? await this.decompressData(data) : data;

      return JSON.parse(backupString);
    } catch (error) {
      logger.error(`Failed to retrieve backup ${backupId}:`, error);
      return null;
    }
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();

      if (backups.length > this.MAX_BACKUPS) {
        const backupsToDelete = backups.slice(this.MAX_BACKUPS);

        for (let backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }

        logger.log(`Cleaned up ${backupsToDelete.length} old backups`);
      }
    } catch (error) {
      logger.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Validate backup data
   */
  private validateBackupData(backupData: BackupData): void {
    if (!backupData.version || !backupData.timestamp || !backupData.data) {
      throw new Error('Invalid backup data structure');
    }

    if (backupData.version !== this.BACKUP_VERSION) {
      logger.warning(
        `Backup version mismatch: ${backupData.version} vs ${this.BACKUP_VERSION}`
      );
    }
  }

  /**
   * Restore complete backup
   */
  private async restoreComplete(
    backupData: BackupData,
    overwrite: boolean
  ): Promise<void> {
    const { data } = backupData;

    // Restore user preferences
    if (data.userPreferences) {
      await this.restoreUserPreferences(data.userPreferences, overwrite);
    }

    // Restore offline data
    if (data.offlineData) {
      await this.restoreOfflineData(data.offlineData, overwrite);
    }

    // Restore exam results
    if (data.examResults) {
      await this.restoreExamResults(data.examResults, overwrite);
    }

    // Restore attendance data
    if (data.attendance) {
      await this.restoreAttendanceData(data.attendance, overwrite);
    }

    // Restore notifications
    if (data.notifications) {
      await this.restoreNotifications(data.notifications, overwrite);
    }

    // Restore custom settings
    if (data.customSettings) {
      await this.restoreCustomSettings(data.customSettings, overwrite);
    }
  }

  /**
   * Restore selective backup
   */
  private async restoreSelective(
    backupData: BackupData,
    dataTypes: string[],
    overwrite: boolean
  ): Promise<void> {
    const { data } = backupData;

    for (let dataType of dataTypes) {
      switch (dataType) {
        case 'userPreferences':
          if (data.userPreferences) {
            await this.restoreUserPreferences(data.userPreferences, overwrite);
          }
          break;
        case 'offlineData':
          if (data.offlineData) {
            await this.restoreOfflineData(data.offlineData, overwrite);
          }
          break;
        case 'examResults':
          if (data.examResults) {
            await this.restoreExamResults(data.examResults, overwrite);
          }
          break;
        case 'attendance':
          if (data.attendance) {
            await this.restoreAttendanceData(data.attendance, overwrite);
          }
          break;
        case 'notifications':
          if (data.notifications) {
            await this.restoreNotifications(data.notifications, overwrite);
          }
          break;
        case 'customSettings':
          if (data.customSettings) {
            await this.restoreCustomSettings(data.customSettings, overwrite);
          }
          break;
      }
    }
  }

  /**
   * Restore user preferences
   */
  private async restoreUserPreferences(
    preferences: any,
    overwrite: boolean
  ): Promise<void> {
    for (const [key, value] of Object.entries(preferences)) {
      if (overwrite || !localStorage.getItem(key)) {
        localStorage.setItem(key, value as string);
      }
    }
  }

  /**
   * Restore offline data
   */
  private async restoreOfflineData(
    offlineData: any,
    overwrite: boolean
  ): Promise<void> {
    for (const [key, value] of Object.entries(offlineData)) {
      if (overwrite || !localStorage.getItem(key)) {
        localStorage.setItem(key, value as string);
      }
    }
  }

  /**
   * Restore exam results
   */
  private async restoreExamResults(
    examResults: any,
    overwrite: boolean
  ): Promise<void> {
    if (overwrite || !localStorage.getItem('examResults')) {
      localStorage.setItem('examResults', JSON.stringify(examResults));
    }
  }

  /**
   * Restore attendance data
   */
  private async restoreAttendanceData(
    attendance: any,
    overwrite: boolean
  ): Promise<void> {
    if (overwrite || !localStorage.getItem('attendance')) {
      localStorage.setItem('attendance', JSON.stringify(attendance));
    }
  }

  /**
   * Restore notifications
   */
  private async restoreNotifications(
    notifications: any,
    overwrite: boolean
  ): Promise<void> {
    if (overwrite || !localStorage.getItem('notifications')) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }

  /**
   * Restore custom settings
   */
  private async restoreCustomSettings(
    customSettings: any,
    overwrite: boolean
  ): Promise<void> {
    for (const [key, value] of Object.entries(customSettings)) {
      if (overwrite || !localStorage.getItem(key)) {
        localStorage.setItem(key, value as string);
      }
    }
  }

  /**
   * Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// Export singleton instance
export const backupService = new BackupService();
