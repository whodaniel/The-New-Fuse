import { MCPError, ErrorCategory, ErrorSeverity } from '@the-new-fuse/types';
export interface BaseErrorHandlerConfig {
    maxRetries?: number;
    baseDelay?: number;
    enableAutoRecovery?: boolean;
    maxRecoveryAttempts?: number;
    statisticsInterval?: number;
    enableLogging?: boolean;
    logLevel?: string;
}
export declare class BaseError implements MCPError {
    name?: string;
    message: string;
    code: number;
    category: ErrorCategory;
    timestamp?: number | Date;
    severity?: ErrorSeverity;
    retryable?: boolean;
    connectionId?: string;
    resourceUri?: string;
    toolName?: string;
    requestId?: string;
    constructor(name?: string, message?: string, code?: number, category?: ErrorCategory);
}
export type { MCPTool, MCPResource } from '@the-new-fuse/types';
export declare enum ServiceStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    DEGRADED = "degraded",
    MAINTENANCE = "maintenance"
}
export interface ErrorContext {
    component?: string;
    operation?: string;
    timestamp?: number;
    [key: string]: any;
}
export interface MCPErrorContext extends ErrorContext {
}
export interface RecoveryStrategy {
    name: string;
    applicableErrorCodes?: number[];
    maxAttempts?: number;
    delay?: number;
    canHandle?: (error: any) => boolean;
    recover: (error: any, context: any) => Promise<boolean>;
}
export interface ErrorHandler {
    name: string;
    canHandle: (error: any) => boolean;
    handle: (error: any, context: any) => Promise<void>;
}
export declare class Logger {
    context: string;
    constructor(context: string);
    debug(message: string, meta?: any): void;
}
//# sourceMappingURL=stubs.d.ts.map