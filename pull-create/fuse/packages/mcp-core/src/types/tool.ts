/**
 * MCP Tool type definitions
 */

// Re-export tool interfaces from the interfaces module
export type {
  JSONSchema,
  ValidationResult,
  ToolResult,
  ToolExecutionMetadata,
  ToolHandler,
  ToolUsageStats,
  MCPTool,
  ToolConfig,
  ResourceLimits,
  ToolPermissions,
  AccessControlEntry,
  RateLimitConfig
} from '../interfaces/IMCPTool';

/**
 * Tool type enumeration
 */
export enum ToolType {
  FUNCTION = 'function',
  SCRIPT = 'script',
  API_CALL = 'api_call',
  DATABASE_QUERY = 'database_query',
  FILE_OPERATION = 'file_operation',
  CUSTOM = 'custom'
}

/**
 * Tool execution status enumeration
 */
export enum ToolExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

/**
 * Tool execution context interface
 */
export interface ToolExecutionContext {
  /** Execution ID */
  executionId: string;
  /** Tool name */
  toolName: string;
  /** Executor identifier */
  executor: string;
  /** Execution parameters */
  parameters: any;
  /** Execution timestamp */
  startTime: Date;
  /** Execution timeout */
  timeout?: number;
  /** Execution metadata */
  metadata?: Record<string, any>;
  /** Parent execution ID (for nested executions) */
  parentExecutionId?: string;
}

/**
 * Tool execution log entry interface
 */
export interface ToolExecutionLog {
  /** Log entry ID */
  id: string;
  /** Execution ID */
  executionId: string;
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log message */
  message: string;
  /** Log timestamp */
  timestamp: Date;
  /** Additional log data */
  data?: any;
}

/**
 * Tool registry interface
 */
export interface ToolRegistry {
  /**
   * Register a tool
   * @param tool The tool to register
   */
  register(tool: import('../interfaces/IMCPTool').MCPTool): Promise<void>;

  /**
   * Unregister a tool
   * @param name The tool name to unregister
   */
  unregister(name: string): Promise<void>;

  /**
   * Get a tool by name
   * @param name The tool name
   * @returns The tool if found, null otherwise
   */
  get(name: string): Promise<import('../interfaces/IMCPTool').MCPTool | null>;

  /**
   * List all registered tools
   * @returns Array of all registered tools
   */
  list(): Promise<import('../interfaces/IMCPTool').MCPTool[]>;

  /**
   * Check if a tool is registered
   * @param name The tool name
   * @returns True if tool is registered, false otherwise
   */
  isRegistered(name: string): Promise<boolean>;

  /**
   * Search tools by criteria
   * @param criteria Search criteria
   * @returns Array of matching tools
   */
  search(criteria: ToolSearchCriteria): Promise<import('../interfaces/IMCPTool').MCPTool[]>;
}

/**
 * Tool search criteria interface
 */
export interface ToolSearchCriteria {
  /** Tool name pattern */
  name?: string;
  /** Tool type */
  type?: ToolType;
  /** Tool description pattern */
  description?: string;
  /** Required capabilities */
  capabilities?: string[];
  /** Tool tags */
  tags?: string[];
}

/**
 * Tool execution queue interface
 */
export interface ToolExecutionQueue {
  /**
   * Add execution to queue
   * @param context Execution context
   * @returns Promise resolving to queue position
   */
  enqueue(context: ToolExecutionContext): Promise<number>;

  /**
   * Get next execution from queue
   * @returns Promise resolving to next execution context or null
   */
  dequeue(): Promise<ToolExecutionContext | null>;

  /**
   * Get queue size
   * @returns Current queue size
   */
  size(): Promise<number>;

  /**
   * Clear the queue
   */
  clear(): Promise<void>;

  /**
   * Get queue statistics
   * @returns Queue statistics
   */
  getStatistics(): Promise<QueueStatistics>;
}

/**
 * Queue statistics interface
 */
export interface QueueStatistics {
  /** Current queue size */
  currentSize: number;
  /** Total enqueued items */
  totalEnqueued: number;
  /** Total dequeued items */
  totalDequeued: number;
  /** Average wait time in milliseconds */
  averageWaitTime: number;
  /** Peak queue size */
  peakSize: number;
  /** Queue creation time */
  createdAt: Date;
}

/**
 * Tool sandbox configuration interface
 */
export interface ToolSandboxConfig {
  /** Enable sandboxing */
  enabled: boolean;
  /** Sandbox type */
  type: 'docker' | 'vm' | 'process' | 'thread';
  /** Resource limits */
  resourceLimits: import('../interfaces/IMCPTool').ResourceLimits;
  /** Allowed file paths */
  allowedPaths?: string[];
  /** Blocked file paths */
  blockedPaths?: string[];
  /** Environment variables */
  environment?: Record<string, string>;
  /** Network access configuration */
  networkAccess?: NetworkAccessConfig;
}

/**
 * Network access configuration interface
 */
export interface NetworkAccessConfig {
  /** Allow network access */
  enabled: boolean;
  /** Allowed domains */
  allowedDomains?: string[];
  /** Blocked domains */
  blockedDomains?: string[];
  /** Allowed ports */
  allowedPorts?: number[];
  /** Blocked ports */
  blockedPorts?: number[];
}