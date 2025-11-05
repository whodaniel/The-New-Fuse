export declare class Logger {
    static log(message: string, context?: string): void;
    static error(message: string, trace?: string, context?: string): void;
    static warn(message: string, context?: string): void;
    static debug(message: string, context?: string): void;
    static verbose(message: string, context?: string): void;
}
export declare class LoggingService {
    private context;
    constructor(context: string);
    log(message: string): void;
    error(message: string, trace?: string): void;
    warn(message: string): void;
    debug(message: string): void;
}
//# sourceMappingURL=logger.d.ts.map