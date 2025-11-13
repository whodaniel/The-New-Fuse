/**
 * Logger for The New Fuse Relay System
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare class Logger {
    private logLevel;
    private workspaceDir;
    private logPath;
    constructor(logLevel: LogLevel, workspaceDir: string);
    private log;
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    private getLogLevelNumber;
}
//# sourceMappingURL=Logger.d.ts.map