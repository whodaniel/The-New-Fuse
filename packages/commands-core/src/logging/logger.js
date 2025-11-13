"use strict";
/**
 * Logging infrastructure for command execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleFormatter = exports.JsonFormatter = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 4] = "FATAL";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Main logger class
 */
class Logger {
    transports = [];
    formatters = new Map();
    globalContext = {};
    globalTags = [];
    minLevel = LogLevel.INFO;
    constructor(minLevel = LogLevel.INFO) {
        this.minLevel = minLevel;
        this.registerDefaultFormatters();
    }
    /**
     * Log a debug message
     */
    debug(message, data, context) {
        this.log(LogLevel.DEBUG, message, data, context);
    }
    /**
     * Log an info message
     */
    info(message, data, context) {
        this.log(LogLevel.INFO, message, data, context);
    }
    /**
     * Log a warning message
     */
    warn(message, data, context) {
        this.log(LogLevel.WARN, message, data, context);
    }
    /**
     * Log an error message
     */
    error(message, error, data, context) {
        this.log(LogLevel.ERROR, message, data, context, error);
    }
    /**
     * Log a fatal message
     */
    fatal(message, error, data, context) {
        this.log(LogLevel.FATAL, message, data, context, error);
    }
    /**
     * Log a message with specific level
     */
    log(level, message, data, context, error) {
        if (level < this.minLevel) {
            return;
        }
        const entry = {
            id: this.generateLogId(),
            timestamp: new Date(),
            level,
            message,
            data,
            context: { ...this.globalContext, ...context },
            error,
            tags: [...this.globalTags]
        };
        this.writeToTransports(entry);
    }
    /**
     * Add a transport
     */
    addTransport(transport) {
        this.transports.push(transport);
    }
    /**
     * Remove a transport
     */
    removeTransport(name) {
        const index = this.transports.findIndex(t => t.name === name);
        if (index >= 0) {
            this.transports.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * Get all transports
     */
    getTransports() {
        return [...this.transports];
    }
    /**
     * Register a formatter
     */
    registerFormatter(name, formatter) {
        this.formatters.set(name, formatter);
    }
    /**
     * Get a formatter
     */
    getFormatter(name) {
        return this.formatters.get(name);
    }
    /**
     * Set global context
     */
    setGlobalContext(context) {
        this.globalContext = { ...context };
    }
    /**
     * Update global context
     */
    updateGlobalContext(context) {
        this.globalContext = { ...this.globalContext, ...context };
    }
    /**
     * Set global tags
     */
    setGlobalTags(tags) {
        this.globalTags = [...tags];
    }
    /**
     * Add global tags
     */
    addGlobalTags(tags) {
        this.globalTags.push(...tags);
    }
    /**
     * Set minimum log level
     */
    setMinLevel(level) {
        this.minLevel = level;
    }
    /**
     * Get minimum log level
     */
    getMinLevel() {
        return this.minLevel;
    }
    /**
     * Create a child logger with additional context
     */
    child(context, tags) {
        const child = new Logger(this.minLevel);
        child.transports = [...this.transports];
        child.formatters = new Map(this.formatters);
        child.globalContext = { ...this.globalContext, ...context };
        child.globalTags = [...this.globalTags, ...(tags || [])];
        return child;
    }
    /**
     * Write log entry to all transports
     */
    writeToTransports(entry) {
        for (const transport of this.transports) {
            if (transport.enabled !== false &&
                (transport.level === undefined || entry.level >= transport.level)) {
                try {
                    transport.log(entry);
                }
                catch (error) {
                    console.error(`Transport ${transport.name} failed:, error);
        }
      }
    }
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {`);
                    return `log_${Date.now()}`;
                    _$;
                    {
                        Math.random().toString(36).substr(2, 9);
                    }
                    ;
                }
                /**
                 * Register default formatters
                 */
            }
            /**
             * Register default formatters
             */
        }
        /**
         * Register default formatters
         */
    }
    /**
     * Register default formatters
     */
    registerDefaultFormatters() {
        // JSON formatter
        this.registerFormatter('json', new JsonFormatter());
        // Simple text formatter
        this.registerFormatter('simple', new SimpleFormatter());
        // Detailed formatter
        this.registerFormatter('detailed', new DetailedFormatter());
    }
}
exports.Logger = Logger;
/**
 * JSON log formatter
 */
class JsonFormatter {
    format(entry) {
        const logData = {
            id: entry.id,
            timestamp: entry.timestamp.toISOString(),
            level: LogLevel[entry.level],
            message: entry.message,
            data: entry.data,
            context: entry.context,
            error: entry.error ? {
                name: entry.error.name,
                message: entry.error.message,
                stack: entry.error.stack
            } : undefined,
            category: entry.category,
            tags: entry.tags
        };
        return JSON.stringify(logData);
    }
}
exports.JsonFormatter = JsonFormatter;
/**
 * Simple text formatter
 */
class SimpleFormatter {
    format(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = LogLevel[entry.level].padEnd(5);
        const message = entry.message;
        `
    let formatted = `;
        $;
        {
            timestamp;
        }
        ` ${level} ${message};
    
    if (entry.context?.executionId) {`;
        formatted += [$, { entry, : .context.executionId } `];
    }
    
    return formatted;
  }
}

/**
 * Detailed text formatter
 */
export class DetailedFormatter implements LogFormatter {
  public format(entry: LogEntry): string {
    const lines: string[] = [];
    
    // Header
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    lines.push(${timestamp}`, $, { level }, $, { entry, : .message }];
        // Context
        if (entry.context && Object.keys(entry.context).length > 0) {
            lines.push('Context:');
            for (const [key, value] of Object.entries(entry.context)) {
                `
        lines.push(  ${key}`;
                $;
                {
                    JSON.stringify(value);
                }
                ;
            }
        }
        // Data`
        if (entry.data) {
            `
      lines.push('Data:');
      lines.push(  ${JSON.stringify(entry.data, null, 2)});
    }
    
    // Error
    if (entry.error) {`;
            lines.push('Error:');
            `
      lines.push(`;
            $;
            {
                entry.error.name;
            }
            $;
            {
                entry.error.message;
            }
            ;
            if (entry.error.stack) {
                `
        lines.push('  Stack:');`;
                entry.error.stack.split('\n').forEach(line => {
                    lines.push($, { line } `);
        });
      }
    }
    
    // Tags
    if (entry.tags && entry.tags.length > 0) {
      lines.push(Tags: ${entry.tags.join(', ')});
    }
    
    return lines.join('\n');
  }
}

/**
 * Console transport
 */
export class ConsoleTransport implements LogTransport {
  public readonly name = 'console';
  public level?: LogLevel;
  public enabled = true;

  constructor(level?: LogLevel) {
    this.level = level;
  }

  public log(entry: LogEntry): void {
    const formatter = new SimpleFormatter();
    const message = formatter.format(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message);
        break;
    }
  }
}

/**
 * Memory transport for testing and debugging
 */
export class MemoryTransport implements LogTransport {
  public readonly name = 'memory';
  public level?: LogLevel;
  public enabled = true;
  public entries: LogEntry[] = [];
  public maxEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  public log(entry: LogEntry): void {
    this.entries.push(entry);
    
    // Trim if exceeding max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  public getEntries(): LogEntry[] {
    return [...this.entries];
  }

  public getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }

  public clear(): void {
    this.entries = [];
  }
}

/**
 * File transport (basic implementation)
 */
export class FileTransport implements LogTransport {
  public readonly name = 'file';
  public level?: LogLevel;
  public enabled = true;
  private filePath: string;

  constructor(filePath: string, level?: LogLevel) {
    this.filePath = filePath;
    this.level = level;
  }

  public log(entry: LogEntry): void {
    // In a real implementation, this would write to a file
    // For now, we'll just log to console with a prefix
    const formatter = new JsonFormatter();
    const message = formatter.format(entry);`, console.log([FILE, $, { this: .filePath }], $, { message } `);
  }
}

/**
 * Default logger instance
 */
export const defaultLogger = new Logger();

/**
 * Create a logger with default console transport
 */
export function createLogger(minLevel: LogLevel = LogLevel.INFO): Logger {
  const logger = new Logger(minLevel);
  logger.addTransport(new ConsoleTransport(minLevel));
  return logger;
}

/**
 * Create a logger for command execution
 */
export function createCommandLogger(executionId: string, commandType: string): Logger {
  const logger = createLogger(LogLevel.DEBUG);
  logger.updateGlobalContext({ executionId, commandType });
  logger.addGlobalTags(['command']);
  return logger;
}));
                });
            }
        }
    }
}
exports.SimpleFormatter = SimpleFormatter;
//# sourceMappingURL=logger.js.map