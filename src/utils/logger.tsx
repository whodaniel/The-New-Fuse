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

        // Check if we need to rotate the log files before attempting to write
        if (Logger.currentLogFile && Logger.currentFileSize + messageStr.length > Logger.maxFileSize) {
            try {
                await this.rotateLogFiles();
            } catch (rotationError) {
                // If rotation fails, we might still try to write to the current file or handle error
                // For now, log it and proceed with write attempt to current (possibly old) file.
                const rotationErrorMessage = `Log rotation failed: ${rotationError instanceof Error ? rotationError.message : String(rotationError)}. Attempting to write to current log file.`;
                console.error(rotationErrorMessage);
                this.emit('error.rotate', { error: rotationError, message: rotationErrorMessage });
            }
        }

        const MAX_RETRIES = 3;
        let attempts = 0;
        let success = false;

        while (attempts < MAX_RETRIES && !success) {
            try {
                // Ensure currentLogFile is still valid (could have changed if rotation happened mid-process by another call)
                if (!Logger.currentLogFile) {
                    this.initializeLogFile(); // Re-initialize if null
                    if (!Logger.currentLogFile) { // If still null, critical error
                        throw new Error("Log file not initialized after attempting re-initialization.");
                    }
                }
                fs.appendFileSync(Logger.currentLogFile, messageStr);
                Logger.currentFileSize += messageStr.length; // Only update if successful
                this.emit('logged', { file: Logger.currentLogFile, message });
                success = true;
            } catch (error) {
                attempts++;
                if (attempts >= MAX_RETRIES) {
                    const errorMessage = `Failed to write to log file ${Logger.currentLogFile} after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`;
                    console.error(errorMessage); // Prominent error message
                    this.emit('error.file', { error, message: errorMessage, filePath: Logger.currentLogFile });
                } else {
                    // console.warn(`Attempt ${attempts} failed to write to log file. Retrying in ${200 * attempts}ms...`);
                    await new Promise(resolve => setTimeout(resolve, 200 * attempts)); // Delay
                }
            }
        }
    }

    private async rotateLogFiles(): Promise<void> {
        // This method itself needs to be robust. Errors here are caught by the caller or handled internally.
        // The original try-catch in rotateLogFiles will handle its own errors.
        // For the purpose of this subtask, the main change is to ensure its errors are caught if it's called from writeToFile.
        // The try-catch in the original rotateLogFiles should be sufficient for its internal operations.
        // Let's ensure it's robust enough.

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
            this.initializeLogFile(); // This sets currentLogFile and resets currentFileSize
        } catch (error) {
            // This error will be caught by the caller if rotateLogFiles is awaited,
            // or needs to be handled here if not.
            // Emitting an event here for direct rotation failures could also be useful.
            const rotationErrorMessage = `Failed to rotate log files: ${error instanceof Error ? error.message : String(error)}`;
            console.error(rotationErrorMessage);
            this.emit('error.rotate', { error, message: rotationErrorMessage });
            throw error; // Re-throw to allow caller (writeToFile) to know rotation failed
        }
    }

    // Consider using fs.promises for async operations if this needs to be truly async
    // For simplicity with appendFileSync, an explicit flush is often not strictly needed
    // or can be simplified.
    async flush(): Promise<void> {
        // No retries needed for flush as per current requirement, just try-catch
        return new Promise<void>((resolve) => {
            if (Logger.enableFile && Logger.currentLogFile) {
                try {
                    const fd = fs.openSync(Logger.currentLogFile, 'a');
                    fs.fsyncSync(fd);
                    fs.closeSync(fd);
                    this.emit('flushed', { file: Logger.currentLogFile });
                } catch (err) {
                    const errorMessage = `Failed to flush log file ${Logger.currentLogFile}: ${err instanceof Error ? err.message : String(err)}`;
                    console.error(errorMessage);
                    this.emit('error.flush', { error: err, message: errorMessage, filePath: Logger.currentLogFile });
                }
            }
            resolve();
        });
    }
}
