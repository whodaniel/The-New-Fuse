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
     * Create backup of file/directory
     */
    private createBackup;
}
//# sourceMappingURL=CleanupService.d.ts.map