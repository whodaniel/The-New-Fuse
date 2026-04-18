/**
 * File Watching and CMS Synchronization Example
 *
 * Shows how to use sync-core for file system monitoring
 * and automatic content synchronization with CMS.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator.js';
import { EnhancedFileSystemWatcher } from '../src/services/EnhancedFileSystemWatcher';
import * as path from 'path';
import * as fs from 'fs/promises';

interface ContentFile {
  path: string;
  type: 'markdown' | 'json' | 'yaml' | 'config';
  content: string;
  metadata?: {
    title?: string;
    author?: string;
    tags?: string[];
    publishedAt?: Date;
  };
  lastModified: Date;
  checksum: string;
}

@Injectable()
export class CMSSyncService implements OnModuleInit {
  private contentPath = './content';
  private configPath = './config';

  constructor(
    private readonly syncOrchestrator: SyncOrchestrator,
    private readonly fileWatcher: EnhancedFileSystemWatcher,
  ) {}

  async onModuleInit() {
    await this.initializeFileWatching();
  }

  /**
   * Initialize file system watching for content and config
   */
  private async initializeFileWatching() {
    // Watch content directory
    await this.fileWatcher.watchPath(
      this.contentPath,
      this.handleContentChange.bind(this),
      {
        recursive: true,
        filter: /\.(md|json|yaml)$/,
        debounce: 500, // Wait 500ms before processing
      }
    );

    // Watch config directory
    await this.fileWatcher.watchPath(
      this.configPath,
      this.handleConfigChange.bind(this),
      {
        recursive: false,
        filter: /\.json$/,
        debounce: 1000,
      }
    );

    console.log('File watching initialized for CMS sync');
  }

  /**
   * Handle content file changes
   */
  private async handleContentChange(event: {
    type: 'add' | 'change' | 'unlink';
    path: string;
  }) {
    console.log(`Content file ${event.type}: ${event.path}`);

    try {
      switch (event.type) {
        case 'add':
        case 'change':
          await this.syncContentFile(event.path);
          break;
        case 'unlink':
          await this.removeContentFile(event.path);
          break;
      }
    } catch (error) {
      console.error(`Error handling content change for ${event.path}:`, error);
    }
  }

  /**
   * Handle config file changes
   */
  private async handleConfigChange(event: {
    type: 'add' | 'change' | 'unlink';
    path: string;
  }) {
    console.log(`Config file ${event.type}: ${event.path}`);

    try {
      if (event.type !== 'unlink') {
        await this.syncConfigFile(event.path);

        // Trigger application reload
        await this.triggerReload(event.path);
      }
    } catch (error) {
      console.error(`Error handling config change for ${event.path}:`, error);
    }
  }

  /**
   * Sync content file to CMS and across instances
   */
  private async syncContentFile(filePath: string) {
    // Read file
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    // Parse content and metadata
    const contentFile = await this.parseContentFile(filePath, content, stats);

    // Calculate checksum
    contentFile.checksum = this.calculateChecksum(content);

    // Sync globally (CMS content is tenant-independent)
    await this.syncOrchestrator.syncGlobalData(
      'cms_content',
      {
        path: this.getRelativePath(filePath),
        ...contentFile,
      }
    );

    // Update CMS database
    await this.updateCMSDatabase(contentFile);

    console.log(`Content synced: ${filePath}`);
  }

  /**
   * Sync config file globally
   */
  private async syncConfigFile(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(content);

    // Sync configuration globally
    await this.syncOrchestrator.syncGlobalData(
      'config',
      {
        path: this.getRelativePath(filePath),
        config,
        updatedAt: new Date(),
      }
    );

    console.log(`Config synced: ${filePath}`);
  }

  /**
   * Remove content file from sync
   */
  private async removeContentFile(filePath: string) {
    await this.syncOrchestrator.syncGlobalData(
      'cms_content',
      {
        path: this.getRelativePath(filePath),
        deleted: true,
        deletedAt: new Date(),
      }
    );

    await this.removeCMSContent(this.getRelativePath(filePath));

    console.log(`Content removed: ${filePath}`);
  }

  /**
   * Parse content file based on type
   */
  private async parseContentFile(
    filePath: string,
    content: string,
    stats: any
  ): Promise<ContentFile> {
    const ext = path.extname(filePath).toLowerCase();
    let type: ContentFile['type'];
    let metadata: ContentFile['metadata'] = {};

    switch (ext) {
      case '.md':
        type = 'markdown';
        metadata = this.parseMarkdownFrontmatter(content);
        break;
      case '.json':
        type = 'json';
        const parsed = JSON.parse(content);
        metadata = parsed.metadata || {};
        break;
      case '.yaml':
      case '.yml':
        type = 'yaml';
        // Would use yaml parser here
        break;
      default:
        type = 'config';
    }

    return {
      path: filePath,
      type,
      content,
      metadata,
      lastModified: stats.mtime,
      checksum: '',
    };
  }

  /**
   * Parse markdown frontmatter
   */
  private parseMarkdownFrontmatter(content: string): ContentFile['metadata'] {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) return {};

    const frontmatter = match[1];
    const metadata: any = {};

    // Simple YAML parsing (use proper yaml library in production)
    frontmatter.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        metadata[key.trim()] = value;
      }
    });

    return metadata;
  }

  /**
   * Calculate file checksum
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get relative path
   */
  private getRelativePath(filePath: string): string {
    return path.relative(process.cwd(), filePath);
  }

  /**
   * Update CMS database
   */
  private async updateCMSDatabase(contentFile: ContentFile) {
    // Update database with content
    console.log('Updating CMS database:', contentFile.path);

    // Implementation would use your CMS database
    // await this.cmsRepository.upsert({
    //   path: contentFile.path,
    //   content: contentFile.content,
    //   metadata: contentFile.metadata,
    //   checksum: contentFile.checksum,
    //   lastModified: contentFile.lastModified,
    // });
  }

  /**
   * Remove CMS content
   */
  private async removeCMSContent(path: string) {
    console.log('Removing CMS content:', path);

    // await this.cmsRepository.delete({ path });
  }

  /**
   * Trigger application reload after config change
   */
  private async triggerReload(configPath: string) {
    // Broadcast reload signal
    await this.syncOrchestrator.syncGlobalData(
      'system_event',
      {
        type: 'CONFIG_RELOAD',
        configPath: this.getRelativePath(configPath),
        timestamp: new Date(),
      }
    );

    console.log(`Reload triggered for config: ${configPath}`);
  }

  /**
   * Manual sync all content
   */
  async syncAllContent() {
    console.log('Starting full content sync...');

    const files = await this.findAllContentFiles(this.contentPath);

    for (const file of files) {
      await this.syncContentFile(file);
    }

    console.log(`Full content sync completed: ${files.length} files`);
  }

  /**
   * Find all content files
   */
  private async findAllContentFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function scan(directory: string) {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (/\.(md|json|yaml)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    await scan(dir);
    return files;
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    const metrics = this.syncOrchestrator.getMetrics();

    return {
      totalSyncs: metrics.operations.sync,
      fileChanges: metrics.operations.fileChanges,
      successRate: metrics.performance.successRate,
      avgLatency: metrics.performance.avgSyncLatency,
    };
  }
}
