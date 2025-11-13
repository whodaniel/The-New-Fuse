"use strict";
/**
 * Node.js-Optimized File System Operations
 *
 * Leverages Node.js file system APIs for
 * fast entity discovery and processing.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BunOptimizedFileSystem_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BunOptimizedFileSystem = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const fs_2 = require("fs");
let BunOptimizedFileSystem = BunOptimizedFileSystem_1 = class BunOptimizedFileSystem {
    logger = new common_1.Logger(BunOptimizedFileSystem_1.name);
    fileCache = new Map();
    stats = {
        filesRead: 0,
        filesWritten: 0,
        totalBytes: 0,
        averageReadTime: 0,
        cacheHits: 0,
        cacheMisses: 0
    };
    /**
     * Fast file reading using Node.js file API with caching
     */
    async readFile(filePath, useCache = true) {
        const startTime = performance.now();
        try {
            // Check cache first if enabled
            if (useCache && this.fileCache.has(filePath)) {
                const cached = this.fileCache.get(filePath);
                const fileStats = await fs_1.promises.stat(filePath);
                // Check if file hasn't been modified
                if (fileStats.mtime.getTime() === cached.mtime) {
                    this.stats.cacheHits++;
                    return cached.content;
                }
                else {
                    // Remove stale cache entry
                    this.fileCache.delete(filePath);
                }
            }
            // Use Node.js file reading
            const content = await fs_1.promises.readFile(filePath, 'utf-8');
            const fileStats = await fs_1.promises.stat(filePath);
            // Update cache
            if (useCache) {
                this.fileCache.set(filePath, {
                    content,
                    mtime: fileStats.mtime.getTime(),
                    size: fileStats.size
                });
            }
            // Update statistics
            this.updateReadStats(startTime, fileStats.size);
            this.stats.cacheMisses++;
            return content;
        }
        catch (error) {
            this.logger.error(`Failed to read file ${filePath}:, error);
      throw error;
    }
  }

  /**
   * Fast file writing using Node.js write API
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const startTime = performance.now();

    try {
      // Use Node.js file writing
      await fs.writeFile(filePath, content, 'utf-8');

      // Update cache
      const fileStats = await fs.stat(filePath);
      this.fileCache.set(filePath, {
        content,
        mtime: fileStats.mtime.getTime(),
        size: fileStats.size
      });

      // Update statistics
      const duration = performance.now() - startTime;
      this.stats.filesWritten++;
      this.stats.totalBytes += content.length;
`, this.logger.debug(`Wrote file ${filePath}` in $, { duration, : .toFixed(2) }, ms));
        }
        try { }
        catch (error) {
            `
      this.logger.error(`;
            Failed;
            to;
            write;
            file;
            $;
            {
                filePath;
            }
            `:, error);
      throw error;
    }
  }

  /**
   * Batch read multiple files in parallel
   */
  async readFiles(filePaths: string[], useCache: boolean = true): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    // Read files in parallel with concurrency limit
    const batchSize = 10;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (filePath) => {
          try {
            const content = await this.readFile(filePath, useCache);
            return { filePath, content };
          } catch (error) {
            this.logger.warn(Skipping file ${filePath}: ${error});
            return null;
          }
        })
      );

      batchResults.forEach(result => {
        if (result) {
          results.set(result.filePath, result.content);
        }
      });
    }

    return results;
  }

  /**
   * Find files matching a pattern
   */
  async findFiles(pattern: string, cwd: string = process.cwd()): Promise<string[]> {
    try {
      const files = await glob(pattern, {
        cwd,
        absolute: true,
        nodir: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
      });

      return files;
    } catch (error) {`;
            this.logger.error(Failed, to, find, files, matching, $, { pattern } `:`, error);
            return [];
        }
    }
    /**
     * Check if file exists
     */
    exists(filePath) {
        return (0, fs_2.existsSync)(filePath);
    }
    /**
     * Get file statistics
     */
    async getFileStats(filePath) {
        return await fs_1.promises.stat(filePath);
    }
    /**
     * Get system statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Clear file cache
     */
    clearCache() {
        this.fileCache.clear();
        this.logger.log('File cache cleared');
    }
    /**
     * Get cache size
     */
    getCacheSize() {
        return this.fileCache.size;
    }
    /**
     * Update read statistics
     */
    updateReadStats(startTime, fileSize) {
        const duration = performance.now() - startTime;
        this.stats.filesRead++;
        this.stats.totalBytes += fileSize;
        // Calculate rolling average
        const totalReadTime = this.stats.averageReadTime * (this.stats.filesRead - 1) + duration;
        this.stats.averageReadTime = totalReadTime / this.stats.filesRead;
    }
    /**
     * Get cache hit ratio
     */
    getCacheHitRatio() {
        const totalAccesses = this.stats.cacheHits + this.stats.cacheMisses;
        return totalAccesses > 0 ? this.stats.cacheHits / totalAccesses : 0;
    }
};
exports.BunOptimizedFileSystem = BunOptimizedFileSystem;
exports.BunOptimizedFileSystem = BunOptimizedFileSystem = BunOptimizedFileSystem_1 = __decorate([
    (0, common_1.Injectable)()
], BunOptimizedFileSystem);
//# sourceMappingURL=BunOptimizedFileSystem.js.map