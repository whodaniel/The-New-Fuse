export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum ErrorCategory {
    VALIDATION = "VALIDATION",
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    DATABASE = "DATABASE",
    NETWORK = "NETWORK",
    BUSINESS = "BUSINESS",
    SYSTEM = "SYSTEM"
}
export interface ErrorMetadata {
    timestamp: Date;
    correlationId?: string;
    userId?: string;
    requestId?: string;
    [key: string]: unknown;
}
export interface BaseError extends Error {
    category: ErrorCategory;
    severity: ErrorSeverity;
    code: string;
    metadata?: ErrorMetadata;
    cause?: Error;
}
export declare class ApplicationError extends Error implements BaseError {
    category: ErrorCategory;
    severity: ErrorSeverity;
    code: string;
    metadata?: ErrorMetadata | undefined;
    cause?: Error | undefined;
    constructor(message: string, category: ErrorCategory, severity: ErrorSeverity, code: string, metadata?: ErrorMetadata | undefined, cause?: Error | undefined);
}
export declare class ValidationError extends ApplicationError {
    validationErrors: Record<string, string[]>;
    constructor(message: string, validationErrors: Record<string, string[]>, metadata?: ErrorMetadata);
}
