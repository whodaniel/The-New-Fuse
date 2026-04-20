/**
 * Cleanup Service for The New Fuse Framework
 * 
 * Manages cleanup of old tributary files after consolidation
 * Implements safe file removal with backup and rollback capabilities
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../utils/Logger.js';

export interface CleanupTarget {
  path: string;
  type: 'file' | 'directory';
  reason: string;
  consolidatedInto?: string;
  backupRequired: boolean;
}

export interface CleanupOptions {
  dryRun: boolean;
  createBackups: boolean;
  backupDirectory: string;
  confirmationRequired: boolean;
}

export class CleanupService {
  private logger: Logger;
  private workspaceRoot: string;
  private cleanupTargets: CleanupTarget[] = [];

  constructor(workspaceRoot: string, logger: Logger) {
    this.workspaceRoot = workspaceRoot;
    this.logger = logger;
  }

  /**
   * Add file/directory to cleanup queue
   */
  addCleanupTarget(target: CleanupTarget): void {
    this.cleanupTargets.push(target);
    this.logger.info(`Added cleanup target: ${target.path} - ${target.reason}`);
  }

  /**
   * Add multiple cleanup targets for relay consolidation
   */
  addRelayConsolidationTargets(): void {
    const relayTargets: CleanupTarget[] = [
      {
        path: 'packages/relay/comprehensive-tnf-relay.js',
        type: 'file',
        reason: 'Consolidated into RelayServer.ts',
        consolidatedInto: 'packages/relay-core/src/server/RelayServer.ts',
        backupRequired: true
      },
      {
        path: 'packages/relay/enhanced-tnf-relay.js', 
        type: 'file',
        reason: 'Consolidated into RelayServer.ts',
        consolidatedInto: 'packages/relay-core/src/server/RelayServer.ts',
        backupRequired: true
      },
      {
        path: 'packages/relay/basic-relay.js',
        type: 'file', 
        reason: 'Consolidated into RelayServer.ts',
        consolidatedInto: 'packages/relay-core/src/server/RelayServer.ts',
        backupRequired: true
      },
      {
        path: 'packages/relay/relay-adapter.js',
        type: 'file',
        reason: 'Consolidated into protocol adapters',
        consolidatedInto: 'packages/relay-core/src/protocols/',
        backupRequired: true
      },
      {
        path: 'packages/relay/message-bridge.js',
        type: 'file',
        reason: 'Consolidated into UnifiedBridge.ts',
        consolidatedInto: 'packages/relay-core/src/adapters/UnifiedBridge.ts',
        backupRequired: true
      },
      {
        path: 'packages/relay/scattered-transport-files/',
        type: 'directory',
        reason: 'Consolidated into unified transport system',
        consolidatedInto: 'packages/relay-core/src/transports/',
        backupRequired: true
      }
    ];

    relayTargets.forEach(target => this.addCleanupTarget(target));
  }

  /**
   * Execute cleanup with safety checks
   */
  async executeCleanup(options: CleanupOptions): Promise<{
    success: boolean;
    cleaned: string[];
    backed_up: string[];
    errors: Array<{path: string, error: string}>;
  }> {
    const result = {
      success: true,
      cleaned: [] as string[],
      backed_up: [] as string[],
      errors: [] as Array<{path: string, error: string}>
    };

    this.logger.info(`Starting cleanup of ${this.cleanupTargets.length} targets (dryRun: ${options.dryRun})`);

    // Create backup directory if needed
    if (options.createBackups && !options.dryRun) {
      await this.ensureBackupDirectory(options.backupDirectory);
    }

    for (const target of this.cleanupTargets) {
      try {
        const fullPath = path.resolve(this.workspaceRoot, target.path);
        
        // Check if file exists
        const exists = await this.pathExists(fullPath);
        if (!exists) {
          this.logger.warn(`Cleanup target not found: ${fullPath}`);
          continue;
        }

        // Create backup if required
        if (target.backupRequired && options.createBackups && !options.dryRun) {
          await this.createBackup(fullPath, target, options.backupDirectory);
          result.backed_up.push(target.path);
        }

        // Remove file/directory
        if (!options.dryRun) {
          await this.removeTarget(fullPath, target.type);
          result.cleaned.push(target.path);
          this.logger.info(`Cleaned up: ${target.path}`);
        } else {
          this.logger.info(`[DRY RUN] Would clean up: ${target.path}`);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push({ path: target.path, error: errorMsg });
        result.success = false;
        this.logger.error(`Failed to cleanup ${target.path}: ${errorMsg}`);
      }
    }

    this.logger.info(`Cleanup completed. Cleaned: ${result.cleaned.length}, Errors: ${result.errors.length}`);
    return result;
  }

  /**
   * Create backup of file/directory
   */
  private async createBackup(sourcePath: string, target: CleanupTarget, backupDir: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const basename = path.basename(sourcePath);
    const backupPath = path.join(backupDir, `${basename}_${timestamp}`);

    if (target.type === 'file') {
      await fs.copyFile(sourcePath, backupPath);
    } else {
      await this.copyDirectory(sourcePath, backupPath);
    }

    // Create metadata file
    const metadataPath = `${backupPath}.metadata.json`;
    const metadata = {
      originalPath: sourcePath,
      backupTimestamp: timestamp,
      reason: target.reason,
      consolidatedInto: target.consolidatedInto,
      type: target.type
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    this.logger.info(`Created backup: ${backupPath}`);
  }

  /**
   * Remove file or directory
   */
  private async removeTarget(targetPath: string, type: 'file' | 'directory'): Promise<void> {
    if (type === 'file') {
      await fs.unlink(targetPath);
    } else {
      await fs.rmdir(targetPath, { recursive: true });
    }
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(source: string, destination: string): Promise<void> {
    await fs.mkdir(destination, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(backupDir: string): Promise<void> {
    await fs.mkdir(backupDir, { recursive: true });
  }

  /**
   * Check if path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get cleanup summary
   */
  getCleanupSummary(): {
    totalTargets: number;
    requiresBackup: number;
    estimatedSpaceSaved: string;
    targets: CleanupTarget[];
  } {
    return {
      totalTargets: this.cleanupTargets.length,
      requiresBackup: this.cleanupTargets.filter(t => t.backupRequired).length,
      estimatedSpaceSaved: 'TBD', // Could calculate file sizes
      targets: [...this.cleanupTargets]
    };
  }

  /**
   * Rollback from backup
   */
  async rollbackFromBackup(backupDir: string, targetOriginalPath: string): Promise<boolean> {
    try {
      // Find backup metadata
      const backupFiles = await fs.readdir(backupDir);
      const metadataFile = backupFiles.find(f => f.endsWith('.metadata.json'));
      
      if (!metadataFile) {
        throw new Error('No metadata file found for rollback');
      }

      const metadata = JSON.parse(await fs.readFile(path.join(backupDir, metadataFile), 'utf-8'));
      
      if (metadata.originalPath !== targetOriginalPath) {
        throw new Error('Backup metadata does not match target path');
      }

      const backupPath = path.join(backupDir, metadataFile.replace('.metadata.json', ''));
      
      // Restore from backup
      if (metadata.type === 'file') {
        await fs.copyFile(backupPath, targetOriginalPath);
      } else {
        await this.copyDirectory(backupPath, targetOriginalPath);
      }

      this.logger.info(`Rollback successful: ${targetOriginalPath}`);
      return true;
    } catch (error) {
      this.logger.error(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}