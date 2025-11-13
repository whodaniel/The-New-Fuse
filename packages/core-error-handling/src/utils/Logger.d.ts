/**
 * Simple logger utility for core error handling
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    component: string;
    message: string;
    data?: any;
}
/**
 * Simple logger implementation
 */
export declare class Logger {
    private readonly component;
    private readonly minLevel;
    private static readonly levelPriority;
    constructor(component: string, minLevel?: LogLevel);
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
    private log;
    private formatLogEntry;
}
//# sourceMappingURL=Logger.d.ts.map