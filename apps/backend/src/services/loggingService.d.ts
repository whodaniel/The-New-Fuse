export interface LogMetadata {
    userId?: string;
    requestId?: string;
    path?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
    error?: Error;
    [key: string]: any;
}
export interface LoggerConfig {
    level: string;
    format: 'json' | 'simple';
    transports: {
        console?: boolean;
        file?: {
            filename: string;
            maxFiles: number;
            maxSize: string;
        };
    };
}
export declare class LoggingService {
    private logger;
    private defaultMetadata;
    constructor(config: LoggerConfig);
    private createLogger;
    setDefaultMetadata(metadata: LogMetadata): void;
    info(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    error(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
    logRequest(metadata: LogMetadata): void;
    logError(error: Error, metadata?: LogMetadata): void;
    logSecurity(event: string, metadata?: LogMetadata): void;
    logPerformance(operation: string, duration: number, metadata?: LogMetadata): void;
    logAudit(action: string, metadata?: LogMetadata): void;
    child(metadata: LogMetadata): LoggingService;
}
