import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export enum LogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal'
}

interface LogMessage {
    timestamp: string;
    level: LogLevel;
    component: string;
    message: string;
    metadata?: Record<string, unknown>;
}

interface LoggerConfig {
    level?: LogLevel;
    enableConsole?: boolean;
    enableFile?: boolean;
    logDir?: string;
    maxFileSize?: number;  // in bytes
    maxFiles?: number;
    structured?: boolean;
}

export class Logger extends EventEmitter {
    private readonly name: string;
    private static level: LogLevel = LogLevel.INFO;
    private static enableConsole: boolean = true;
    private static enableFile: boolean = false;
    private static logDir: string = 'logs';
    private static maxFileSize: number = 10 * 1024 * 1024; // 10MB
    private static maxFiles: number = 5;
    private static structured: boolean = false;
    private static currentLogFile: string | null = null;
    private static currentFileSize: number = 0;

    constructor(name: string) {
        super();
        this.name = name;
        if (Logger.enableFile && !Logger.currentLogFile) {
            this.initializeLogFile();
        }
    }

    configure(config: LoggerConfig): void {
        if (config.level !== undefined) {
            Logger.level = config.level;
        }
        if (config.enableConsole !== undefined) {
            Logger.enableConsole = config.enableConsole;
        }
        if (config.enableFile !== undefined) {
            Logger.enableFile = config.enableFile;
            if (Logger.enableFile && !Logger.currentLogFile) {
                this.initializeLogFile();
            }
        }
        if (config.logDir !== undefined) {
            Logger.logDir = config.logDir;
        }
        if (config.maxFileSize !== undefined) {
            Logger.maxFileSize = config.maxFileSize;
        }
        if (config.maxFiles !== undefined) {
            Logger.maxFiles = config.maxFiles;
        }
        if (config.structured !== undefined) {
            Logger.structured = config.structured;
        }
    }

    private initializeLogFile(): void {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        Logger.currentLogFile = path.join(Logger.logDir, `log-${timestamp}.log`);
        Logger.currentFileSize = 0;
        this.ensureLogDirectory();
    }

    private ensureLogDirectory(): void {
        if (Logger.enableFile && !fs.existsSync(Logger.logDir)) {
            fs.mkdirSync(Logger.logDir, { recursive: true });
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = Object.values(LogLevel);
        return levels.indexOf(level) <= levels.indexOf(Logger.level);
    }

    trace(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.TRACE)) {
            const formattedMessage = this.formatMessage(LogLevel.TRACE, message, metadata);
            console.debug(formattedMessage);
            this.writeToFile(formattedMessage);
            this.emit('trace', { message, metadata });
        }
    }

    debug(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, metadata);
            console.debug(formattedMessage);
            this.writeToFile(formattedMessage);
            this.emit('debug', { message, metadata });
        }
    }

    info(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const formattedMessage = this.formatMessage(LogLevel.INFO, message, metadata);
            console.info(formattedMessage);
            this.writeToFile(formattedMessage);
            this.emit('info', { message, metadata });
        }
    }

    warn(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.WARN)) {
            const formattedMessage = this.formatMessage(LogLevel.WARN, message, metadata);
            console.warn(formattedMessage);
            this.writeToFile(formattedMessage);
            this.emit('warn', { message, metadata });
        }
    }

    error(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const formattedMessage = this.formatMessage(LogLevel.ERROR, message, metadata);
            console.error(formattedMessage);
            this.writeToFile(formattedMessage);
            this.emit('error', { message, metadata });
        }
    }

    fatal(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.FATAL)) {
            const formattedMessage = this.formatMessage(LogLevel.FATAL, message, metadata);
            console.error(formattedMessage);
            this.writeToFile(formattedMessage);
            this.emit('fatal', { message, metadata });
        }
    }

    private formatMessage(level: LogLevel, message: string, metadata?: Record<string, unknown>): string | LogMessage {
        const timestamp = new Date().toISOString();
        if (Logger.structured) {
            return {
                timestamp,
                level,
                component: this.name,
                message,
                metadata
            };
        }

        let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}`;
        if (metadata && Object.keys(metadata).length > 0) {
            formattedMessage += ` ${JSON.stringify(metadata)}`;
        }
        return formattedMessage;
    }

    private async writeToFile(message: string | LogMessage): Promise<void> {
        if (!Logger.enableFile || !Logger.currentLogFile) return;

        const data = typeof message === 'string' ? message : JSON.stringify(message);
        const messageStr = data + '\n';

        try {
            // Check if we need to rotate the log files
            if (Logger.currentFileSize + messageStr.length > Logger.maxFileSize) {
                await this.rotateLogFiles();
            }

            fs.appendFileSync(Logger.currentLogFile, messageStr);
            Logger.currentFileSize += messageStr.length;
            this.emit('logged', { file: Logger.currentLogFile, message });
        } catch (error) {
            console.error(`Failed to write to log file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async rotateLogFiles(): Promise<void> {
        try {
            // Rename existing log files
            for (let i = Logger.maxFiles - 1; i >= 0; i--) {
                const oldPath = path.join(Logger.logDir, `mcp-${i}.log`);
                const newPath = path.join(Logger.logDir, `mcp-${i + 1}.log`);
                
                if (fs.existsSync(oldPath)) {
                    if (i === Logger.maxFiles - 1) {
                        // Delete the oldest log file
                        fs.unlinkSync(oldPath);
                    } else {
                        // Rename the current log file
                        fs.renameSync(oldPath, newPath);
                    }
                }
            }

            // Create new log file
            this.initializeLogFile();
        } catch (error) {
            console.error(`Failed to rotate log files: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // Consider using fs.promises for async operations if this needs to be truly async
    // For simplicity with appendFileSync, an explicit flush is often not strictly needed
    // or can be simplified.
    async flush(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (Logger.enableFile && Logger.currentLogFile) {
                try {
                    const fd = fs.openSync(Logger.currentLogFile, 'a');
                    fs.fsyncSync(fd); // Use synchronous version
                    fs.closeSync(fd);
                } catch (err) {
                    console.error(`Failed to flush log file: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
            resolve();
        });
    }
}
