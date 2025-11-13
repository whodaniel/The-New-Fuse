export declare class SecurityError extends Error {
    code: string;
    statusCode: number;
    details?: any | undefined;
    constructor(message: string, code: string, statusCode?: number, details?: any | undefined);
}
export declare class AuthenticationError extends SecurityError {
    constructor(message?: string, code?: string, details?: any);
}
export declare class AuthorizationError extends SecurityError {
    constructor(message?: string, code?: string, details?: any);
}
export declare class RateLimitError extends SecurityError {
    constructor(message?: string, code?: string, details?: any);
}
export declare class ValidationError extends SecurityError {
    constructor(message?: string, code?: string, details?: any);
}
export declare class TokenError extends SecurityError {
    constructor(message?: string, code?: string, details?: any);
}
export declare class MFAError extends SecurityError {
    constructor(message?: string, code?: string, details?: any);
}
export declare function createErrorResponse(error: SecurityError | Error): {
    success: false;
    error: string;
    code: string;
    details?: any;
};
export declare function handleSecurityError(error: any): SecurityError;
//# sourceMappingURL=index.d.ts.map