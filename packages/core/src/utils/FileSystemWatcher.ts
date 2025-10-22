import * as chokidar from 'chokidar';
import { Logger } from './logger';

interface FileSystemWatcherOptions {
  paths: string[];
  ignored?: string[];
  depth?: number;
}

export class FileSystemWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private logger: Logger;
  private options: FileSystemWatcherOptions;

  constructor(logger: Logger, options: FileSystemWatcherOptions) {
    this.logger = logger;
    this.options = options;
  }

  start(): void {
    if (this.watcher) {
      this.logger.warn('FileSystemWatcher is already running.');
      return;
    }

    this.logger.info(`Starting FileSystemWatcher for paths: ${this.options.paths.join(', ')}`);
    this.watcher = chokidar.watch(this.options.paths, {
      ignored: this.options.ignored || ['node_modules', '.git', 'dist'],
      depth: this.options.depth,
      persistent: true,
    });

    this.watcher.on('add', (filePath) => {
      this.logger.info(`File added: ${filePath}`);
      // Emit an event or call a callback for file added
    });

    this.watcher.on('change', (filePath) => {
      this.logger.info(`File changed: ${filePath}`);
      // Emit an event or call a callback for file changed
    });

    this.watcher.on('unlink', (filePath) => {
      this.logger.info(`File deleted: ${filePath}`);
      // Emit an event or call a callback for file deleted
    });

    this.watcher.on('error', (error) => {
      this.logger.error(`Watcher error: ${error.message}`);
    });

    this.watcher.on('ready', () => {
      this.logger.info('FileSystemWatcher is ready.');
    });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.logger.info('FileSystemWatcher stopped.');
    } else {
      this.logger.warn('FileSystemWatcher is not running.');
    }
  }
}