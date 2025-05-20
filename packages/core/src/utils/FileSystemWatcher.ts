import * as chokidar from 'chokidar';
import * as path from 'path';
import { Logger } from './logger.js';
import { FileChangeTracker } from './LoggingUtils.js';

/**
 * Options for the FileSystemWatcher
 */
export interface FileSystemWatcherOptions {
  /**
   * Directories to watch
   * Defaults to ['.']
   */
  directories?: string[];
  
  /**
   * File patterns to ignore
   * Defaults to node_modules, dist, build, and .git directories
   */
  ignored?: string[] | RegExp;
  
  /**
   * Whether to watch for file additions
   * Defaults to true
   */
  watchAdditions?: boolean;
  
  /**
   * Whether to watch for file changes
   * Defaults to true
   */
  watchChanges?: boolean;
  
  /**
   * Whether to watch for file deletions
   * Defaults to true
   */
  watchDeletions?: boolean;
  
  /**
   * Whether to automatically track changes with FileChangeTracker
   * Defaults to true
   */
  autoTrack?: boolean;
}

/**
 * A utility for watching file system changes and logging them
 */
export class FileSystemWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private logger = new Logger(FileSystemWatcher.name);
  private options: Required<FileSystemWatcherOptions>;
  private isWatching = false;

  /**
   * Create a new FileSystemWatcher
   * 
   * @param options - Options for the watcher
   */
  constructor(options: FileSystemWatcherOptions = {}) {
    this.options = {
      directories: options.directories || ['.'],
      ignored: options.ignored || ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
      watchAdditions: options.watchAdditions !== false,
      watchChanges: options.watchChanges !== false,
      watchDeletions: options.watchDeletions !== false,
      autoTrack: options.autoTrack !== false
    };
  }

  /**
   * Start watching for file system changes
   */
  public start(): void {
    if (this.isWatching) {
      this.logger.warn('FileSystemWatcher is already running');
      return;
    }

    this.logger.info('Starting FileSystemWatcher');
    
    const watchPaths = this.options.directories.map(dir => path.resolve(process.cwd(), dir));
    
    this.watcher = chokidar.watch(watchPaths, {
      ignored: this.options.ignored,
      persistent: true,
      ignoreInitial: true
    });

    if (this.options.watchAdditions) {
      this.watcher.on('add', (filePath) => {
        const relativePath = path.relative(process.cwd(), filePath);
        this.logger.debug(`File added: ${relativePath}`);
        
        if (this.options.autoTrack) {
          FileChangeTracker.trackChange(
            relativePath,
            'create',
            'File created'
          );
        }
      });
    }

    if (this.options.watchChanges) {
      this.watcher.on('change', (filePath) => {
        const relativePath = path.relative(process.cwd(), filePath);
        this.logger.debug(`File changed: ${relativePath}`);
        
        if (this.options.autoTrack) {
          FileChangeTracker.trackChange(
            relativePath,
            'modify',
            'File modified'
          );
        }
      });
    }

    if (this.options.watchDeletions) {
      this.watcher.on('unlink', (filePath) => {
        const relativePath = path.relative(process.cwd(), filePath);
        this.logger.debug(`File deleted: ${relativePath}`);
        
        if (this.options.autoTrack) {
          FileChangeTracker.trackChange(
            relativePath,
            'delete',
            'File deleted'
          );
        }
      });
    }

    this.watcher.on('error', (error) => {
      this.logger.error(`Watcher error: ${error}`);
    });

    this.isWatching = true;
  }

  /**
   * Stop watching for file system changes
   */
  public async stop(): Promise<void> {
    if (!this.isWatching || !this.watcher) {
      this.logger.warn('FileSystemWatcher is not running');
      return;
    }

    this.logger.info('Stopping FileSystemWatcher');
    
    await this.watcher.close();
    this.watcher = null;
    this.isWatching = false;
  }

  /**
   * Check if the watcher is running
   * 
   * @returns True if the watcher is running, false otherwise
   */
  public isRunning(): boolean {
    return this.isWatching;
  }
}
