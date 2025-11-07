import { Injectable, Logger } from '@nestjs/common';
import * as chokidar from 'chokidar';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { Stats } from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { SyncRedisConfig } from '../config/SyncRedisConfig';
import { SyncDatabaseService } from '../database/SyncDatabaseService';
import { FileChangeEvent, SyncConflictData } from '../types';

export interface WatcherConfig {
  paths: string[];
  ignored?: string[];
  depth?: number;
  tenantId?: string;
  debounceMs?: number;
  enableChecksumValidation?: boolean;
  enableConflictDetection?: boolean;
  batchSize?: number;
}

export interface FileConflict {
  filePath: string;
  conflictType: 'checksum' | 'concurrent' | 'version';
  localChecksum: string;
  remoteChecksum: string;
  localModified: Date;
  remoteModified: Date;
  metadata?: Record<string, any>;
}

/**
 * Enhanced File System Watcher with multi-tenant support and conflict detection
 * Extends existing browser hub sync patterns with comprehensive chokidar monitoring
 */
@Injectable()
export class EnhancedFileSystemWatcher extends EventEmitter {
  private readonly logger = new Logger(EnhancedFileSystemWatcher.name);
  private watchers = new Map<string, chokidar.FSWatcher>();
  private fileChecksums = new Map<string, string>();
  private pendingChanges = new Map<string, FileChangeEvent>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private isInitialized = false;

  constructor(
    private readonly redisConfig: SyncRedisConfig,
    private readonly dbService: SyncDatabaseService
  ) {
    super();
    this.setMaxListeners(100); // Support many file watchers
  }

  /**
   * Initialize the enhanced file system watcher
   */
  async initialize(config: WatcherConfig): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('EnhancedFileSystemWatcher is already initialized');
      return;
    }

    this.logger.log('Initializing EnhancedFileSystemWatcher', { 
      paths: config.paths,
      tenantId: config.tenantId 
    });

    try {
      // Validate tenant ID if provided
      if (config.tenantId && !this.redisConfig.validateTenantId(config.tenantId)) {
        throw new Error(`Invalid tenant ID format: ${config.tenantId}`);
      }

      // Initialize file checksums for existing files
      await this.initializeFileChecksums(config.paths, config.tenantId);

      this.isInitialized = true;
      this.logger.log('EnhancedFileSystemWatcher initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize EnhancedFileSystemWatcher', error);
      throw error;
    }
  }

  /**
   * Watch tenant-specific files with isolation
   */
  async watchTenantFiles(tenantId: string, patterns: string[]): Promise<void> {
    if (!this.redisConfig.validateTenantId(tenantId)) {
      throw new Error(`Invalid tenant ID format: ${tenantId}`);
    }

    const watcherId = `tenant:${tenantId}`;
    
    if (this.watchers.has(watcherId)) {
      this.logger.warn(`Tenant watcher already exists for: ${tenantId}`);
      return;
    }

    this.logger.log(`Starting tenant file watcher for: ${tenantId}`, { patterns });

    const watcher = chokidar.watch(patterns, {
      ignored: [
        'node_modules/**',
        '.git/**',
        '.DS_Store',
        '*.tmp',
        '*.temp',
        '**/dist/**',
        '**/build/**'
      ],
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      depth: 10,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    // Set up event handlers with tenant context
    this.setupWatcherEvents(watcher, { tenantId });
    this.watchers.set(watcherId, watcher);

    this.logger.log(`Tenant file watcher started for: ${tenantId}`);
  }

  /**
   * Watch global files (cross-tenant)
   */
  async watchGlobalFiles(patterns: string[]): Promise<void> {
    const watcherId = 'global';
    
    if (this.watchers.has(watcherId)) {
      this.logger.warn('Global file watcher already exists');
      return;
    }

    this.logger.log('Starting global file watcher', { patterns });

    const watcher = chokidar.watch(patterns, {
      ignored: [
        'node_modules/**',
        '.git/**',
        '.DS_Store',
        '*.tmp',
        '*.temp',
        '**/dist/**',
        '**/build/**',
        // Exclude tenant-specific directories from global watching
        '**/tenant-*/**'
      ],
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      depth: 10,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    });

    // Set up event handlers without tenant context
    this.setupWatcherEvents(watcher, {});
    this.watchers.set(watcherId, watcher);

    this.logger.log('Global file watcher started');
  }

  /**
   * Set up file change event handlers
   */
  private setupWatcherEvents(watcher: chokidar.FSWatcher, context: { tenantId?: string }): void {
    watcher
      .on('add', (filePath, stats) => {
        this.handleFileChange('create', filePath, stats, context);
      })
      .on('change', (filePath, stats) => {
        this.handleFileChange('update', filePath, stats, context);
      })
      .on('unlink', (filePath) => {
        this.handleFileChange('delete', filePath, undefined, context);
      })
      .on('addDir', (dirPath) => {
        this.logger.debug(`Directory added: ${dirPath}`, context);
      })
      .on('unlinkDir', (dirPath) => {
        this.logger.debug(`Directory removed: ${dirPath}`, context);
      })
      .on('error', (error) => {
        this.logger.error('File watcher error', { error, context });
        this.emit('error', error);
      })
      .on('ready', () => {
        this.logger.log('File watcher ready', context);
        this.emit('ready', context);
      });
  }

  /**
   * Handle file change events with debouncing and conflict detection
   */
  private async handleFileChange(
    type: 'create' | 'update' | 'delete',
    filePath: string,
    stats?: Stats,
    context: { tenantId?: string } = {}
  ): Promise<void> {
    try {
      // Clear existing debounce timer
      const existingTimer = this.debounceTimers.get(filePath);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set up debounced processing
      const timer = setTimeout(async () => {
        await this.processFileChange(type, filePath, stats, context);
        this.debounceTimers.delete(filePath);
      }, 200); // 200ms debounce

      this.debounceTimers.set(filePath, timer);
    } catch (error) {
      this.logger.error('Error handling file change', { type, filePath, context, error });
    }
  }

  /**
   * Process file change after debouncing
   */
  private async processFileChange(
    type: 'create' | 'update' | 'delete',
    filePath: string,
    stats?: Stats,
    context: { tenantId?: string } = {}
  ): Promise<void> {
    try {
      const timestamp = new Date();
      let checksum = '';

      // Calculate checksum for non-delete operations
      if (type !== 'delete') {
        checksum = await this.calculateFileChecksum(filePath);
        
        // Check for conflicts if this is an update
        if (type === 'update') {
          const conflicts = await this.detectConflicts(filePath, checksum, context.tenantId);
          if (conflicts.length > 0) {
            await this.handleFileConflicts(filePath, conflicts, context.tenantId);
          }
        }
        
        // Update checksum cache
        this.fileChecksums.set(filePath, checksum);
      } else {
        // Remove from checksum cache on delete
        this.fileChecksums.delete(filePath);
      }

      // Create file change event
      const changeEvent: FileChangeEvent = {
        type,
        filePath,
        tenantId: context.tenantId,
        timestamp,
        checksum,
        metadata: {
          size: stats?.size,
          mode: stats?.mode,
          mtime: stats?.mtime,
          isDirectory: stats?.isDirectory(),
          extension: path.extname(filePath),
          relativePath: this.getRelativePath(filePath),
        }
      };

      // Store pending change
      this.pendingChanges.set(filePath, changeEvent);

      // Emit event for listeners
      this.emit('fileChange', changeEvent);

      // Update sync state in database
      await this.updateSyncState(changeEvent);

      this.logger.debug(`File ${type}: ${filePath}`, { 
        tenantId: context.tenantId,
        checksum: checksum.substring(0, 8),
        size: stats?.size 
      });

    } catch (error) {
      this.logger.error('Error processing file change', { type, filePath, context, error });
      this.emit('error', error);
    }
  }

  /**
   * Calculate file checksum using SHA-256
   */
  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      this.logger.warn(`Failed to calculate checksum for ${filePath}`, error);
      return '';
    }
  }

  /**
   * Detect file conflicts by comparing checksums and modification times
   */
  async detectConflicts(filePath: string, currentChecksum?: string, tenantId?: string): Promise<FileConflict[]> {
    const conflicts: FileConflict[] = [];

    try {
      // Get current checksum if not provided
      if (!currentChecksum) {
        currentChecksum = await this.calculateFileChecksum(filePath);
      }

      // Get cached checksum
      const cachedChecksum = this.fileChecksums.get(filePath);
      
      // Get sync state from database
      const syncState = await this.dbService.getSyncState('file', filePath, tenantId);
      
      if (syncState && syncState.checksum !== currentChecksum) {
        // Get file stats
        const stats = await fs.stat(filePath).catch(() => null);
        
        conflicts.push({
          filePath,
          conflictType: 'checksum',
          localChecksum: currentChecksum,
          remoteChecksum: syncState.checksum,
          localModified: stats?.mtime || new Date(),
          remoteModified: syncState.lastSync,
          metadata: {
            syncedBy: syncState.syncedBy,
            version: syncState.version
          }
        });
      }

      // Check for concurrent modifications
      if (cachedChecksum && cachedChecksum !== currentChecksum) {
        const stats = await fs.stat(filePath).catch(() => null);
        
        conflicts.push({
          filePath,
          conflictType: 'concurrent',
          localChecksum: currentChecksum,
          remoteChecksum: cachedChecksum,
          localModified: stats?.mtime || new Date(),
          remoteModified: new Date(), // Approximate
          metadata: {
            source: 'cache_mismatch'
          }
        });
      }

    } catch (error) {
      this.logger.error('Error detecting conflicts', { filePath, tenantId, error });
    }

    return conflicts;
  }

  /**
   * Handle file conflicts by creating conflict records
   */
  private async handleFileConflicts(
    filePath: string, 
    conflicts: FileConflict[], 
    tenantId?: string
  ): Promise<void> {
    for (const conflict of conflicts) {
      try {
        const conflictData: Omit<SyncConflictData, 'id' | 'createdAt'> = {
          resourceType: 'file',
          resourceId: filePath,
          tenantId,
          conflictType: conflict.conflictType,
          localVersion: {
            checksum: conflict.localChecksum,
            modified: conflict.localModified,
            metadata: conflict.metadata
          },
          remoteVersion: {
            checksum: conflict.remoteChecksum,
            modified: conflict.remoteModified,
            metadata: conflict.metadata
          }
        };

        await this.dbService.createSyncConflict(conflictData);
        
        this.logger.warn(`File conflict detected: ${filePath}`, {
          conflictType: conflict.conflictType,
          tenantId
        });

        // Emit conflict event
        this.emit('conflict', conflict);

      } catch (error) {
        this.logger.error('Error handling file conflict', { filePath, conflict, error });
      }
    }
  }

  /**
   * Update sync state in database
   */
  private async updateSyncState(changeEvent: FileChangeEvent): Promise<void> {
    try {
      if (changeEvent.type === 'delete') {
        // Remove sync state for deleted files
        await this.dbService.deleteSyncState('file', changeEvent.filePath, changeEvent.tenantId);
      } else {
        // Create or update sync state
        await this.dbService.upsertSyncState({
          resourceType: 'file',
          resourceId: changeEvent.filePath,
          tenantId: changeEvent.tenantId,
          version: 1, // File version tracking could be enhanced
          checksum: changeEvent.checksum,
          lastSync: changeEvent.timestamp,
          syncedBy: 'file-watcher',
          metadata: changeEvent.metadata
        });
      }
    } catch (error) {
      this.logger.error('Error updating sync state', { changeEvent, error });
    }
  }

  /**
   * Initialize file checksums for existing files
   */
  private async initializeFileChecksums(paths: string[], tenantId?: string): Promise<void> {
    this.logger.log('Initializing file checksums', { paths, tenantId });

    for (const pattern of paths) {
      try {
        // Use a temporary watcher to discover existing files
        const tempWatcher = chokidar.watch(pattern, {
          ignored: ['node_modules/**', '.git/**', '.DS_Store'],
          persistent: false,
          ignoreInitial: false
        });

        tempWatcher.on('add', async (filePath) => {
          try {
            const checksum = await this.calculateFileChecksum(filePath);
            this.fileChecksums.set(filePath, checksum);
          } catch (error) {
            this.logger.warn(`Failed to initialize checksum for ${filePath}`, error);
          }
        });

        // Wait for initial scan to complete
        await new Promise<void>((resolve) => {
          tempWatcher.on('ready', () => {
            tempWatcher.close();
            resolve();
          });
        });

      } catch (error) {
        this.logger.error(`Error initializing checksums for pattern: ${pattern}`, error);
      }
    }

    this.logger.log(`Initialized checksums for ${this.fileChecksums.size} files`);
  }

  /**
   * Get relative path for better logging and identification
   */
  private getRelativePath(filePath: string): string {
    try {
      return path.relative(process.cwd(), filePath);
    } catch {
      return filePath;
    }
  }

  /**
   * Stop a specific watcher
   */
  async stopWatcher(watcherId: string): Promise<void> {
    const watcher = this.watchers.get(watcherId);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(watcherId);
      this.logger.log(`Stopped watcher: ${watcherId}`);
    }
  }

  /**
   * Stop all watchers
   */
  async stopAllWatchers(): Promise<void> {
    this.logger.log('Stopping all file watchers');

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close all watchers
    const closePromises = Array.from(this.watchers.values()).map(watcher => watcher.close());
    await Promise.all(closePromises);
    
    this.watchers.clear();
    this.pendingChanges.clear();
    this.isInitialized = false;

    this.logger.log('All file watchers stopped');
  }

  /**
   * Get current watcher status
   */
  getWatcherStatus(): {
    initialized: boolean;
    activeWatchers: number;
    watchedFiles: number;
    pendingChanges: number;
    watchers: Array<{ id: string; ready: boolean }>;
  } {
    return {
      initialized: this.isInitialized,
      activeWatchers: this.watchers.size,
      watchedFiles: this.fileChecksums.size,
      pendingChanges: this.pendingChanges.size,
      watchers: Array.from(this.watchers.entries()).map(([id, watcher]) => ({
        id,
        ready: watcher.options.ignoreInitial === false
      }))
    };
  }

  /**
   * Get file checksum from cache
   */
  getFileChecksum(filePath: string): string | undefined {
    return this.fileChecksums.get(filePath);
  }

  /**
   * Force refresh checksum for a file
   */
  async refreshFileChecksum(filePath: string): Promise<string> {
    const checksum = await this.calculateFileChecksum(filePath);
    this.fileChecksums.set(filePath, checksum);
    return checksum;
  }

  /**
   * Get pending changes
   */
  getPendingChanges(): FileChangeEvent[] {
    return Array.from(this.pendingChanges.values());
  }

  /**
   * Clear pending changes
   */
  clearPendingChanges(): void {
    this.pendingChanges.clear();
  }

  /**
   * Health check for file watchers
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      initialized: boolean;
      activeWatchers: number;
      watchedFiles: number;
      errors: number;
    };
  }> {
    const status = this.getWatcherStatus();
    
    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!status.initialized) {
      healthStatus = 'unhealthy';
    } else if (status.activeWatchers === 0) {
      healthStatus = 'degraded';
    }

    return {
      status: healthStatus,
      details: {
        initialized: status.initialized,
        activeWatchers: status.activeWatchers,
        watchedFiles: status.watchedFiles,
        errors: this.listenerCount('error')
      }
    };
  }
}