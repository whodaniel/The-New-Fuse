/**
 * Structured Logger for TNF CLI
 *
 * Provides JSON-formatted logging with trace ID support,
 * compatible with centralized logging systems.
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { CLIConfig, LogEntry } from './types.js';

export class Logger {
  private config: CLIConfig['logging'];
  private agentId?: string;
  private logBuffer: LogEntry[] = [];
  private flushInterval?: NodeJS.Timeout;

  constructor(config: CLIConfig['logging'], agentId?: string) {
    this.config = config;
    this.agentId = agentId;

    if (this.config.output === 'file' || this.config.output === 'both') {
      this.ensureLogFileExists();
      this.startFlushInterval();
    }
  }

  private ensureLogFileExists(): void {
    if (!this.config.filePath) return;

    const dir = dirname(this.config.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 1000);
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: context?.traceId || this.generateTraceId(),
      agentId: this.agentId,
      context: this.sanitizeContext(context),
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    // Remove sensitive data
    const sanitized = { ...context };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    delete sanitized.secret;

    return sanitized;
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    // Pretty format
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelColor = this.getLevelColor(entry.level);
    const traceStr =
      this.config.includeTraceId && entry.traceId ? ` [${entry.traceId.slice(0, 8)}]` : '';

    let output = `${timestamp} ${levelColor}[${entry.level.toUpperCase()}]${traceStr} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  private getLevelColor(level: LogEntry['level']): string {
    // ANSI color codes
    const colors: Record<string, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';

    return this.config.format === 'pretty' ? colors[level] || '' : '';
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= configLevelIndex;
  }

  private output(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);

    if (this.config.output === 'console' || this.config.output === 'both') {
      console.log(formatted);
    }

    if (this.config.output === 'file' || this.config.output === 'both') {
      this.logBuffer.push(entry);
    }
  }

  private flush(): void {
    if (this.logBuffer.length === 0 || !this.config.filePath) return;

    try {
      const lines = this.logBuffer.map((e) => JSON.stringify(e)).join('\n') + '\n';
      appendFileSync(this.config.filePath, lines);
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  // Public API
  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;
    this.output(this.createLogEntry('debug', message, context));
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;
    this.output(this.createLogEntry('info', message, context));
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog('warn')) return;
    this.output(this.createLogEntry('warn', message, context, error));
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog('error')) return;
    this.output(this.createLogEntry('error', message, context, error));
  }

  withContext(context: Record<string, any>): ContextualLogger {
    return new ContextualLogger(this, context);
  }

  setAgentId(agentId: string): void {
    this.agentId = agentId;
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

export class ContextualLogger {
  constructor(
    private logger: Logger,
    private context: Record<string, any>
  ) {}

  debug(message: string, additionalContext?: Record<string, any>): void {
    this.logger.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: Record<string, any>): void {
    this.logger.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: Record<string, any>, error?: Error): void {
    this.logger.warn(message, { ...this.context, ...additionalContext }, error);
  }

  error(message: string, additionalContext?: Record<string, any>, error?: Error): void {
    this.logger.error(message, { ...this.context, ...additionalContext }, error);
  }
}

// Default logger instance
let defaultLogger: Logger | null = null;

export function createLogger(config: CLIConfig['logging'], agentId?: string): Logger {
  return new Logger(config, agentId);
}

export function getDefaultLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger({
      level: 'info',
      format: 'pretty',
      output: 'console',
      includeTraceId: true,
    });
  }
  return defaultLogger;
}

export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger;
}
