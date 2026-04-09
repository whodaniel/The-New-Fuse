/**
 * Logger utility for Cloudflare Workers
 * Provides structured logging with different levels and context
 */

import type { Env } from '../types/env';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  [key: string]: any;
}

export class Logger {
  private logLevel: LogLevel;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.logLevel = this.getLogLevel(env.LOGGING_LEVEL || 'INFO');
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      environment: this.env.ENVIRONMENT || 'unknown',
      ...(context && { context })
    };
    return JSON.stringify(logEntry);
  }

  private async sendToExternalLogger(level: string, message: string, context?: LogContext): Promise<void> {
    // Send to external logging service if configured
    if (this.env.METRICS_ENDPOINT) {
      try {
        await fetch(`${this.env.METRICS_ENDPOINT}/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            message,
            context,
            timestamp: new Date().toISOString(),
            source: 'cloudflare-worker'
          })
        });
      } catch (error) {
        // Don't throw here to avoid logging loops
        console.error('Failed to send log to external service:', error);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formattedMessage = this.formatMessage('DEBUG', message, context);
    console.debug(formattedMessage);
    
    // Only send non-debug logs to external services in production
    if (this.env.ENVIRONMENT !== 'production') {
      this.sendToExternalLogger('DEBUG', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formattedMessage = this.formatMessage('INFO', message, context);
    console.log(formattedMessage);
    this.sendToExternalLogger('INFO', message, context);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formattedMessage = this.formatMessage('WARN', message, context);
    console.warn(formattedMessage);
    this.sendToExternalLogger('WARN', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const errorContext = {
      ...context,
      ...(error && {
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown'
        }
      })
    };
    
    const formattedMessage = this.formatMessage('ERROR', message, errorContext);
    console.error(formattedMessage);
    this.sendToExternalLogger('ERROR', message, errorContext);
  }

  // Convenience methods for common logging patterns
  httpRequest(method: string, url: string, statusCode: number, duration: number): void {
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration,
      type: 'http_request'
    });
  }

  businessEvent(eventType: string, source: string, eventId: string, processingTime: number): void {
    this.info('Business Event Processed', {
      eventType,
      source,
      eventId,
      processingTime,
      type: 'business_event'
    });
  }

  webhookReceived(source: string, eventType: string, payload: any): void {
    this.info('Webhook Received', {
      source,
      eventType,
      payloadSize: JSON.stringify(payload).length,
      type: 'webhook_received'
    });
  }

  mcpAction(action: string, success: boolean, duration: number): void {
    this.info('MCP Action', {
      action,
      success,
      duration,
      type: 'mcp_action'
    });
  }

  sseMessage(subscriberId: string, eventType: string, messageSize: number): void {
    this.debug('SSE Message Sent', {
      subscriberId,
      eventType,
      messageSize,
      type: 'sse_message'
    });
  }

  aiInsight(insightType: string, confidence: number, processingTime: number): void {
    this.info('AI Insight Generated', {
      insightType,
      confidence,
      processingTime,
      type: 'ai_insight'
    });
  }

  securityEvent(eventType: string, severity: string, details: any): void {
    this.warn('Security Event', {
      eventType,
      severity,
      details,
      type: 'security_event'
    });
  }

  performanceMetric(metric: string, value: number, unit: string): void {
    this.debug('Performance Metric', {
      metric,
      value,
      unit,
      type: 'performance_metric'
    });
  }

  // Create child logger with additional context
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger(this.env);
    
    // Override the formatMessage method to include additional context
    const originalFormatMessage = childLogger.formatMessage.bind(childLogger);
    childLogger.formatMessage = (level: string, message: string, context?: LogContext) => {
      const mergedContext = { ...additionalContext, ...context };
      return originalFormatMessage(level, message, mergedContext);
    };
    
    return childLogger;
  }

  // Measure execution time of async functions
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.performanceMetric(label, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed after ${duration}ms`, error);
      throw error;
    }
  }

  // Structured logging for different event types
  audit(action: string, userId?: string, details?: any): void {
    this.info('Audit Log', {
      action,
      userId,
      details,
      type: 'audit'
    });
  }

  metrics(name: string, value: number, tags?: Record<string, string>): void {
    this.debug('Metric', {
      name,
      value,
      tags,
      type: 'metric'
    });
  }

  // Log sampling for high-frequency events
  sample(sampleRate: number, level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: LogContext): void {
    if (Math.random() < sampleRate) {
      this[level](message, { ...context, sampled: true, sampleRate });
    }
  }

  // Batch logging for performance
  private logBatch: Array<{ level: string; message: string; context?: LogContext; timestamp: string }> = [];
  private batchTimeout?: any;

  addToBatch(level: string, message: string, context?: LogContext): void {
    this.logBatch.push({
      level,
      message,
      context,
      timestamp: new Date().toISOString()
    });

    // Flush batch after 100 items or 5 seconds
    if (this.logBatch.length >= 100) {
      this.flushBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushBatch(), 5000);
    }
  }

  private flushBatch(): void {
    if (this.logBatch.length === 0) return;

    const batch = [...this.logBatch];
    this.logBatch = [];
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = undefined;
    }

    // Send batch to external logging service
    if (this.env.METRICS_ENDPOINT) {
      fetch(`${this.env.METRICS_ENDPOINT}/logs/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: batch, source: 'cloudflare-worker' })
      }).catch(error => {
        console.error('Failed to send log batch:', error);
      });
    }

    // Also log to console for debugging
    if (this.env.ENVIRONMENT === 'development') {
      batch.forEach(log => {
        console.log(JSON.stringify(log));
      });
    }
  }

  // Cleanup method to flush any remaining logs
  async flush(): Promise<void> {
    if (this.logBatch.length > 0) {
      this.flushBatch();
      // Wait a bit for the request to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}