import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as util from 'util';
import { CentralizedLoggingService } from './centralized-logging.service.js';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const gzip = util.promisify(zlib.gzip);

export interface LogRotationConfig {
  enabled: boolean;
  directory: string;
  maxSize: number; // in bytes
  maxFiles: number;
  rotateInterval: number; // in milliseconds
  compress: boolean;
}

@Injectable()
export class LogRotationService implements OnModuleInit {
  private config: LogRotationConfig;
  private rotationInterval: NodeJS.Timeout;
  private readonly logger: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService
  ) {
    this.logger = this.loggingService.createLogger('LogRotationService');
  }

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('logging.rotation.enabled', true),
      directory: this.configService.get<string>('logging.file.directory', 'logs'),
      maxSize: this.parseSize(this.configService.get<string>('logging.rotation.maxSize', '10m')),
      maxFiles: this.configService.get<number>('logging.rotation.maxFiles', 14),
      rotateInterval: this.parseInterval(this.configService.get<string>('logging.rotation.interval', '1d')),
      compress: this.configService.get<boolean>('logging.rotation.compress', true)
    };

    if (!this.config.enabled) {
      this.logger.info('Log rotation is disabled');
      return;
    }

    // Ensure log directory exists
    const logDir = path.resolve(process.cwd(), this.config.directory);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Start rotation interval
    this.rotationInterval = setInterval(() => this.rotateAndCleanup(), this.config.rotateInterval);
    
    // Run initial rotation and cleanup
    await this.rotateAndCleanup();
    
    this.logger.info('Log rotation service initialized', {
      metadata: {
        config: {
          directory: this.config.directory,
          maxSize: this.formatSize(this.config.maxSize),
          maxFiles: this.config.maxFiles,
          rotateInterval: this.formatInterval(this.config.rotateInterval),
          compress: this.config.compress
        }
      }
    });
  }

  /**
   * Manually trigger log rotation and cleanup
   */
  async rotateAndCleanup(): Promise<void> {
    try {
      await this.rotateOversizedLogs();
      await this.cleanupOldLogs();
    } catch (error) {
      this.logger.error('Error during log rotation', { error });
    }
  }

  /**
   * Private methods
   */

  private async rotateOversizedLogs(): Promise<void> {
    const logDir = path.resolve(process.cwd(), this.config.directory);
    const files = await readdir(logDir);
    
    for (const file of files) {
      // Skip already rotated/compressed files
      if (file.endsWith('.gz') || file.includes('.rotated.')) {
        continue;
      }
      
      const filePath = path.join(logDir, file);
      const stats = await stat(filePath);
      
      // Check if file exceeds max size
      if (stats.size > this.config.maxSize) {
        await this.rotateLog(filePath);
      }
    }
  }

  private async rotateLog(filePath: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileExt = path.extname(filePath);
    const fileName = path.basename(filePath, fileExt);
    const rotatedPath = path.join(
      path.dirname(filePath),
      `${fileName}.rotated.${timestamp}${fileExt}`
    );
    
    try {
      // Read the file content
      const content = await readFile(filePath);
      
      // Write to rotated file
      await writeFile(rotatedPath, content);
      
      // Compress if enabled
      if (this.config.compress) {
        const compressed = await gzip(content);
        await writeFile(`${rotatedPath}.gz`, compressed);
        
        // Remove uncompressed rotated file
        await unlink(rotatedPath);
        
        this.logger.info(`Rotated and compressed log file: ${path.basename(filePath)} -> ${path.basename(rotatedPath)}.gz`);
      } else {
        this.logger.info(`Rotated log file: ${path.basename(filePath)} -> ${path.basename(rotatedPath)}`);
      }
      
      // Clear the original file
      await writeFile(filePath, '');
      
    } catch (error) {
      this.logger.error(`Failed to rotate log file: ${filePath}`, { error });
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    const logDir = path.resolve(process.cwd(), this.config.directory);
    const files = await readdir(logDir);
    
    // Get all rotated log files
    const rotatedFiles = files.filter(file => 
      file.includes('.rotated.') || 
      (this.config.compress && file.endsWith('.gz'))
    );
    
    // Sort by creation time (oldest first)
    const sortedFiles = await Promise.all(
      rotatedFiles.map(async file => {
        const filePath = path.join(logDir, file);
        const stats = await stat(filePath);
        return { file, path: filePath, ctime: stats.ctime };
      })
    );
    
    sortedFiles.sort((a, b) => a.ctime.getTime() - b.ctime.getTime());
    
    // Remove excess files
    if (sortedFiles.length > this.config.maxFiles) {
      const filesToRemove = sortedFiles.slice(0, sortedFiles.length - this.config.maxFiles);
      
      for (const fileInfo of filesToRemove) {
        try {
          await unlink(fileInfo.path);
          this.logger.info(`Removed old log file: ${fileInfo.file}`);
        } catch (error) {
          this.logger.error(`Failed to remove old log file: ${fileInfo.file}`, { error });
        }
      }
    }
  }

  private parseSize(sizeStr: string): number {
    const units = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024
    };
    
    const match = sizeStr.match(/^(\d+)([bkmg])?$/i);
    if (!match) {
      return 10 * 1024 * 1024; // Default to 10MB
    }
    
    const size = parseInt(match[1], 10);
    const unit = (match[2] || 'b').toLowerCase();
    
    return size * (units[unit as keyof typeof units] || 1);
  }

  private parseInterval(intervalStr: string): number {
    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };
    
    const match = intervalStr.match(/^(\d+)([smhd])?$/i);
    if (!match) {
      return 24 * 60 * 60 * 1000; // Default to 1 day
    }
    
    const value = parseInt(match[1], 10);
    const unit = (match[2] || 'd').toLowerCase();
    
    return value * (units[unit as keyof typeof units] || units.d);
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  private formatInterval(ms: number): string {
    const seconds = ms / 1000;
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = seconds / 60;
    if (minutes < 60) {
      return `${minutes.toFixed(0)}m`;
    }
    
    const hours = minutes / 60;
    if (hours < 24) {
      return `${hours.toFixed(0)}h`;
    }
    
    const days = hours / 24;
    return `${days.toFixed(0)}d`;
  }
}
