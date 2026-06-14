interface LogEntry {
    timestamp: Date;
    level: string;
    message: string;
    metadata?: Record<string, unknown>;
}
export declare class LoggingUtils {
    private static logDirectory;
    private static logFileName;
    private static logger;
    static initialize(): void;
    static writeLog(entry: LogEntry): Promise<void>;
    static readLogs(): Promise<string>;
    static clearLogs(): Promise<void>;
}
export {};
//# sourceMappingURL=LoggingUtils.d.ts.map