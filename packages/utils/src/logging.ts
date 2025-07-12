import { Logger, createLogger, format, transports } from 'winston';
import { TransformableInfo } from 'logform';

const { combine, timestamp, printf, colorize, errors, label } = format;

export enum LogLevel {
    error = "error",
    warn = "warn",
    info = "info",
    http = "http",
    verbose = "verbose",
    debug = "debug",
    silly = "silly"  // Add the missing initializer
}

const customFormat = printf((info: TransformableInfo) => {
    const { level, message, timestamp, duration, component, traceId, ...metadata } = info;
    
    let log = `${timestamp} [${level.toUpperCase()}]`;
    if (component) log += ` [${component}]`;
    if (traceId) log += ` (${traceId})`;
    
    log += `: ${message}`;
    
    if (duration) log += ` (${duration}ms)`;
    
    if (Object.keys(metadata).length > 0) {
        log += ` ${JSON.stringify(metadata)}`;
    }
    
    return log;
});

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        colorize(),
        label({ label: 'app' }),
        timestamp(),
        errors({ stack: true }),
        customFormat
    ),
    transports: [
        new transports.Console({})
    ]
});

function createLoggerInstance(component: string): Logger {
    return logger.child({ component });
}

function createCustomLogger(name: string): Logger {
    return createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: combine(
            colorize(),
            label({ label: name }),
            timestamp(),
            customFormat
        ),
        transports: [
            new transports.Console({})
        ]
    });
}

export class CustomLogger {
    private logger: Logger;

    constructor(options: { level?: string; component?: string } = {}) {
        this.logger = createLogger({
            level: options.level || 'info',
            format: combine(
                timestamp(),
                customFormat
            ),
            defaultMeta: options.component ? { component: options.component } : {},
            transports: [
                new transports.Console()
            ]
        });
    }

    info(message: string, meta: Record<string, unknown> = {}): void {
        this.logger.info(message, meta);
    }

    warn(message: string, meta: Record<string, unknown> = {}): void {
        this.logger.warn(message, meta);
    }

    error(message: string, error?: Error | unknown): void {
        const meta: Record<string, unknown> = {};
        if (error instanceof Error) {
            meta.error = {
                message: error.message,
                stack: error.stack
            };
        } else if (error) {
            meta.error = error;
        }
        this.logger.error(message, meta);
    }

    debug(message: string, meta: Record<string, unknown> = {}): void {
        this.logger.debug(message, meta);
    }
}

export { logger, createLoggerInstance as createLogger, createCustomLogger };

// Add uncaught exception and unhandled rejection handlers
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
    console.error('Unhandled Promise Rejection:', reason);
});
