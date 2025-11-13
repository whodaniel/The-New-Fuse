/**
 * Node.js-Optimized File System Operations
 *
 * Leverages Node.js file system APIs for
 * fast entity discovery and processing.
 */
export interface FileSystemStats {
    filesRead: number;
    filesWritten: number;
    totalBytes: number;
    averageReadTime: number;
    cacheHits: number;
    cacheMisses: number;
}
export declare class BunOptimizedFileSystem {
    private readonly logger;
    private fileCache;
    private stats;
    /**
     * Fast file reading using Node.js file API with caching
     */
    readFile(filePath: string, useCache?: boolean): Promise<string>;
    /**
     * Check if file exists
     */
    exists(filePath: string): boolean;
    /**
     * Get file statistics
     */
    getFileStats(filePath: string): Promise<any>;
    /**
     * Get system statistics
     */
    getStats(): FileSystemStats;
    /**
     * Clear file cache
     */
    clearCache(): void;
    /**
     * Get cache size
     */
    getCacheSize(): number;
    /**
     * Update read statistics
     */
    private updateReadStats;
    /**
     * Get cache hit ratio
     */
    getCacheHitRatio(): number;
}
//# sourceMappingURL=BunOptimizedFileSystem.d.ts.map