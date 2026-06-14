/**
 * Extension Registry - Central Repository for Extension Metadata
 *
 * Maintains a persistent registry of all extensions, their metadata, and relationships
 * Provides search, filtering, and management capabilities
 */
import { EventEmitter } from 'events';
import { Logger } from '@the-new-fuse/relay-core';
import { UnifiedExtension, ExtensionRegistryEntry, ExtensionReview, ExtensionType, ExtensionCategory, ExtensionStatus } from '../types/ExtensionTypes.js';
export interface ExtensionRegistryConfig {
    registryFile: string;
    enablePersistence: boolean;
    enableReviews: boolean;
    enableDownloadTracking: boolean;
    autoBackup: boolean;
    backupInterval: number;
}
export interface ExtensionSearchQuery {
    name?: string;
    type?: ExtensionType;
    category?: ExtensionCategory;
    status?: ExtensionStatus;
    author?: string;
    keywords?: string[];
    minRating?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'rating' | 'downloads' | 'updated' | 'created';
    sortOrder?: 'asc' | 'desc';
}
export interface ExtensionSearchResult {
    entries: ExtensionRegistryEntry[];
    total: number;
    hasMore: boolean;
}
export declare class ExtensionRegistry extends EventEmitter {
    private logger;
    private config;
    private entries;
    private indexes;
    private initialized;
    constructor(logger: Logger, config?: Partial<ExtensionRegistryConfig>);
    /**
     * Initialize the registry
     */
    initialize(): Promise<void>;
    /**
     * Register a new extension
     */
    registerExtension(extension: UnifiedExtension): Promise<ExtensionRegistryEntry>;
    /**
     * Unregister an extension
     */
    unregisterExtension(extensionId: string): Promise<boolean>;
    /**
     * Get extension entry
     */
    getEntry(extensionId: string): ExtensionRegistryEntry | null;
    /**
     * Get all entries
     */
    getAllEntries(): ExtensionRegistryEntry[];
    /**
     * Search extensions
     */
    searchExtensions(query: ExtensionSearchQuery): ExtensionSearchResult;
    /**
     * Get extensions by type
     */
    getExtensionsByType(type: ExtensionType): ExtensionRegistryEntry[];
    /**
     * Get extensions by category
     */
    getExtensionsByCategory(category: ExtensionCategory): ExtensionRegistryEntry[];
    /**
     * Get extensions by author
     */
    getExtensionsByAuthor(author: string): ExtensionRegistryEntry[];
    /**
     * Get extensions by keyword
     */
    getExtensionsByKeyword(keyword: string): ExtensionRegistryEntry[];
    /**
     * Track download
     */
    trackDownload(extensionId: string): Promise<boolean>;
    /**
     * Add review
     */
    addReview(extensionId: string, review: Omit<ExtensionReview, 'id' | 'createdAt'>): Promise<boolean>;
    /**
     * Get popular extensions
     */
    getPopularExtensions(limit?: number): ExtensionRegistryEntry[];
    /**
     * Get top rated extensions
     */
    getTopRatedExtensions(limit?: number): ExtensionRegistryEntry[];
    /**
     * Get recently updated extensions
     */
    getRecentlyUpdatedExtensions(limit?: number): ExtensionRegistryEntry[];
    /**
     * Get registry statistics
     */
    getStatistics(): {
        totalExtensions: number;
        totalDownloads: number;
        averageRating: number;
        totalReviews: number;
        byType: Record<string, number>;
        byCategory: Record<string, number>;
    };
    /**
     * Private helper methods
     */
    private initializeIndexes;
    private updateIndexes;
    private removeFromIndexes;
    private loadFromFile;
    private saveToFile;
    private startBackupTask;
    private cleanupOldBackups;
    /**
     * Public API Extensions
     */
    exportRegistry(filePath: string): Promise<boolean>;
    importRegistry(filePath: string, merge?: boolean): Promise<boolean>;
    clearRegistry(): Promise<void>;
}
//# sourceMappingURL=ExtensionRegistry.d.ts.map