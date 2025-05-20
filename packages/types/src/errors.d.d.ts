export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
}
export declare enum ErrorCode {
    BAD_REQUEST = "BAD_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    WORKFLOW_ERROR = "WORKFLOW_ERROR",
    AGENT_ERROR = "AGENT_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    LLM_ERROR = "LLM_ERROR"
}
export interface ErrorResponse {
    error: ApiError;
    status: number;
    path: string;
    timestamp: string;
}
export interface ServiceError extends Error {
    code: ErrorCode;
    details?: Record<string, unknown>;
    timestamp: Date;
    service?: string;
}
//# sourceMappingURL=errors.d.d.ts.map