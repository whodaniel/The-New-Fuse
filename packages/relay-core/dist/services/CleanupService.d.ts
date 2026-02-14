/**
 * Cleanup Service for The New Fuse Framework
 *
 * Manages cleanup of old tributary files after consolidation
 * Implements safe file removal with backup and rollback capabilities
 */
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
export declare class CleanupService {
    private logger;
    private workspaceRoot;
    private cleanupTargets;
    constructor(workspaceRoot: string, logger: Logger);
    /**
     * Add file/directory to cleanup queue
     */
    addCleanupTarget(target: CleanupTarget): void;
    /**
     * Add multiple cleanup targets for relay consolidation
     */
    addRelayConsolidationTargets(): void;
    /**
     * Execute cleanup with safety checks
     */
    executeCleanup(options: CleanupOptions): Promise<{
        success: boolean;
        cleaned: string[];
        backed_up: string[];
        errors: Array<{
            path: string;
            error: string;
        }>;
    }>;
    /**
     * Create backup of file/directory
     */
    private createBackup;
    /**
     * Remove file or directory
     */
    private removeTarget;
    /**
     * Copy directory recursively
     */
    private copyDirectory;
    /**
     * Ensure backup directory exists
     */
    private ensureBackupDirectory;
    /**
     * Check if path exists
     */
    private pathExists;
    /**
     * Get cleanup summary
     */
    getCleanupSummary(): {
        totalTargets: number;
        requiresBackup: number;
        estimatedSpaceSaved: string;
        targets: CleanupTarget[];
    };
    /**
     * Rollback from backup
     */
    rollbackFromBackup(backupDir: string, targetOriginalPath: string): Promise<boolean>;
}
//# sourceMappingURL=CleanupService.d.ts.map