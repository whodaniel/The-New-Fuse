#!/bin/bash

echo "Fixing TypeScript errors in logger.ts..."

# Create a backup of the original file
cp src/utils/logger.ts src/utils/logger.ts.bak

# Fix the errors in the file
cat > src/utils/logger.ts << 'EOL'
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
        if (!Logger.enableFile) return;

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

    async flush(): Promise<void> {
        // Ensure all pending writes are completed
        if (Logger.currentLogFile) {
            await new Promise<void>((resolve) => {
                fs.fsync(fs.openSync(Logger.currentLogFile, 'a'), (err) => {
                    if (err) {
                        console.error(`Failed to flush log file: ${err.message}`);
                    }
                    resolve();
                });
            });
        }
    }
}
EOL

echo "Fixed logger.ts file."

# Create a backup of the original verification.ts file
cp src/verification/verification.ts src/verification/verification.ts.bak

# Fix the errors in the verification.ts file
cat > src/verification/verification.ts << 'EOL'
export interface VerificationResult {
    success: boolean;
    message?: string;
    details?: Record<string, unknown>;
}

export enum VerificationType {
    SCHEMA = 'schema',
    CONTENT = 'content',
    SECURITY = 'security',
    HARMLESSNESS = 'harmlessness'
}

interface VerifiableOutput {
    content: string | Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export class Verification {
    static async validateSchema(output: unknown): Promise<VerificationResult> {
        try {
            if (typeof output !== 'object' || output === null) {
                return {
                    success: false,
                    message: 'Output must be an object',
                    details: {
                        receivedType: typeof output
                    }
                };
            }

            const typedOutput = output as Partial<VerifiableOutput>;
            const requiredFields = ['content'];
            const missingFields = requiredFields.filter(field => !(field in typedOutput));

            if (missingFields.length > 0) {
                return {
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`,
                    details: { missingFields }
                };
            }

            // Type checking
            const expectedTypes: Record<string, Function | Function[]> = {
                content: [String, Object],
                metadata: Object
            };

            for (const [field, expectedType] of Object.entries(expectedTypes)) {
                if (field in typedOutput) {
                    const value = typedOutput[field as keyof VerifiableOutput];
                    const valueType = value?.constructor;
                    const isValidType = Array.isArray(expectedType) 
                        ? expectedType.some(type => valueType === type)
                        : valueType === expectedType;

                    if (!isValidType) {
                        return {
                            success: false,
                            message: `Invalid type for field: ${field}`,
                            details: {
                                field,
                                expectedType: Array.isArray(expectedType) 
                                    ? expectedType.map(t => t.name).join(' or ')
                                    : expectedType.name,
                                receivedType: valueType?.name ?? typeof value
                            }
                        };
                    }
                }
            }

            return {
                success: true,
                message: 'Schema validation passed'
            };
        } catch (error) {
            return {
                success: false,
                message: `Schema verification error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    static async verifyContent(output: unknown): Promise<VerificationResult> {
        try {
            const typedOutput = output as Partial<VerifiableOutput>;
            const content = typedOutput.content;
            
            if (!content) {
                return {
                    success: false,
                    message: 'Content is empty or missing',
                    details: { receivedContent: content }
                };
            }

            if (typeof content === 'string' && content.trim().length === 0) {
                return {
                    success: false,
                    message: 'Content is empty string',
                    details: { contentLength: 0 }
                };
            }

            return {
                success: true,
                message: 'Content verification passed'
            };
        } catch (error) {
            return {
                success: false,
                message: `Content verification error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    static async verifySecurity(output: unknown): Promise<VerificationResult> {
        try {
            const typedOutput = output as Partial<VerifiableOutput>;
            const metadata = typedOutput.metadata ?? {};
            
            // Required metadata fields
            const requiredMetadata = new Set(['timestamp', 'source_id']);
            const missingMetadata = Array.from(requiredMetadata)
                .filter(field => !(field in metadata));

            if (missingMetadata.length > 0) {
                return {
                    success: false,
                    message: `Missing required metadata fields: ${missingMetadata.join(', ')}`,
                    details: { missingFields: missingMetadata }
                };
            }

            return {
                success: true,
                message: 'Security verification passed'
            };
        } catch (error) {
            return {
                success: false,
                message: `Security verification error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    static async verifyHarmlessness(output: unknown): Promise<VerificationResult> {
        try {
            const typedOutput = output as Partial<VerifiableOutput>;
            const content = String(typedOutput.content ?? '');

            // Example check - replace with actual harmful content detection
            const harmfulPatterns = [
                /malicious/i,
                /harmful/i,
                /dangerous/i
            ];

            const detectedPatterns = harmfulPatterns
                .filter(pattern => pattern.test(content))
                .map(pattern => pattern.source);

            if (detectedPatterns.length > 0) {
                return {
                    success: false,
                    message: 'Potentially harmful content detected',
                    details: {
                        detectedPatterns,
                        contentLength: content.length
                    }
                };
            }

            return {
                success: true,
                message: 'Harmlessness verification passed'
            };
        } catch (error) {
            return {
                success: false,
                message: `Harmlessness verification error: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    static async verifyAll(output: unknown): Promise<Record<VerificationType, VerificationResult>> {
        return {
            [VerificationType.SCHEMA]: await this.validateSchema(output),
            [VerificationType.CONTENT]: await this.verifyContent(output),
            [VerificationType.SECURITY]: await this.verifySecurity(output),
            [VerificationType.HARMLESSNESS]: await this.verifyHarmlessness(output)
        };
    }
}
EOL

echo "Fixed verification.ts file."

echo "TypeScript errors fixed!"
