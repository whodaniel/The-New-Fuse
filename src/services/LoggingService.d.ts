export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
export interface LogContext {
    timestamp?: Date;
    correlationId?: string;
    [key: string]: unknown;
}
export declare class LoggingService {
    private readonly serviceName;
    constructor(serviceName: string);
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    private log;
}
