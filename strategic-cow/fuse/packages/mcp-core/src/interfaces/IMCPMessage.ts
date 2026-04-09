/**
 * JSON-RPC 2.0 compliant message interfaces for MCP protocol
 * These interfaces ensure strict compliance with JSON-RPC 2.0 specification
 * while supporting MCP-specific extensions and error codes.
 */

/**
 * Base JSON-RPC 2.0 message interface
 */
export interface JSONRPCMessage {
  /** JSON-RPC version, must be "2.0" */
  jsonrpc: '2.0';
}

/**
 * JSON-RPC 2.0 Request message interface
 */
export interface JSONRPCRequest extends JSONRPCMessage {
  /** Unique identifier for the request */
  id: string | number;
  /** Method name to invoke */
  method: string;
  /** Optional parameters for the method */
  params?: any;
}

/**
 * JSON-RPC 2.0 Response message interface
 */
export interface JSONRPCResponse extends JSONRPCMessage {
  /** Request identifier this response corresponds to */
  id: string | number;
  /** Result data (present on success) */
  result?: any;
  /** Error information (present on failure) */
  error?: JSONRPCError;
}

/**
 * JSON-RPC 2.0 Notification message interface
 * Notifications do not have an id and do not expect a response
 */
export interface JSONRPCNotification extends JSONRPCMessage {
  /** Method name for the notification */
  method: string;
  /** Optional parameters for the notification */
  params?: any;
}

/**
 * JSON-RPC 2.0 Error object interface
 */
export interface JSONRPCError {
  /** Error code (integer) */
  code: number;
  /** Human-readable error message */
  message: string;
  /** Optional additional error data */
  data?: any;
}

/**
 * MCP-specific request interface extending JSON-RPC 2.0
 */
export interface MCPRequest extends JSONRPCRequest {
  /** MCP-specific metadata */
  meta?: {
    /** Request timestamp */
    timestamp?: Date;
    /** Source identifier */
    source?: string;
    /** Request priority */
    priority?: 'low' | 'normal' | 'high';
    /** Request timeout in milliseconds */
    timeout?: number;
  };
}

/**
 * MCP-specific response interface extending JSON-RPC 2.0
 */
export interface MCPResponse extends JSONRPCResponse {
  /** MCP-specific metadata */
  meta?: {
    /** Response timestamp */
    timestamp?: Date;
    /** Processing time in milliseconds */
    processingTime?: number;
    /** Server identifier that processed the request */
    serverId?: string;
  };
}

/**
 * MCP-specific notification interface extending JSON-RPC 2.0
 */
export interface MCPNotification extends JSONRPCNotification {
  /** MCP-specific metadata */
  meta?: {
    /** Notification timestamp */
    timestamp?: Date;
    /** Source identifier */
    source?: string;
    /** Notification type */
    type?: 'event' | 'status' | 'alert';
  };
}

/**
 * MCP-specific error interface extending JSON-RPC 2.0
 */
export interface MCPError extends JSONRPCError {
  /** MCP-specific error details */
  details?: {
    /** Error category */
    category?: 'protocol' | 'resource' | 'tool' | 'auth' | 'system';
    /** Retry information */
    retryable?: boolean;
    /** Suggested retry delay in milliseconds */
    retryAfter?: number;
  };
}

/**
 * Union type for any MCP message
 */
export type MCPMessage = MCPRequest | MCPResponse | MCPNotification;

/**
 * Union type for any JSON-RPC 2.0 message
 */
export type JSONRPCMessage_Union = JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;