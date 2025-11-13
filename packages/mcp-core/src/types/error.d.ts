/**
 * MCP Error type definitions
 */
export type { MCPError } from '../interfaces/IMCPMessage';
/**
 * Standard JSON-RPC 2.0 error codes
 */
export declare enum JSONRPCErrorCode {
    PARSE_ERROR = -32700,
    INVALID_REQUEST = -32600,
    METHOD_NOT_FOUND = -32601,
    INVALID_PARAMS = -32602,
    INTERNAL_ERROR = -32603
}
/**
 * MCP-specific error codes
 */
export declare enum MCPErrorCode {
    RESOURCE_NOT_FOUND = -32001,
    RESOURCE_ACCESS_DENIED = -32002,
    RESOURCE_UNAVAILABLE = -32003,
    RESOURCE_LOCKED = -32004,
    RESOURCE_CORRUPTED = -32005,
    RESOURCE_TOO_LARGE = -32006,
    RESOURCE_INVALID_FORMAT = -32007,
    TOOL_NOT_FOUND = -32101,
    TOOL_EXECUTION_FAILED = -32102,
    TOOL_TIMEOUT = -32103,
    TOOL_PERMISSION_DENIED = -32104,
    TOOL_INVALID_PARAMS = -32105,
    TOOL_RESOURCE_EXHAUSTED = -32106,
    TOOL_SANDBOX_VIOLATION = -32107,
    SERVICE_UNAVAILABLE = -32201,
    SERVICE_OVERLOADED = -32202,
    SERVICE_MAINTENANCE = -32203,
    SERVICE_VERSION_MISMATCH = -32204,
    SERVICE_CAPABILITY_MISSING = -32205,
    AUTHENTICATION_FAILED = -32301,
    AUTHORIZATION_FAILED = -32302,
    TOKEN_EXPIRED = -32303,
    TOKEN_INVALID = -32304,
    INSUFFICIENT_PERMISSIONS = -32305,
    CONNECTION_FAILED = -32401,
    CONNECTION_TIMEOUT = -32402,
    CONNECTION_LOST = -32403,
    CONNECTION_REFUSED = -32404,
    CONNECTION_LIMIT_EXCEEDED = -32405,
    PROTOCOL_VERSION_MISMATCH = -32501,
    PROTOCOL_VIOLATION = -32502,
    MESSAGE_TOO_LARGE = -32503,
    MESSAGE_INVALID_FORMAT = -32504,
    CAPABILITY_NEGOTIATION_FAILED = -32505,
    RATE_LIMIT_EXCEEDED = -32601,
    QUOTA_EXCEEDED = -32602,
    THROTTLED = -32603,
    SYSTEM_OVERLOADED = -32701,
    SYSTEM_MAINTENANCE = -32702,
    SYSTEM_CONFIGURATION_ERROR = -32703,
    SYSTEM_DEPENDENCY_UNAVAILABLE = -32704,
    INTERNAL_ERROR = -32603,
    TIMEOUT = -32408,
    INVALID_PARAMS = -32602
}
/**
 * Error severity enumeration
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Error category enumeration
 */
export declare enum ErrorCategory {
    PROTOCOL = "protocol",
    RESOURCE = "resource",
    TOOL = "tool",
    AUTH = "auth",
    CONNECTION = "connection",
    SYSTEM = "system",
    VALIDATION = "validation",
    CONFIGURATION = "configuration"
}
/**
 * Enhanced MCP Error class
 */
export declare class MCPErrorClass extends Error {
    readonly code: number;
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly retryable: boolean;
    readonly retryAfter?: number;
    readonly details?: Record<string, any>;
    readonly timestamp: Date;
    readonly correlationId?: string;
    readonly cause?: Error;
    constructor(code: number, message: string, options?: {
        category?: ErrorCategory;
        severity?: ErrorSeverity;
        retryable?: boolean;
        retryAfter?: number;
        details?: Record<string, any>;
        correlationId?: string;
        cause?: Error;
    });
    /**
     * Convert to JSON-RPC error format
     */
    toJSONRPC(): import('../interfaces/IMCPMessage').MCPError;
    /**
     * Infer error category from error code
     */
    private inferCategory;
    /**
     * Infer error severity from error code
     */
    private inferSeverity;
    /**
     * Infer if error is retryable from error code
     */
    private inferRetryable;
}
/**
 * Error handler function type
 */
export type ErrorHandler = (error: MCPErrorClass) => void;
/**
 * Error recovery strategy interface
 */
export interface ErrorRecoveryStrategy {
    /** Strategy name */
    name: string;
    /** Applicable error codes */
    applicableErrorCodes: number[];
    /** Recovery function */
    recover: (error: MCPErrorClass, context?: any) => Promise<boolean>;
    /** Maximum recovery attempts */
    maxAttempts: number;
    /** Recovery delay in milliseconds */
    delay: number;
}
/**
 * Error statistics interface
 */
export interface ErrorStatistics {
    /** Total error count */
    totalErrors: number;
    /** Errors by category */
    errorsByCategory: Record<ErrorCategory, number>;
    /** Errors by severity */
    errorsBySeverity: Record<ErrorSeverity, number>;
    /** Errors by code */
    errorsByCode: Record<number, number>;
    /** Error rate (errors per minute) */
    errorRate: number;
    /** Last error timestamp */
    lastError?: Date;
    /** Most common error */
    mostCommonError?: {
        code: number;
        message: string;
        count: number;
    };
}
//# sourceMappingURL=error.d.ts.map