export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: Error;
}
export declare class LoggingService {
    private static instance;
    private logs;
    private maxLogs;
    private consoleEnabled;
    private constructor();
    static getInstance(): LoggingService;
    private createLogEntry;
    private addLog;
    private getConsoleMethod;
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error, context?: Record<string, any>): void;
    getLogs(): LogEntry[];
    clearLogs(): void;
    setMaxLogs(max: number): void;
    enableConsole(): void;
    disableConsole(): void;
    getLogsByLevel(level: LogLevel): LogEntry[];
    getRecentLogs(count: number): LogEntry[];
}
