/**
 * MCP Error type definitions
 */

// Re-export error interfaces from the interfaces module
export type { MCPError } from '../interfaces/IMCPMessage';

/**
 * Standard JSON-RPC 2.0 error codes
 */
export enum JSONRPCErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603
}

/**
 * MCP-specific error codes
 */
export enum MCPErrorCode {
  // Resource errors (32001-32099)
  RESOURCE_NOT_FOUND = -32001,
  RESOURCE_ACCESS_DENIED = -32002,
  RESOURCE_UNAVAILABLE = -32003,
  RESOURCE_LOCKED = -32004,
  RESOURCE_CORRUPTED = -32005,
  RESOURCE_TOO_LARGE = -32006,
  RESOURCE_INVALID_FORMAT = -32007,

  // Tool errors (32101-32199)
  TOOL_NOT_FOUND = -32101,
  TOOL_EXECUTION_FAILED = -32102,
  TOOL_TIMEOUT = -32103,
  TOOL_PERMISSION_DENIED = -32104,
  TOOL_INVALID_PARAMS = -32105,
  TOOL_RESOURCE_EXHAUSTED = -32106,
  TOOL_SANDBOX_VIOLATION = -32107,

  // Service errors (32201-32299)
  SERVICE_UNAVAILABLE = -32201,
  SERVICE_OVERLOADED = -32202,
  SERVICE_MAINTENANCE = -32203,
  SERVICE_VERSION_MISMATCH = -32204,
  SERVICE_CAPABILITY_MISSING = -32205,

  // Authentication/Authorization errors (32301-32399)
  AUTHENTICATION_FAILED = -32301,
  AUTHORIZATION_FAILED = -32302,
  TOKEN_EXPIRED = -32303,
  TOKEN_INVALID = -32304,
  INSUFFICIENT_PERMISSIONS = -32305,

  // Connection errors (32401-32499)
  CONNECTION_FAILED = -32401,
  CONNECTION_TIMEOUT = -32402,
  CONNECTION_LOST = -32403,
  CONNECTION_REFUSED = -32404,
  CONNECTION_LIMIT_EXCEEDED = -32405,

  // Protocol errors (32501-32599)
  PROTOCOL_VERSION_MISMATCH = -32501,
  PROTOCOL_VIOLATION = -32502,
  MESSAGE_TOO_LARGE = -32503,
  MESSAGE_INVALID_FORMAT = -32504,
  CAPABILITY_NEGOTIATION_FAILED = -32505,

  // Rate limiting errors (32601-32699)
  RATE_LIMIT_EXCEEDED = -32601,
  QUOTA_EXCEEDED = -32602,
  THROTTLED = -32603,

  // System errors (32701-32799)
  SYSTEM_OVERLOADED = -32701,
  SYSTEM_MAINTENANCE = -32702,
  SYSTEM_CONFIGURATION_ERROR = -32703,
  SYSTEM_DEPENDENCY_UNAVAILABLE = -32704,
  INVALID_PARAMS = -32602
}

/**
 * Error severity enumeration
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error category enumeration
 */
export enum ErrorCategory {
  PROTOCOL = 'protocol',
  RESOURCE = 'resource',
  TOOL = 'tool',
  AUTH = 'auth',
  CONNECTION = 'connection',
  SYSTEM = 'system',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration'
}

/**
 * Enhanced MCP Error class
 */
export class MCPErrorClass extends Error {
  public readonly code: number;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly correlationId?: string;
  public readonly cause?: Error;

  constructor(
    code: number,
    message: string,
    options: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      retryable?: boolean;
      retryAfter?: number;
      details?: Record<string, any>;
      correlationId?: string;
      cause?: Error;
    } = {}
  ) {
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
  toJSONRPC(): import('../interfaces/IMCPMessage').MCPError {
    return {
      code: this.code,
      message: this.message,
      details: {
        category: this.category as 'protocol' | 'resource' | 'tool' | 'auth' | 'system',
        retryable: this.retryable,
        retryAfter: this.retryAfter,
        ...this.details
      }
    };
  }

  /**
   * Infer error category from error code
   */
  private inferCategory(code: number): ErrorCategory {
    if (code >= -32007 && code <= -32001) return ErrorCategory.RESOURCE;
    if (code >= -32107 && code <= -32101) return ErrorCategory.TOOL;
    if (code >= -32305 && code <= -32301) return ErrorCategory.AUTH;
    if (code >= -32405 && code <= -32401) return ErrorCategory.CONNECTION;
    if (code >= -32505 && code <= -32501) return ErrorCategory.PROTOCOL;
    if (code >= -32799 && code <= -32701) return ErrorCategory.SYSTEM;
    return ErrorCategory.SYSTEM;
  }

  /**
   * Infer error severity from error code
   */
  private inferSeverity(code: number): ErrorSeverity {
    if (code === JSONRPCErrorCode.INTERNAL_ERROR) return ErrorSeverity.CRITICAL;
    if (code === MCPErrorCode.SYSTEM_OVERLOADED) return ErrorSeverity.HIGH;
    if (code === MCPErrorCode.CONNECTION_LOST) return ErrorSeverity.HIGH;
    if (code === MCPErrorCode.AUTHENTICATION_FAILED) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * Infer if error is retryable from error code
   */
  private inferRetryable(code: number): boolean {
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