// --- Logger Types ---
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  saveToStorage?: boolean;
  maxStoredLogs?: number;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  name: string;
  message: string | object;
  data?: unknown;
}

// --- Logger Class ---
export class Logger {
  private name: string;
  private level: LogLevel;
  private saveToStorage: boolean;
  private maxStoredLogs: number;

  constructor(options: LoggerOptions = {}) {
    this.name = options.name || 'App';
    this.level = options.level || 'info';
    this.saveToStorage = options.saveToStorage || false;
    this.maxStoredLogs = options.maxStoredLogs || 1000; // Default max logs

    // Ensure the logger is functional even if chrome.storage is not available (e.g., in tests)
    if (this.saveToStorage && typeof chrome?.storage?.local === 'undefined') {
        console.warn(`Logger "${this.name}": chrome.storage.local is not available. Disabling saveToStorage.`);
        this.saveToStorage = false;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(message: string | object, data?: unknown): string {
    let formatted = typeof message === 'string' ? message : JSON.stringify(message);
    if (data !== undefined) {
      try {
        formatted += ` Data: ${JSON.stringify(data)}`;
      } catch (e) {
        formatted += ` Data: [Unserializable Data]`;
      }
    }
    return formatted;
  }

  private writeLogEntry(level: LogLevel, message: string | object, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      name: this.name,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      data
    };

    // Log to console
    const consoleMessage = `[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${this.formatMessage(message, data)}`;
    switch (level) {
      case 'debug':
        console.debug(consoleMessage);
        break;
      case 'info':
        console.info(consoleMessage);
        break;
      case 'warn':
        console.warn(consoleMessage);
        break;
      case 'error':
        console.error(consoleMessage);
        break;
    }

    // Save to storage
    if (this.saveToStorage && chrome?.storage?.local) {
      const storageKey = `logs_${this.name}`;
      chrome.storage.local.get(storageKey, (result) => {
        const logs: LogEntry[] = result[storageKey] || [];
        logs.push(logEntry);

        // Trim logs if exceeding max
        if (logs.length > this.maxStoredLogs) {
          logs.splice(0, logs.length - this.maxStoredLogs);
        }

        chrome.storage.local.set({ [storageKey]: logs }, () => {
          // After successfully saving to storage, send a message
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage({
                    type: 'NEW_LOG_ENTRY',
                    payload: logEntry // The LogEntry object
                });
            } catch (e) {
                // Ignore errors if the runtime is not available (e.g. popup closed)
                // or if there's no listener.
                if (e.message && !e.message.includes("Could not establish connection") && !e.message.includes("Receiving end does not exist")) {
                    console.warn(`Logger [${this.name}]: Failed to send NEW_LOG_ENTRY message`, e);
                }
            }
          }
        });
      });
    }
  }

  debug(message?: any, ...optionalParams: any[]): void {
    this.writeLogEntry('debug', message, this.formatOptionalParams(optionalParams));
  }

  info(message?: any, ...optionalParams: any[]): void {
    this.writeLogEntry('info', message, this.formatOptionalParams(optionalParams));
  }

  warn(message?: any, ...optionalParams: any[]): void {
    this.writeLogEntry('warn', message, this.formatOptionalParams(optionalParams));
  }

  error(message?: any, ...optionalParams: any[]): void {
    this.writeLogEntry('error', message, this.formatOptionalParams(optionalParams));
  }

  private formatOptionalParams(params: any[]): unknown | undefined {
    if (params.length === 0) {
      return undefined;
    }
    if (params.length === 1) {
      return params[0];
    }
    // If multiple optional params, return them as an array
    // or you could choose to stringify them, e.g., params.map(p => typeof p === 'object' ? JSON.stringify(p) : String(p)).join(' ')
    return params;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
    this.info(`Log level set to ${level.toUpperCase()}`);
  }

  async getStoredLogs(): Promise<LogEntry[]> {
    if (!this.saveToStorage || !chrome?.storage?.local) {
        console.warn(`Logger "${this.name}": Cannot get stored logs. saveToStorage is disabled or chrome.storage is unavailable.`);
        return [];
    }
    const storageKey = `logs_${this.name}`;
    return new Promise((resolve) => {
        chrome.storage.local.get(storageKey, (result) => {
            resolve(result[storageKey] || []);
        });
    });
  }

  async clearStoredLogs(): Promise<void> {
    if (!this.saveToStorage || !chrome?.storage?.local) {
        console.warn(`Logger "${this.name}": Cannot clear stored logs. saveToStorage is disabled or chrome.storage is unavailable.`);
        return;
    }
     const storageKey = `logs_${this.name}`;
     return new Promise((resolve) => {
        chrome.storage.local.remove(storageKey, () => {
            this.info('Stored logs cleared.');
            resolve();
        });
     });
  }

  // Performance monitoring
  async trackPerformance<T>(
    operation: string,
    fn: () => Promise<T> | T,
    context?: string
  ): Promise<T> {
    const startTime = performance.now();
    const name = context ? `${context}:${operation}` : operation;
    
    this.debug(`Starting operation: ${operation}`, { context });

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.info(`Operation completed: ${operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        context
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.error(`Operation failed: ${operation}`, {
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration.toFixed(2)}ms`,
        context,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  }

  // Error boundary for async operations
  async safeExecute<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: string
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.error(`Safe execution failed`, {
        error: error instanceof Error ? error.message : String(error),
        context,
        stack: error instanceof Error ? error.stack : undefined
      });
      return fallback;
    }
  }

  // Memory usage tracking
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  // Extension-specific error reporting
  async reportError(error: Error, context: string, additionalData?: any) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location?.href,
      memory: this.getMemoryUsage(),
      additionalData
    };

    this.error('Extension error reported', errorReport);

    // Send to background script for potential relay to VS Code
    try {
      await chrome.runtime.sendMessage({
        action: 'ERROR_REPORT',
        data: errorReport
      });
    } catch (sendError) {
      this.error('Failed to send error report', sendError);
    }
  }

  // Export logs for debugging
  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    const exportData = {
      timestamp: new Date().toISOString(),
      name: this.name,
      logs
    };
    return JSON.stringify(exportData, null, 2);
  }
}
