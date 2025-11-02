import * as chokidar from 'chokidar';
import * as path from 'path';
import { Logger } from './logger';
   * Defaults to ['
      directories: options.directories || ['.'
      ignored: options.ignored || [/**/node_modules/**', /**/dist/**', /**/build/**'
      this.logger.warn('FileSystemWatcher is already running'
    this.logger.info('Starting FileSystemWatcher'
      this.watcher.on('add'
            'create'
            'File created'
      this.watcher.on('change'
            'modify'
            'File modified'
      this.watcher.on('unlink'
            'delete'
            'File deleted'
    this.watcher.on('')
      this.logger.warn('FileSystemWatcher is not running'
    this.logger.info('')