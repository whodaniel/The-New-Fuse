import { EventEmitter } from 'events';
declare enum LogLevel {
    TRACE = "trace",
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
interface LogOptions {
    filePath?: string;
    consoleOutput?: boolean;
    level?: LogLevel;
}
export declare class Logger extends EventEmitter {
    private filePath;
    private consoleOutput;
    private level;
    constructor(options?: LogOptions);
    private log;
    private shouldLog;
    trace(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    fatal(message: string, ...args: any[]): void;
}
export declare const newLogger: (name: string, options?: LogOptions) => Logger;
export {};
//# sourceMappingURL=logger.d.ts.map