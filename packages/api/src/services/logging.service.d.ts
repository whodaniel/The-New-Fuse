export interface LogContext {
    userId?: string;
    agentId?: string;
    workflowId?: string;
    requestId?: string;
    [key: string]: any;
}
export declare class LoggingService {
    private readonly logger;
    info(message: string, context?: LogContext): void;
    error(message: string, trace?: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    verbose(message: string, context?: LogContext): void;
}
//# sourceMappingURL=logging.service.d.ts.map