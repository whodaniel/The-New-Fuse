export interface ErrorContext {
    userId?: string;
    requestId?: string;
    path?: string;
    timestamp: number;
    additionalData?: Record<string, any>;
}
export interface ErrorReport {
    error: Error;
    context: ErrorContext;
    handled: boolean;
    resolution?: string;
}
export declare class ErrorHandlingService {
    private readonly logger;
    Error: any;
}
