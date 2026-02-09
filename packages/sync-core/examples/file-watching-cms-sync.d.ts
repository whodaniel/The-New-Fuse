/**
 * File Watching and CMS Synchronization Example
 *
 * Shows how to use sync-core for file system monitoring
 * and automatic content synchronization with CMS.
 */
import { OnModuleInit } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';
import { EnhancedFileSystemWatcher } from '../src/services/EnhancedFileSystemWatcher';
export declare class CMSSyncService implements OnModuleInit {
    private readonly syncOrchestrator;
    private readonly fileWatcher;
    private contentPath;
    private configPath;
    constructor(syncOrchestrator: SyncOrchestrator, fileWatcher: EnhancedFileSystemWatcher);
    onModuleInit(): Promise<void>;
    /**
     * Initialize file system watching for content and config
     */
    private initializeFileWatching;
    /**
     * Handle content file changes
     */
    private handleContentChange;
    /**
     * Handle config file changes
     */
    private handleConfigChange;
    /**
     * Sync content file to CMS and across instances
     */
    private syncContentFile;
    /**
     * Sync config file globally
     */
    private syncConfigFile;
    /**
     * Remove content file from sync
     */
    private removeContentFile;
    /**
     * Parse content file based on type
     */
    private parseContentFile;
    /**
     * Parse markdown frontmatter
     */
    private parseMarkdownFrontmatter;
    /**
     * Calculate file checksum
     */
    private calculateChecksum;
    /**
     * Get relative path
     */
    private getRelativePath;
    /**
     * Update CMS database
     */
    private updateCMSDatabase;
    /**
     * Remove CMS content
     */
    private removeCMSContent;
    /**
     * Trigger application reload after config change
     */
    private triggerReload;
    /**
     * Manual sync all content
     */
    syncAllContent(): Promise<void>;
    /**
     * Find all content files
     */
    private findAllContentFiles;
    /**
     * Get sync statistics
     */
    getSyncStats(): {
        totalSyncs: number;
        fileChanges: number;
        successRate: number;
        avgLatency: number;
    };
}
//# sourceMappingURL=file-watching-cms-sync.d.ts.map