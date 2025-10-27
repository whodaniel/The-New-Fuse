import * as fs from 'fs';
import * as path from 'path';
// Conflict 1 Resolution: Use 'Incoming' import
import { Logger } from './logger';

interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// The stub 'export class Logger' (lines 15-20) is removed
// as it conflicts with the import above.

export class LoggingUtilsClean {
  private static logDirectory = path.join(process.cwd(), 'logs');
  private static logFileName = 'application_clean.log';
  
  // Conflict 2 Resolution: Use 'Incoming' static logger
  private static logger = new Logger({
    filePath: path.join(LoggingUtilsClean.logDirectory, LoggingUtilsClean.logFileName),
  });

  static initialize(): void {
    if (!fs.existsSync(LoggingUtilsClean.logDirectory)) {
      fs.mkdirSync(LoggingUtilsClean.logDirectory, { recursive: true });
    }
    console.log('LoggingUtilsClean initialized.');
  }

  /**
   * Refactored to use the new static logger
   */
  static async writeLog(entry: LogEntry): Promise<void> {
    const { level, message, metadata } = entry;
    
    // Use the new logger instance
    try {
      switch (level.toLowerCase()) {
        case 'error':
          LoggingUtilsClean.logger.error(message, metadata);
          break;
        case 'warn':
          LoggingUtilsClean.logger.warn(message, metadata);
          break;
        case 'debug':
          LoggingUtilsClean.logger.debug(message, metadata);
          break;
        case 'info':
        default:
          LoggingUtilsClean.logger.log(message, metadata); // 'log' or 'info'
          break;
      }
    } catch (error) {
      console.error('Failed to write log entry via Logger:', error);
    }
  }

  static async readLogs(): Promise<string> {
    try {
      return await fs.promises.readFile(
        path.join(LoggingUtilsClean.logDirectory, LoggingUtilsClean.logFileName),
        'utf8',
      );
    } catch (error) {
      console.error('Failed to read logs:', error);
      return '';
    }
  }

  static async clearLogs(): Promise<void> {
    try {
      await fs.promises.writeFile(
        path.join(LoggingUtilsClean.logDirectory, LoggingUtilsClean.logFileName),
        '',
      );
      console.log('Logs cleared.');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}