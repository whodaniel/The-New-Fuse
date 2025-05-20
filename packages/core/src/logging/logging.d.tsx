import { Express } from 'express';
import 'winston-daily-rotate-file';
interface LogConfig {
    level: string;
    format: string;
    file: string;
    maxSize: number;
    maxFiles: number;
}
/**
 * Configure logging for the application
 * @param app Express application instance
 * @param config Optional logging configuration
 */
export declare function setupLogging(app: Express, config?: Partial<LogConfig>): void;
export {};
