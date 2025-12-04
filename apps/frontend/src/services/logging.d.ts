export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export declare class LoggingService {
    constructor();
    static getInstance(): any;
    createLogEntry(level: any, message: any, context: any, error: any): {
        timestamp: number;
        level: any;
        message: any;
        context: any;
        error: any;
    };
    addLog(entry: any): void;
    getConsoleMethod(level: any): {
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    };
    debug(message: any, context: any): void;
    info(message: any, context: any): void;
    warn(message: any, context: any): void;
    error(message: any, error: any, context: any): void;
    getLogs(): any[];
    clearLogs(): void;
    setMaxLogs(max: any): void;
    enableConsole(): void;
    disableConsole(): void;
    getLogsByLevel(level: any): any;
    getRecentLogs(count: any): any;
}
