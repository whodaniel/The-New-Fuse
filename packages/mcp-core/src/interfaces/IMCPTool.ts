/**
 * MCP Tool interfaces for managing tools in the MCP protocol
 */

/**
 * JSON Schema interface for tool parameter validation
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: any;
}

/**
 * Tool validation result interface
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors if any */
  errors?: string[];
  /** Validated and normalized parameters */
  normalizedParams?: any;
}

/**
 * Tool execution result interface
 */
export interface ToolResult {
  /** Whether execution was successful */
  success: boolean;
  /** Result data (present on success) */
  result?: any;
  /** Error message (present on failure) */
  error?: string;
  /** Additional metadata about execution */
  metadata?: ToolExecutionMetadata;
}

/**
 * Tool execution metadata interface
 */
export interface ToolExecutionMetadata {
  /** Unique execution identifier */
  executionId: string;
  /** Execution time in milliseconds */
  executionTime?: number;
  /** Memory usage in bytes */
  memoryUsage?: number;
  /** Tool version used */
  toolVersion?: string;
  /** Execution context */
  context?: Record<string, any>;
  /** Warnings generated during execution */
  warnings?: string[];
}

/**
 * Tool handler interface for implementing tool execution logic
 */
export interface ToolHandler {
  /**
   * Execute the tool with given parameters
   * @param params Parameters for tool execution
   * @returns Promise resolving to tool execution result
   */
  execute(params: any): Promise<ToolResult>;

  /**
   * Validate tool parameters (optional)
   * @param params Parameters to validate
   * @returns Promise resolving to validation result
   */
  validate?(params: any): Promise<ValidationResult>;

  /**
   * Get tool usage information (optional)
   * @returns Tool usage statistics
   */
  getUsageStats?(): Promise<ToolUsageStats>;

  /**
   * Cleanup resources after tool execution (optional)
   * @returns Promise resolving when cleanup is complete
   */
  cleanup?(): Promise<void>;
}

/**
 * Tool usage statistics interface
 */
export interface ToolUsageStats {
  /** Total number of executions */
  totalExecutions: number;
  /** Number of successful executions */
  successfulExecutions: number;
  /** Number of failed executions */
  failedExecutions: number;
  /** Average execution time in milliseconds */
  averageExecutionTime: number;
  /** Last execution timestamp */
  lastExecution?: Date;
}

/**
 * MCP Tool definition interface
 */
export interface MCPTool {
  /** Unique tool name */
  name: string;
  /** Human-readable tool description */
  description: string;
  /** JSON Schema for input parameters */
  inputSchema: JSONSchema;
  /** JSON Schema for output (optional) */
  outputSchema?: JSONSchema;
  /** Tool handler implementation */
  handler: ToolHandler;
  /** Tool configuration */
  config?: ToolConfig;
  /** Tool permissions */
  permissions?: ToolPermissions;
}

/**
 * Tool configuration interface
 */
export interface ToolConfig {
  /** Maximum execution time in milliseconds */
  timeout?: number;
  /** Maximum memory usage in bytes */
  maxMemory?: number;
  /** Enable sandboxing */
  sandboxed?: boolean;
  /** Environment variables */
  environment?: Record<string, string>;
  /** Resource limits */
  resourceLimits?: ResourceLimits;
}

/**
 * Resource limits interface
 */
export interface ResourceLimits {
  /** CPU time limit in milliseconds */
  cpuTime?: number;
  /** Memory limit in bytes */
  memory?: number;
  /** File system operations limit */
  fileOperations?: number;
  /** Network operations limit */
  networkOperations?: number;
}

/**
 * Tool permissions interface
 */
export interface ToolPermissions {
  /** Execute permission */
  execute: boolean;
  /** Required roles for execution */
  requiredRoles?: string[];
  /** Access control list */
  acl?: AccessControlEntry[];
  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;
}

/**
 * Access control entry interface (reused from resource)
 */
export interface AccessControlEntry {
  /** Principal (user, role, or service) */
  principal: string;
  /** Granted permissions */
  permissions: string[];
  /** Permission type */
  type: 'allow' | 'deny';
}

/**
 * Rate limiting configuration interface
 */
export interface RateLimitConfig {
  /** Maximum requests per time window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Burst allowance */
  burstSize?: number;
}