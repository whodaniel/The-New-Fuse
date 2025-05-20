/**
 * Logging configuration for the Cline Bridge system.
 * Configures logging formats, handlers, and levels for different components.
 */
import * as winston from 'winston';
import 'winston-daily-rotate-file';
interface LoggerConfig {
    logLevel?: string;
    logDir?: string;
    consoleOutput?: boolean;
    maxSize?: number;
    maxFiles?: number;
}
interface LoggerCollection {
    client: winston.Logger;
    coordination: winston.Logger;
    redis: winston.Logger;
    [key: string]: winston.Logger;
}
/**
 * Set up logging configuration for the Cline Bridge system.
 * @param config Configuration options for logging
 * @returns Collection of configured loggers
 */
export declare function setupLogging(config: LoggerConfig | undefined, {}: {}): any LoggerCollection;
export declare const LOG_LEVELS: string;
export {};
