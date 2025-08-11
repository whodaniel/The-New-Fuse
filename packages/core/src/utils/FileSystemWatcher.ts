import * as chokidar from 'chokidar';
import * as path from 'path';
import { Logger } from './logger';
interface FileSystemWatcherOptions {
  // Implementation needed
}
  paths: string[];
  ignored?: string[];
  depth?: number;
}

export class FileSystemWatcher {
  // Implementation needed
}
  private watcher: chokidar.FSWatcher | null = null;
  private logger: Logger;
  private options: FileSystemWatcherOptions;
  constructor(logger: Logger, options: FileSystemWatcherOptions) {
  // Implementation needed
}
    this.logger = logger;
    this.options = options;
  }

  start(): void {
  // Implementation needed
}
    if (this.watcher) {
  // Implementation needed
}
      this.logger.warn('FileSystemWatcher is already running.');
      return;
    }

    this.logger.info(`Starting FileSystemWatcher for paths: ${this.options.paths.join(', ')}`);
    this.watcher = chokidar.watch(this.options.paths, {
  // Implementation needed
}
      ignored: this.options.ignored || ['node_modules', '.git', 'dist'],
      depth: this.options.depth,
      persistent: true,
    });
    this.watcher.on('add', (filePath) => {
  // Implementation needed
}
      this.logger.info(`File added: ${filePath}`);
      // Emit an event or call a callback for file added
    });
    this.watcher.on('change', (filePath) => {
  // Implementation needed
}
      this.logger.info(`File changed: ${filePath}`);
      // Emit an event or call a callback for file changed
    });
    this.watcher.on('unlink', (filePath) => {
  // Implementation needed
}
      this.logger.info(`File deleted: ${filePath}`);
      // Emit an event or call a callback for file deleted
    });
    this.watcher.on('error', (error) => {
  // Implementation needed
}
      this.logger.error(`Watcher error: ${error.message}`);
    });
    this.watcher.on('ready', () => {
  // Implementation needed
}
      this.logger.info('FileSystemWatcher is ready.');
    });
  }

  stop(): void {
  // Implementation needed
}
    if (this.watcher) {
  // Implementation needed
}
      this.watcher.close();
      this.watcher = null;
      this.logger.info('FileSystemWatcher stopped.');
    } else {
  // Implementation needed
}
      this.logger.warn('FileSystemWatcher is not running.');
    }
  }
}