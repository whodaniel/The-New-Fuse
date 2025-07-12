

/**
 * Logger for The New Fuse Relay System
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private logLevel: LogLevel;
  private workspaceDir: string;
  private logPath: string;

  constructor(logLevel: LogLevel, workspaceDir: string) {
    this.logLevel = logLevel;
    this.workspaceDir = workspaceDir;
    this.logPath = path.join(this.workspaceDir, 'relay.log');
  }

  private async log(level: LogLevel, message: string): Promise<void> {
    if (this.getLogLevelNumber(level) < this.getLogLevelNumber(this.logLevel)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    console.log(logEntry.trim());

    try {
      await fs.appendFile(this.logPath, logEntry);
    } catch (error) {
      console.error('Logging error:', error);
    }
  }

  debug(message: string): void {
    this.log('debug', message);
  }

  info(message: string): void {
    this.log('info', message);
  }

  warn(message: string): void {
    this.log('warn', message);
  }

  error(message: string): void {
    this.log('error', message);
  }

  private getLogLevelNumber(level: LogLevel): number {
    switch (level) {
      case 'debug':
        return 0;
      case 'info':
        return 1;
      case 'warn':
        return 2;
      case 'error':
        return 3;
      default:
        return 1;
    }
  }
}

