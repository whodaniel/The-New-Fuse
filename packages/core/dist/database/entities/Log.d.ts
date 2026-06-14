export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
    VERBOSE = "verbose"
}
export declare class Log {
    id: string;
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: string;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=Log.d.ts.map