import * as fs from 'fs/promises';
import * as path from 'path';
import { DEFAULT_LOG_CONFIG, LogConfig, LogLevel } from './types';

/**
 * Unified Logging Service for The New Fuse
 *
 * Provides consistent logging across all workspace packages.
 * Supports console output, file persistence, and metadata.
 */
export class UnifiedLoggingService {
  private config: LogConfig;
  private logPath: string;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = { ...DEFAULT_LOG_CONFIG, ...config };
    this.logPath = path.join(
      this.config.workspaceDir || process.cwd(),
      this.config.logFileName || 'tnf.log'
    );
  }

  private async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (this.getLogLevelNumber(level) < this.getLogLevelNumber(this.config.level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const metaString = metadata ? ` ${JSON.stringify(metadata)}` : '';
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}\n`;

    if (this.config.enableConsole) {
      if (level === 'error') {
        process.stderr.write(logEntry);
      } else {
        process.stdout.write(logEntry);
      }
    }

    if (this.config.enableFile) {
      try {
        await fs.mkdir(path.dirname(this.logPath), { recursive: true });
        await fs.appendFile(this.logPath, logEntry);
      } catch (error) {
        process.stderr.write(`[Logging-Internal-Error] Failed to write to log file: ${error}\n`);
      }
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    void this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    void this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    void this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    void this.log('error', message, metadata);
  }

  private getLogLevelNumber(level: LogLevel): number {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] ?? 1;
  }
}

/**
 * Global default logger instance
 */
export const logger = new UnifiedLoggingService();
