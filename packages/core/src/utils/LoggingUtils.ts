import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger.js';

interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export class LoggingUtils {
  private static logDirectory = path.join(process.cwd(), 'logs');
  private static logFileName = 'application.log';
  private static logger = new Logger('LoggingUtils');

  static initialize(): void {
    if (!fs.existsSync(LoggingUtils.logDirectory)) {
      fs.mkdirSync(LoggingUtils.logDirectory, { recursive: true });
    }
    LoggingUtils.logger.info('LoggingUtils initialized.');
  }

  static async writeLog(entry: LogEntry): Promise<void> {
    const logLine = `${entry.timestamp.toISOString()} [${entry.level.toUpperCase()}] ${entry.message} ${entry.metadata ? JSON.stringify(entry.metadata) : ''}\n`;
    try {
      await fs.promises.appendFile(path.join(LoggingUtils.logDirectory, LoggingUtils.logFileName), logLine);
    } catch (error) {
      console.error('Failed to write log entry:', error);
    }
  }

  static async readLogs(): Promise<string> {
    try {
      return await fs.promises.readFile(path.join(LoggingUtils.logDirectory, LoggingUtils.logFileName), 'utf8');
    } catch (error) {
      console.error('Failed to read logs:', error);
      return '';
    }
  }

  static async clearLogs(): Promise<void> {
    try {
      await fs.promises.writeFile(path.join(LoggingUtils.logDirectory, LoggingUtils.logFileName), '');
      LoggingUtils.logger.info('Logs cleared.');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}