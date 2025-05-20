/**
 * Enhanced logger utility for MCP components with file output,
 * log rotation, and structured logging support.
 */

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
    private static currentLogFile: string = '';
    private static currentFileSize: number = 0;

    constructor(name: string) {
        super();
        this.name = name;
        if (Logger.enableFile && !Logger.currentLogFile) {
            this.initializeLogFile();
        }
    }

    static configure(config: LoggerConfig): void {
        if (config.level !== undefined) {
            Logger.level = config.level;
        }
        if (config.enableConsole !== undefined) {
            Logger.enableConsole = config.enableConsole;
        }
        if (config.enableFile !== undefined) {
            Logger.enableFile = config.enableFile;
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
        this.ensureLogDirectory();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        Logger.currentLogFile = path.join(Logger.logDir, `mcp-${timestamp}.log`);
        Logger.currentFileSize = 0;
    }

    private ensureLogDirectory(): void {
        if (Logger.enableFile && !fs.existsSync(Logger.logDir)) {
            fs.mkdirSync(Logger.logDir, { recursive: true });
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = Object.values(LogLevel);
        return levels.indexOf(level) >= levels.indexOf(Logger.level);
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
        if (metadata) {
            formattedMessage += ` ${JSON.stringify(metadata)}`;
        }
        return formattedMessage;
    }

    private async writeToFile(message: string | LogMessage): Promise<void> {
        if (!Logger.enableFile || !Logger.currentLogFile) {
            return;
        }

        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        const data = messageStr + '\n';

        try {
            // Check if we need to rotate the log file
            if (Logger.currentFileSize + data.length > Logger.maxFileSize) {
                await this.rotateLogFiles();
            }

            fs.appendFileSync(Logger.currentLogFile, data);
            Logger.currentFileSize += data.length;
            this.emit('logged', { file: Logger.currentLogFile, message });
        } catch (error: unknown) {
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
                        fs.unlinkSync(oldPath);
                    } else {
                        fs.renameSync(oldPath, newPath);
                    }
                }
            }

            // Rename current log file to mcp-0.log
            const newPath = path.join(Logger.logDir, 'mcp-0.log');
            if (fs.existsSync(Logger.currentLogFile)) {
                fs.renameSync(Logger.currentLogFile, newPath);
            }

            // Create new log file
            this.initializeLogFile();
            this.emit('rotated', { newFile: Logger.currentLogFile });
        } catch (error: unknown) {
            console.error(`Failed to rotate log files: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    trace(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.TRACE)) {
            const formattedMessage = this.formatMessage(LogLevel.TRACE, message, metadata);
            if (Logger.enableConsole) {
                console.debug(formattedMessage);
            }
            this.writeToFile(formattedMessage);
        }
    }

    debug(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, metadata);
            if (Logger.enableConsole) {
                console.debug(formattedMessage);
            }
            this.writeToFile(formattedMessage);
        }
    }

    info(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const formattedMessage = this.formatMessage(LogLevel.INFO, message, metadata);
            if (Logger.enableConsole) {
                console.info(formattedMessage);
            }
            this.writeToFile(formattedMessage);
        }
    }

    warn(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.WARN)) {
            const formattedMessage = this.formatMessage(LogLevel.WARN, message, metadata);
            if (Logger.enableConsole) {
                console.warn(formattedMessage);
            }
            this.writeToFile(formattedMessage);
        }
    }

    error(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const formattedMessage = this.formatMessage(LogLevel.ERROR, message, metadata);
            if (Logger.enableConsole) {
                console.error(formattedMessage);
            }
            this.writeToFile(formattedMessage);
        }
    }

    fatal(message: string, metadata?: Record<string, unknown>): void {
        if (this.shouldLog(LogLevel.FATAL)) {
            const formattedMessage = this.formatMessage(LogLevel.FATAL, message, metadata);
            if (Logger.enableConsole) {
                console.error(formattedMessage);
            }
            this.writeToFile(formattedMessage);
            this.emit('fatal', { message, metadata });
        }
    }

    async flush(): Promise<void> {
        // Ensure all pending writes are completed
        await new Promise<void>((resolve) => {
            if (Logger.currentLogFile) {
                fs.fsync(fs.openSync(Logger.currentLogFile, 'a'), (err) => {
                    if (err) {
                        console.error(`Failed to flush log file: ${err.message}`);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}
