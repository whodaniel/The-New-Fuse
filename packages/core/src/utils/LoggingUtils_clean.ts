import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export class Logger {
    constructor(private context: string) {}
    error(message: string, metadata?: Record<string, unknown>) {
        console.error(this.context, message, metadata);
    }
}

export class LoggingUtilsClean {
  private static logDirectory = path.join(process.cwd(), 'logs');
  private static logFileName = 'application_clean.log';

  static initialize(): void {
    if (!fs.existsSync(LoggingUtilsClean.logDirectory)) {
      fs.mkdirSync(LoggingUtilsClean.logDirectory, { recursive: true });
    }
    console.log('LoggingUtilsClean initialized.');
  }

  static async writeLog(entry: LogEntry): Promise<void> {
    const logLine = `${entry.timestamp.toISOString()} [${entry.level.toUpperCase()}] ${entry.message} ${entry.metadata ? JSON.stringify(entry.metadata) : ''}\n`;
    try {
      await fs.promises.appendFile(path.join(LoggingUtilsClean.logDirectory, LoggingUtilsClean.logFileName), logLine);
    } catch (error) {
      console.error('Failed to write log entry:', error);
    }
  }

  static async readLogs(): Promise<string> {
    try {
      return await fs.promises.readFile(path.join(LoggingUtilsClean.logDirectory, LoggingUtilsClean.logFileName), 'utf8');
    } catch (error) {
      console.error('Failed to read logs:', error);
      return '';
    }
  }

  static async clearLogs(): Promise<void> {
    try {
      await fs.promises.writeFile(path.join(LoggingUtilsClean.logDirectory, LoggingUtilsClean.logFileName), '');
      console.log('Logs cleared.');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}
