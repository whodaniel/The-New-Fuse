/**
 * The New Fuse VSCode Extension - Logger Utility
 * Version 9.0.0 - Clean Architecture
 */

import * as vscode from 'vscode';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

/**
 * Simple, unified logging service for the extension
 */
class Logger {
  private static instance: Logger;
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = 'info';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('The New Fuse');
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const levelIcon = {
      debug: '🔍',
      info: '📘',
      warn: '⚠️',
      error: '❌',
    }[level];

    let formatted = `[${timestamp}] ${levelIcon} ${level.toUpperCase()}: ${message}`;

    if (data !== undefined) {
      try {
        formatted += `\n  Data: ${JSON.stringify(data, null, 2)}`;
      } catch {
        formatted += `\n  Data: [Unable to serialize]`;
      }
    }

    return formatted;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Write to output channel
    const formatted = this.formatMessage(level, message, data);
    this.outputChannel.appendLine(formatted);

    // Also log to console in development
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | unknown): void {
    const errorData =
      error instanceof Error ? { message: error.message, stack: error.stack } : error;
    this.log('error', message, errorData);
  }

  show(): void {
    this.outputChannel.show();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
    this.outputChannel.clear();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions
export const log = {
  debug: (msg: string, data?: unknown) => logger.debug(msg, data),
  info: (msg: string, data?: unknown) => logger.info(msg, data),
  warn: (msg: string, data?: unknown) => logger.warn(msg, data),
  error: (msg: string, err?: Error | unknown) => logger.error(msg, err),
  show: () => logger.show(),
};
