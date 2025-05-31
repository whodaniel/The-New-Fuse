/**
 * Lightweight logger utility for the application
 */
export declare class Logger {
    private context;
    private enableTimestamp;
    constructor(context: string, enableTimestamp?: boolean);
    private getPrefix;
    log(message: any, ...optionalParams: any[]): void;
    error(message: any, ...optionalParams: any[]): void;
    warn(message: any, ...optionalParams: any[]): void;
    debug(message: any, ...optionalParams: any[]): void;
    verbose(message: any, ...optionalParams: any[]): void;
    setContext(context: string): void;
}
//# sourceMappingURL=Logger.d.ts.map