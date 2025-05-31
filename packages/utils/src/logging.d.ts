import { Logger } from 'winston';
export declare enum LogLevel {
    error = "error",
    warn = "warn",
    info = "info",
    http = "http",
    verbose = "verbose",
    debug = "debug",
    silly = "silly"
}
declare const logger: Logger;
declare function createLoggerInstance(component: string): Logger;
declare function createCustomLogger(name: string): Logger;
export declare class CustomLogger {
    private logger;
    constructor(options?: {
        level?: string;
        component?: string;
    });
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error | unknown): void;
    debug(message: string, meta?: Record<string, unknown>): void;
}
export { logger, createLoggerInstance as createLogger, createCustomLogger };
//# sourceMappingURL=logging.d.ts.map