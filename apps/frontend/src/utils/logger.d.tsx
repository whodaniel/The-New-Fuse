import { EventEmitter } from 'events';
export declare enum LogLevel {
    TRACE = "trace",
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
interface LoggerConfig {
    level?: LogLevel;
    enableConsole?: boolean;
    structured?: boolean;
}
export declare class Logger extends EventEmitter {
    private readonly name;
    private static level;
    private static enableConsole;
    private static structured;
    constructor(name: string);
    static configure(config: LoggerConfig): void;
    private shouldLog;
    private formatMessage;
    trace(message: string, metadata?: Record<string, unknown>): void;
    debug(message: string, metadata?: Record<string, unknown>): void;
    info(message: string, metadata?: Record<string, unknown>): void;
    warn(message: string, metadata?: Record<string, unknown>): void;
    error(message: string, metadata?: Record<string, unknown>): void;
    fatal(message: string, metadata?: Record<string, unknown>): void;
}
export {};
