import { LogConfig } from './types.js';
/**
 * Unified Logging Service for The New Fuse
 *
 * Provides consistent logging across all workspace packages.
 * Supports console output, file persistence, and metadata.
 */
export declare class UnifiedLoggingService {
    private config;
    private logPath;
    constructor(config?: Partial<LogConfig>);
    private log;
    debug(message: string, metadata?: Record<string, any>): void;
    info(message: string, metadata?: Record<string, any>): void;
    warn(message: string, metadata?: Record<string, any>): void;
    error(message: string, metadata?: Record<string, any>): void;
    private getLogLevelNumber;
}
/**
 * Global default logger instance
 */
export declare const logger: UnifiedLoggingService;
//# sourceMappingURL=UnifiedLoggingService.d.ts.map