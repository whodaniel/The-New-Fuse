import { BaseService } from './BaseService.js';

/**
 * Storage inventory item
 */
export interface StorageItem {
  id: string;
  name: string;
  description: string;
  path: string;
  alt_path: string;
  classification: string;
  git_status: string;
  size_bytes: number;
  size_formatted: string;
}

/**
 * Storage inventory response
 */
export interface StorageInventory {
  timestamp: string;
  total_storage_bytes: number;
  total_storage_formatted: string;
  inventory: StorageItem[];
}

/**
 * Backup snapshot
 */
export interface BackupSnapshot {
  id: string;
  filename: string;
  path: string;
  created_at: string;
  size_bytes: number;
  size_formatted: string;
  status: 'completed' | 'in_progress' | 'failed';
}

/**
 * Backup configuration
 */
export interface BackupConfig {
  backup_destination: string;
  schedule: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    time: string;
    cron_expression: string;
  };
  retention: {
    keep_last_snapshots: number;
    compress_format: string;
  };
  included_targets: string[];
}

/**
 * Backup result
 */
export interface BackupResult {
  id: string;
  filename: string;
  path: string;
  created_at: string;
  size_bytes: number;
  size_formatted: string;
  status: string;
}

/**
 * Backup service for managing backups and storage
 */
export class BackupService extends BaseService {
  /**
   * Create a new backup service
   * @param apiClient API client
   */
  constructor(apiClient: any) {
    super(apiClient, '/admin/backups');
  }

  /**
   * Get storage inventory with transparency map
   * @returns Promise resolving to the storage inventory
   */
  async getInventory(): Promise<StorageInventory> {
    return this.apiClient.get<StorageInventory>(this.getPath('/inventory'));
  }

  /**
   * List all backup snapshots
   * @returns Promise resolving to the backup snapshots array
   */
  async getBackups(): Promise<BackupSnapshot[]> {
    return this.apiClient.get<BackupSnapshot[]>(this.getPath());
  }

  /**
   * Get full backup status (inventory, backups, config)
   * @returns Promise resolving to the full status
   */
  async getStatus(): Promise<{
    inventory: StorageInventory;
    backups: BackupSnapshot[];
    config: BackupConfig;
  }> {
    return this.apiClient.get(this.getPath('/status'));
  }

  /**
   * Get backup configuration
   * @returns Promise resolving to the backup configuration
   */
  async getConfig(): Promise<BackupConfig> {
    return this.apiClient.get<BackupConfig>(this.getPath('/config'));
  }

  /**
   * Trigger a new backup
   * @returns Promise resolving to the backup result
   */
  async createBackup(): Promise<BackupResult> {
    return this.apiClient.post<BackupResult>(this.getPath());
  }

  /**
   * Update backup destination folder
   * @param destination Destination path
   * @returns Promise resolving to the update result
   */
  async updateDestination(destination: string): Promise<{ success: boolean; destination: string }> {
    return this.apiClient.post<{ success: boolean; destination: string }>(
      this.getPath('/config/destination'),
      { destination }
    );
  }

  /**
   * Update cron schedule expression
   * @param expression Cron expression
   * @returns Promise resolving to the update result
   */
  async updateCronExpression(
    expression: string
  ): Promise<{ success: boolean; expression: string }> {
    return this.apiClient.post<{ success: boolean; expression: string }>(
      this.getPath('/config/cron'),
      { expression }
    );
  }

  /**
   * Enable automated cron backup
   * @returns Promise resolving to the enable result
   */
  async enableCron(): Promise<{ success: boolean; message: string }> {
    return this.apiClient.post<{ success: boolean; message: string }>(
      this.getPath('/config/cron/enable')
    );
  }

  /**
   * Disable automated cron backup
   * @returns Promise resolving to the disable result
   */
  async disableCron(): Promise<{ success: boolean; message: string }> {
    return this.apiClient.post<{ success: boolean; message: string }>(
      this.getPath('/config/cron/disable')
    );
  }

  /**
   * Sync persistent cron job to OS crontab
   * @returns Promise resolving to the sync result
   */
  async syncCron(): Promise<{ success: boolean; message: string }> {
    return this.apiClient.post<{ success: boolean; message: string }>(
      this.getPath('/config/cron/sync')
    );
  }

  /**
   * Update backup retention count
   * @param count Number of backups to keep
   * @returns Promise resolving to the update result
   */
  async updateRetention(count: number): Promise<{ success: boolean; count: number }> {
    return this.apiClient.post<{ success: boolean; count: number }>(
      this.getPath('/config/retention'),
      { count }
    );
  }

  /**
   * Delete a backup (manual cleanup)
   * @param id Backup ID
   * @returns Promise resolving to the delete result
   */
  async deleteBackup(id: string): Promise<{ success: boolean; message: string }> {
    return this.apiClient.delete<{ success: boolean; message: string }>(this.getPath(`/${id}`));
  }
}

/**
 * Create a backup service instance
 * @param apiClient API client
 * @returns BackupService instance
 */
export function createBackupService(apiClient: any): BackupService {
  return new BackupService(apiClient);
}
