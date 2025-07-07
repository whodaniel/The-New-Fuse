export interface LogEntry {
    id: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}
export declare class LoggingService {
    private logger;
    constructor();
    private initializeWinston;
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>): Promise<LogEntry>;
    debug(message: string, metadata?: Record<string, unknown>): Promise<LogEntry>;
    info(message: string, metadata?: Record<string, unknown>): Promise<LogEntry>;
    warn(message: string, metadata?: Record<string, unknown>): Promise<LogEntry>;
    error(message: string, metadata?: Record<string, unknown>): Promise<LogEntry>;
    private generateId;
}
//# sourceMappingURL=LoggingService.d.ts.map