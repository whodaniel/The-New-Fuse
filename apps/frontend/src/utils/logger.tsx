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
    if (!this.isDevelopment) return;

    const formattedMessage = this.formatMessage(level, message instanceof Error ? message.message : message, {
      timestamp: true,
      ...options,
    });

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, options?.context || '');
        break;
      case 'info':
        console.info(formattedMessage, options?.context || '');
        break;
      case 'warn':
        console.warn(formattedMessage, options?.context || '');
        break;
      case 'error':
        console.error(formattedMessage, options?.context || '');
        if (message instanceof Error) {
          console.error(message.stack);
        }
        break;
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
