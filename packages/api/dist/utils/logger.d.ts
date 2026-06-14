/**
 * Simple logger utility for consistent logging across the application
 */
export declare class Logger {
    private context;
    constructor(context: string);
    info(message: string, ...optionalParams: any[]): void;
    debug(message: string, ...optionalParams: any[]): void;
    warn(message: string, ...optionalParams: any[]): void;
    error(message: string, ...optionalParams: any[]): void;
    private get timestamp();
}
//# sourceMappingURL=logger.d.ts.map