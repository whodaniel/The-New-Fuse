import * as winston from 'winston';
import 'winston-daily-rotate-file';
export interface LogMetadata {
    timestamp?: string;
    level?: string;
    service?: string;
    correlationId?: string;
    requestId?: string;
    userId?: string;
    [key: string]: any;
}
export declare const LOG_LEVELS: {
    error: number;
    warn: number;
    info: number;
    http: number;
    verbose: number;
    debug: number;
    silly: number;
};
export declare const createLogger: (config: {
    logDir: string;
    level: string;
    service: string;
}) => winston.Logger;
