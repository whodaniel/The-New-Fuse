export interface ErrorContext {
    timestamp: Date;
    source: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, unknown>;
}
export interface ErrorEvent {
    error: Error;
    context: ErrorContext;
    timestamp: string;
}
export declare class CustomError extends Error {
    context: ErrorContext;
    constructor(message: string, context?: Partial<ErrorContext>);
}
//# sourceMappingURL=error.d.d.ts.map