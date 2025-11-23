export {};
import type { LoggerOptions } from 'winston';
export declare const createWinstonLogger: (options?: Partial<LoggerOptions>) => any;
import winston from 'winston';
import { Format } from 'logform';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    VERBOSE = "verbose",
    DEBUG = "debug",
    SILLY = "silly"
}
export interface LogConfig {
    level?: LogLevel;
    format?: Format;
    transports?: winston.transport[];
}
export declare class Logger {
    private logger;
    constructor(config?: LogConfig);
    error(message: string, error?: Error | unknown): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    http(message: string, meta?: Record<string, unknown>): void;
    verbose(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    silly(message: string, meta?: Record<string, unknown>): void;
}
export declare const createCustomizedLogger: (config?: LogConfig) => Logger;
export default createCustomizedLogger;
//# sourceMappingURL=index.d.ts.map