export interface LogMetadata {
    timestamp?: string;
    level?: string;
    service?: string;
    [key: string]: unknown;
}
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export declare class LoggingService {
    private logger;
    constructor();
}
