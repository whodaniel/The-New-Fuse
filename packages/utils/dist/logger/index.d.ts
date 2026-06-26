import winston from 'winston';
import type { LoggerOptions } from 'winston';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    VERBOSE = "verbose",
    DEBUG = "debug",
    SILLY = "silly"
}
export declare function createCustomLogger(name: string): winston.Logger;
export declare const logger: winston.Logger;
export declare const createWinstonLogger: (options?: Partial<LoggerOptions>) => winston.Logger;
export interface LogConfig {
    level?: LogLevel;
    format?: any;
    transports?: winston.transport[];
    service?: string;
}
export declare class LoggerWrapper {
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
export declare const createCustomizedLogger: (config?: LogConfig) => LoggerWrapper;
export { LoggerWrapper as Logger };
export default createCustomizedLogger;
//# sourceMappingURL=index.d.ts.map