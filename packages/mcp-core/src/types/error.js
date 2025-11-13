/**
 * MCP Error type definitions
 */
/**
 * Standard JSON-RPC 2.0 error codes
 */
export var JSONRPCErrorCode;
(function (JSONRPCErrorCode) {
    JSONRPCErrorCode[JSONRPCErrorCode["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
    JSONRPCErrorCode[JSONRPCErrorCode["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    JSONRPCErrorCode[JSONRPCErrorCode["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    JSONRPCErrorCode[JSONRPCErrorCode["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    JSONRPCErrorCode[JSONRPCErrorCode["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
})(JSONRPCErrorCode || (JSONRPCErrorCode = {}));
/**
 * MCP-specific error codes
 */
export var MCPErrorCode;
(function (MCPErrorCode) {
    // Resource errors (32001-32099)
    MCPErrorCode[MCPErrorCode["RESOURCE_NOT_FOUND"] = -32001] = "RESOURCE_NOT_FOUND";
    MCPErrorCode[MCPErrorCode["RESOURCE_ACCESS_DENIED"] = -32002] = "RESOURCE_ACCESS_DENIED";
    MCPErrorCode[MCPErrorCode["RESOURCE_UNAVAILABLE"] = -32003] = "RESOURCE_UNAVAILABLE";
    MCPErrorCode[MCPErrorCode["RESOURCE_LOCKED"] = -32004] = "RESOURCE_LOCKED";
    MCPErrorCode[MCPErrorCode["RESOURCE_CORRUPTED"] = -32005] = "RESOURCE_CORRUPTED";
    MCPErrorCode[MCPErrorCode["RESOURCE_TOO_LARGE"] = -32006] = "RESOURCE_TOO_LARGE";
    MCPErrorCode[MCPErrorCode["RESOURCE_INVALID_FORMAT"] = -32007] = "RESOURCE_INVALID_FORMAT";
    // Tool errors (32101-32199)
    MCPErrorCode[MCPErrorCode["TOOL_NOT_FOUND"] = -32101] = "TOOL_NOT_FOUND";
    MCPErrorCode[MCPErrorCode["TOOL_EXECUTION_FAILED"] = -32102] = "TOOL_EXECUTION_FAILED";
    MCPErrorCode[MCPErrorCode["TOOL_TIMEOUT"] = -32103] = "TOOL_TIMEOUT";
    MCPErrorCode[MCPErrorCode["TOOL_PERMISSION_DENIED"] = -32104] = "TOOL_PERMISSION_DENIED";
    MCPErrorCode[MCPErrorCode["TOOL_INVALID_PARAMS"] = -32105] = "TOOL_INVALID_PARAMS";
    MCPErrorCode[MCPErrorCode["TOOL_RESOURCE_EXHAUSTED"] = -32106] = "TOOL_RESOURCE_EXHAUSTED";
    MCPErrorCode[MCPErrorCode["TOOL_SANDBOX_VIOLATION"] = -32107] = "TOOL_SANDBOX_VIOLATION";
    // Service errors (32201-32299)
    MCPErrorCode[MCPErrorCode["SERVICE_UNAVAILABLE"] = -32201] = "SERVICE_UNAVAILABLE";
    MCPErrorCode[MCPErrorCode["SERVICE_OVERLOADED"] = -32202] = "SERVICE_OVERLOADED";
    MCPErrorCode[MCPErrorCode["SERVICE_MAINTENANCE"] = -32203] = "SERVICE_MAINTENANCE";
    MCPErrorCode[MCPErrorCode["SERVICE_VERSION_MISMATCH"] = -32204] = "SERVICE_VERSION_MISMATCH";
    MCPErrorCode[MCPErrorCode["SERVICE_CAPABILITY_MISSING"] = -32205] = "SERVICE_CAPABILITY_MISSING";
    // Authentication/Authorization errors (32301-32399)
    MCPErrorCode[MCPErrorCode["AUTHENTICATION_FAILED"] = -32301] = "AUTHENTICATION_FAILED";
    MCPErrorCode[MCPErrorCode["AUTHORIZATION_FAILED"] = -32302] = "AUTHORIZATION_FAILED";
    MCPErrorCode[MCPErrorCode["TOKEN_EXPIRED"] = -32303] = "TOKEN_EXPIRED";
    MCPErrorCode[MCPErrorCode["TOKEN_INVALID"] = -32304] = "TOKEN_INVALID";
    MCPErrorCode[MCPErrorCode["INSUFFICIENT_PERMISSIONS"] = -32305] = "INSUFFICIENT_PERMISSIONS";
    // Connection errors (32401-32499)
    MCPErrorCode[MCPErrorCode["CONNECTION_FAILED"] = -32401] = "CONNECTION_FAILED";
    MCPErrorCode[MCPErrorCode["CONNECTION_TIMEOUT"] = -32402] = "CONNECTION_TIMEOUT";
    MCPErrorCode[MCPErrorCode["CONNECTION_LOST"] = -32403] = "CONNECTION_LOST";
    MCPErrorCode[MCPErrorCode["CONNECTION_REFUSED"] = -32404] = "CONNECTION_REFUSED";
    MCPErrorCode[MCPErrorCode["CONNECTION_LIMIT_EXCEEDED"] = -32405] = "CONNECTION_LIMIT_EXCEEDED";
    // Protocol errors (32501-32599)
    MCPErrorCode[MCPErrorCode["PROTOCOL_VERSION_MISMATCH"] = -32501] = "PROTOCOL_VERSION_MISMATCH";
    MCPErrorCode[MCPErrorCode["PROTOCOL_VIOLATION"] = -32502] = "PROTOCOL_VIOLATION";
    MCPErrorCode[MCPErrorCode["MESSAGE_TOO_LARGE"] = -32503] = "MESSAGE_TOO_LARGE";
    MCPErrorCode[MCPErrorCode["MESSAGE_INVALID_FORMAT"] = -32504] = "MESSAGE_INVALID_FORMAT";
    MCPErrorCode[MCPErrorCode["CAPABILITY_NEGOTIATION_FAILED"] = -32505] = "CAPABILITY_NEGOTIATION_FAILED";
    // Rate limiting errors (32601-32699)
    MCPErrorCode[MCPErrorCode["RATE_LIMIT_EXCEEDED"] = -32601] = "RATE_LIMIT_EXCEEDED";
    MCPErrorCode[MCPErrorCode["QUOTA_EXCEEDED"] = -32602] = "QUOTA_EXCEEDED";
    MCPErrorCode[MCPErrorCode["THROTTLED"] = -32603] = "THROTTLED";
    // System errors (32701-32799)
    MCPErrorCode[MCPErrorCode["SYSTEM_OVERLOADED"] = -32701] = "SYSTEM_OVERLOADED";
    MCPErrorCode[MCPErrorCode["SYSTEM_MAINTENANCE"] = -32702] = "SYSTEM_MAINTENANCE";
    MCPErrorCode[MCPErrorCode["SYSTEM_CONFIGURATION_ERROR"] = -32703] = "SYSTEM_CONFIGURATION_ERROR";
    MCPErrorCode[MCPErrorCode["SYSTEM_DEPENDENCY_UNAVAILABLE"] = -32704] = "SYSTEM_DEPENDENCY_UNAVAILABLE";
    MCPErrorCode[MCPErrorCode["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
    MCPErrorCode[MCPErrorCode["TIMEOUT"] = -32408] = "TIMEOUT";
    MCPErrorCode[MCPErrorCode["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
})(MCPErrorCode || (MCPErrorCode = {}));
/**
 * Error severity enumeration
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
/**
 * Error category enumeration
 */
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["PROTOCOL"] = "protocol";
    ErrorCategory["RESOURCE"] = "resource";
    ErrorCategory["TOOL"] = "tool";
    ErrorCategory["AUTH"] = "auth";
    ErrorCategory["CONNECTION"] = "connection";
    ErrorCategory["SYSTEM"] = "system";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["CONFIGURATION"] = "configuration";
})(ErrorCategory || (ErrorCategory = {}));
/**
 * Enhanced MCP Error class
 */
export class MCPErrorClass extends Error {
    code;
    category;
    severity;
    retryable;
    retryAfter;
    details;
    timestamp;
    correlationId;
    cause;
    constructor(code, message, options = {}) {
        super(message);
        this.name = 'MCPError';
        this.code = code;
        this.category = options.category || this.inferCategory(code);
        this.severity = options.severity || this.inferSeverity(code);
        this.retryable = options.retryable ?? this.inferRetryable(code);
        this.retryAfter = options.retryAfter;
        this.details = options.details;
        this.timestamp = new Date();
        this.correlationId = options.correlationId;
        this.cause = options.cause;
    }
    /**
     * Convert to JSON-RPC error format
     */
    toJSONRPC() {
        return {
            code: this.code,
            message: this.message,
            details: {
                category: this.category,
                retryable: this.retryable,
                retryAfter: this.retryAfter,
                ...this.details
            }
        };
    }
    /**
     * Infer error category from error code
     */
    inferCategory(code) {
        if (code >= -32007 && code <= -32001)
            return ErrorCategory.RESOURCE;
        if (code >= -32107 && code <= -32101)
            return ErrorCategory.TOOL;
        if (code >= -32305 && code <= -32301)
            return ErrorCategory.AUTH;
        if (code >= -32405 && code <= -32401)
            return ErrorCategory.CONNECTION;
        if (code >= -32505 && code <= -32501)
            return ErrorCategory.PROTOCOL;
        if (code >= -32799 && code <= -32701)
            return ErrorCategory.SYSTEM;
        return ErrorCategory.SYSTEM;
    }
    /**
     * Infer error severity from error code
     */
    inferSeverity(code) {
        if (code === JSONRPCErrorCode.INTERNAL_ERROR)
            return ErrorSeverity.CRITICAL;
        if (code === MCPErrorCode.SYSTEM_OVERLOADED)
            return ErrorSeverity.HIGH;
        if (code === MCPErrorCode.CONNECTION_LOST)
            return ErrorSeverity.HIGH;
        if (code === MCPErrorCode.AUTHENTICATION_FAILED)
            return ErrorSeverity.MEDIUM;
        return ErrorSeverity.LOW;
    }
    /**
     * Infer if error is retryable from error code
     */
    inferRetryable(code) {
        const nonRetryableErrors = [
            JSONRPCErrorCode.PARSE_ERROR,
            JSONRPCErrorCode.INVALID_REQUEST,
            JSONRPCErrorCode.METHOD_NOT_FOUND,
            JSONRPCErrorCode.INVALID_PARAMS,
            MCPErrorCode.RESOURCE_NOT_FOUND,
            MCPErrorCode.AUTHENTICATION_FAILED,
            MCPErrorCode.AUTHORIZATION_FAILED,
            MCPErrorCode.INSUFFICIENT_PERMISSIONS,
            MCPErrorCode.PROTOCOL_VERSION_MISMATCH,
            MCPErrorCode.PROTOCOL_VIOLATION
        ];
        return !nonRetryableErrors.includes(code);
    }
}
//# sourceMappingURL=error.js.map