/**
 * Simple Logger utility for MCP Core
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    data?: any;
    component?: string;
}
export declare class Logger {
    private component;
    private logLevel;
    constructor(component?: string, logLevel?: LogLevel);
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
    private shouldLog;
    private log;
    setLogLevel(level: LogLevel): void;
    getLogLevel(): LogLevel;
}
//# sourceMappingURL=Logger.d.ts.map