// Use properly typed declaration for importDefault
var __importDefault = function (mod: any): any {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
export {}
exports.logger = exports.createCustomLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const { format, transports } = winston_1.default;
const { combine, timestamp, label, printf, colorize } = format;

import { createLogger, format as winstonFormat } from 'winston';
import type { LoggerOptions } from 'winston';
import type { TransformableInfo } from 'logform';
const { printf: _winstonPrintf, combine: winstonCombine, timestamp: winstonTimestamp } = winstonFormat;

const logFormat = printf(({ level, message, label, timestamp }: TransformableInfo) => {
    const formattedLabel = label ? ` [${label}]` : '';
    return `${timestamp}${formattedLabel} ${level}: ${message}`;
});

function createCustomLogger(name: string): any {
    return winston_1.default.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: combine(
            colorize(),
            label({ label: name }),
            timestamp(),
            logFormat
        ),
        transports: [
            new transports.Console({}),
        ],
    });
}
exports.createCustomLogger = createCustomLogger;
exports.logger = createCustomLogger('app');

// Renamed to avoid conflict with the other createLogger
export const createWinstonLogger = (options?: Partial<LoggerOptions>): any => {
    return createLogger({
        format: winstonCombine(
            winstonTimestamp(),
            logFormat
        ),
        ...options
    });
};

import winston from 'winston';
import { Format } from 'logform';

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    HTTP = 'http',
    VERBOSE = 'verbose',
    DEBUG = 'debug',
    SILLY = 'silly'
}

export interface LogConfig {
    level?: LogLevel;
    format?: Format;
    transports?: winston.transport[];
}

export class Logger {
    private logger: winston.Logger;

    constructor(config: LogConfig = {}) {
        this.logger = winston.createLogger({
            level: config.level || LogLevel.INFO,
            format: config.format || winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: config.transports || [
                new winston.transports.Console()
            ]
        });
    }

    error(message: string, error?: Error | unknown): void {
        const meta = error instanceof Error ?
            { error: { message: error.message, stack: error.stack } } :
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

export const createCustomizedLogger = (config?: LogConfig): Logger => {
    return new Logger(config);
};

// Single default export
export default createCustomizedLogger;
