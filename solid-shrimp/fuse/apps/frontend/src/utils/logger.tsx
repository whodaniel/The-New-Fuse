type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  timestamp?: boolean;
  level?: LogLevel;
  context?: Record<string, any>;
}

export class Logger {
  private readonly context: string;
  private readonly isDevelopment: boolean;

  constructor(context: string) {
    this.context = context;
    this.isDevelopment = import.meta.env.DEV;
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = options?.timestamp ? new Date().toISOString() : '';
    return `[${timestamp}][${level.toUpperCase()}][${this.context}] ${message}`;
  }

  private log(level: LogLevel, message: string | Error, options?: LogOptions): void {
    const formattedMessage = this.formatMessage(level, message instanceof Error ? message.message : message, {
      timestamp: true,
      ...options,
    });

    // Enhanced logging with production support
    const logData = {
      level,
      message: message instanceof Error ? message.message : message,
      context: this.context,
      timestamp: new Date().toISOString(),
      ...options?.context,
      ...(message instanceof Error && { stack: message.stack, error: message.name })
    };

    // Development logging (detailed)
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, logData);
          break;
        case 'info':
          console.info(formattedMessage, logData);
          break;
        case 'warn':
          console.warn(formattedMessage, logData);
          break;
        case 'error':
          console.error(formattedMessage, logData);
          break;
      }
    } else {
      // Production logging (errors and warns only, structured)
      if (level === 'error' || level === 'warn') {
        console[level](JSON.stringify(logData));
        
        // Send to monitoring service if available
        if (typeof window !== 'undefined' && (window as any).monitoring) {
          (window as any).monitoring.log(logData);
        }
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, { context });
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, { context });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, { context });
  }

  error(message: string | Error, context?: Record<string, any>): void {
    this.log('error', message, { context });
  }
}
