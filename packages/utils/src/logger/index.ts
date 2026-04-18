import winston, { createLogger, format as winstonFormat, transports } from 'winston';
import type { LoggerOptions } from 'winston';
import type { TransformableInfo } from 'logform';

const { combine, timestamp, label, printf, colorize, errors, json } = winstonFormat;

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    HTTP = 'http',
    VERBOSE = 'verbose',
    DEBUG = 'debug',
    SILLY = 'silly'
}

const logFormat = printf(({ level, message, label, timestamp, stack }: TransformableInfo) => {
    const formattedLabel = label ? ` [${label}]` : '';
    const errorStack = stack ? `\n${stack}` : '';
    return `${timestamp}${formattedLabel} ${level}: ${message}${errorStack}`;
});

export function createCustomLogger(name: string): winston.Logger {
    return createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: combine(
            colorize(),
            label({ label: name }),
            timestamp(),
            errors({ stack: true }),
            logFormat
        ),
        transports: [
            new transports.Console({}),
        ],
    });
}

export const logger = createCustomLogger('app');

export const createWinstonLogger = (options?: Partial<LoggerOptions>): winston.Logger => {
    return createLogger({
        format: combine(
            timestamp(),
            errors({ stack: true }),
            logFormat
        ),
        ...options
    });
};

export interface LogConfig {
    level?: LogLevel;
    format?: any;
    transports?: winston.transport[];
}

export class LoggerWrapper {
    private logger: winston.Logger;

    constructor(config: LogConfig = {}) {
        this.logger = createLogger({
            level: config.level || LogLevel.INFO,
            format: config.format || combine(
                timestamp(),
                errors({ stack: true }),
                json()
            ),
            transports: config.transports || [
                new transports.Console()
            ]
        });
    }

    error(message: string, error?: Error | unknown): void {
        const meta = error instanceof Error ?
            { error: { message: error.message, stack: error.stack }, stack: error.stack } :
            { error };
        this.logger.error(message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(message, meta);
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(message, meta);
    }

    http(message: string, meta?: Record<string, unknown>): void {
        this.logger.http(message, meta);
    }

    verbose(message: string, meta?: Record<string, unknown>): void {
        this.logger.verbose(message, meta);
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(message, meta);
    }

    silly(message: string, meta?: Record<string, unknown>): void {
        this.logger.silly(message, meta);
    }
}

export const createCustomizedLogger = (config?: LogConfig): LoggerWrapper => {
    return new LoggerWrapper(config);
};

export default createCustomizedLogger;
