/**
 * Simple Logger Service for MCP Server
 */
export declare class Logger {
    private context;
    constructor(context?: string);
    private formatMessage;
    log(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    verbose(message: string, ...args: any[]): void;
    setContext(context: string): void;
}
//# sourceMappingURL=logger.service.d.ts.map