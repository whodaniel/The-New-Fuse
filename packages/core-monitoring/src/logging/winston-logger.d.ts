/**
 * Winston Logger Configuration
 * Provides structured JSON logging with multiple transports
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';
export interface LoggerConfig {
    level: LogLevel;
    serviceName: string;
    environment: 'development' | 'staging' | 'production';
    console?: {
        enabled: boolean;
        colorize?: boolean;
        timestamp?: boolean;
    };
    file?: {
        enabled: boolean;
        dir: string;
        filename?: string;
        maxSize?: string;
        maxFiles?: string | number;
        datePattern?: string;
    };
    enableErrorFile?: boolean;
    enableCombinedFile?: boolean;
    metadata?: Record<string, any>;
}
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
    correlationId?: string;
    userId?: string;
    requestId?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    duration?: number;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
    metadata?: Record<string, any>;
}
/**
 * Winston Logger wrapper
 */
export declare class WinstonLogger {
    private logger;
    private config;
    private winston;
    private winstonDailyRotate;
    constructor(config: LoggerConfig);
    /**
     * Initialize Winston logger
     */
    initialize(): Promise<void>;
    /**
     * Format console log output
     */
    private formatConsoleLog;
    /**
     * Log error
     */
    error(message: string, error?: Error, metadata?: Record<string, any>): void;
    /**
     * Log warning
     */
    warn(message: string, metadata?: Record<string, any>): void;
    /**
     * Log info
     */
    info(message: string, metadata?: Record<string, any>): void;
    /**
     * Log HTTP request
     */
    http(message: string, metadata?: Record<string, any>): void;
    /**
     * Log debug
     */
    debug(message: string, metadata?: Record<string, any>): void;
    /**
     * Log request
     */
    logRequest(req: any, res: any, duration: number): void;
    /**
     * Log slow query
     */
    logSlowQuery(query: string, duration: number, threshold?: number): void;
    /**
     * Child logger with additional metadata
     */
    child(metadata: Record<string, any>): WinstonLogger;
}
/**
 * Create logger instance
 */
export declare function createLogger(config: LoggerConfig): WinstonLogger;
//# sourceMappingURL=winston-logger.d.ts.map