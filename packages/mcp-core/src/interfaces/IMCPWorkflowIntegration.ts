/**
 * MCP Workflow Integration Interface
 *
 * Defines the interface for integrating MCP services with workflow execution systems.
 * Enables workflow steps to delegate tasks to MCP services and track execution status.
 */

import { RetryPolicy } from '../types/common';

/**
 * Main interface for MCP workflow integration
 */
export interface IMCPWorkflowIntegration {
  /**
   * Execute a workflow step using MCP service delegation
   */
  executeWorkflowStep(step: WorkflowStep, context: WorkflowContext): Promise<StepResult>;

  /**
   * Delegate a task to an MCP service
   */
  delegateTask(task: Task, mcpService: string): Promise<TaskResult>;

  /**
   * Track the execution status of an MCP-delegated task
   */
  trackMCPExecution(executionId: string): Promise<ExecutionStatus>;

  /**
   * Handle asynchronous callbacks from MCP services
   */
  handleMCPCallback(callback: MCPCallback): Promise<void>;
}

/**
 * Workflow step definition for MCP integration
 */
export interface WorkflowStep {
  /** Unique identifier for the step */
  id: string;

  /** Type of MCP operation */
  type: 'mcp_call' | 'mcp_resource' | 'mcp_tool';

  /** Target MCP service identifier */
  mcpService: string;

  /** MCP method to invoke */
  mcpMethod: string;

  /** Parameters to pass to the MCP service */
  parameters: any;

  /** Optional timeout for the operation */
  timeout?: number;

  /** Retry policy for failed operations */
  retryPolicy?: RetryPolicy;

  /** Step metadata */
  metadata?: Record<string, any>;
}

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  /** Workflow execution ID */
  executionId: string;

  /** Workflow definition ID */
  workflowId: string;

  /** Current step being executed */
  currentStepId: string;

  /** Input data for the workflow */
  input: Record<string, any>;

  /** Results from previous steps */
  stepResults: Record<string, any>;

  /** Workflow variables */
  variables: Record<string, any>;

  /** Authentication context */
  authContext?: AuthContext;

  /** Execution metadata */
  metadata?: Record<string, any>;
}

/**
 * Result of workflow step execution
 */
export interface StepResult {
  /** Whether the step completed successfully */
  success: boolean;

  /** Result data from the step */
  result?: any;

  /** Error information if step failed */
  error?: string;

  /** Execution duration in milliseconds */
  duration: number;

  /** Step execution metadata */
  metadata?: Record<string, any>;

  /** Next step to execute (for conditional workflows) */
  nextStepId?: string;
}

/**
 * Task definition for MCP delegation
 */
export interface Task {
  /** Unique task identifier */
  id: string;

  /** Task type */
  type: string;

  /** Task parameters */
  parameters: Record<string, any>;

  /** Task priority */
  priority?: number;

  /** Task timeout */
  timeout?: number;

  /** Task metadata */
  metadata?: Record<string, any>;
}

/**
 * Result of task delegation
 */
export interface TaskResult {
  /** Task execution ID */
  executionId: string;

  /** Whether the task completed successfully */
  success: boolean;

  /** Task result data */
  result?: any;

  /** Error information if task failed */
  error?: string;

  /** Task execution status */
  status: TaskExecutionStatus;

  /** Execution start time */
  startedAt: Date;

  /** Execution completion time */
  completedAt?: Date;

  /** Task execution metadata */
  metadata?: Record<string, any>;
}

/**
 * Task execution status
 */
export enum TaskExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

/**
 * Execution status information
 */
export interface ExecutionStatus {
  /** Execution ID */
  executionId: string;

  /** Current status */
  status: TaskExecutionStatus;

  /** Progress percentage (0-100) */
  progress?: number;

  /** Status message */
  message?: string;

  /** Intermediate results */
  intermediateResults?: any[];

  /** Execution metadata */
  metadata?: Record<string, any>;

  /** Last update timestamp */
  lastUpdated: Date;
}

/**
 * MCP callback for asynchronous operations
 */
export interface MCPCallback {
  /** Callback type */
  type: 'progress' | 'result' | 'error' | 'status';

  /** Execution ID this callback relates to */
  executionId: string;

  /** Callback payload */
  payload: any;

  /** Callback timestamp */
  timestamp: Date;

  /** Source service that sent the callback */
  source: string;

  /** Callback metadata */
  metadata?: Record<string, any>;
}

/**
 * Authentication context for workflow execution
 */
export interface AuthContext {
  /** User ID */
  userId?: string;

  /** User roles */
  roles?: string[];

  /** User permissions */
  permissions?: string[];

  /** Authentication token */
  token?: string;

  /** Service account information */
  serviceAccount?: string;
}

/**
 * Workflow error recovery configuration
 */
export interface ErrorRecoveryConfig {
  /** Maximum retry attempts */
  maxRetries: number;

  /** Retry delay strategy */
  retryDelay: 'fixed' | 'exponential' | 'linear';

  /** Base delay in milliseconds */
  baseDelay: number;

  /** Maximum delay in milliseconds */
  maxDelay: number;

  /** Whether to enable fallback mechanisms */
  enableFallback: boolean;

  /** Fallback service configurations */
  fallbackServices?: string[];
}

/**
 * Workflow execution monitoring configuration
 */
export interface MonitoringConfig {
  /** Enable execution tracking */
  enableTracking: boolean;

  /** Enable performance metrics collection */
  enableMetrics: boolean;

  /** Enable detailed logging */
  enableDetailedLogging: boolean;

  /** Metrics collection interval in milliseconds */
  metricsInterval: number;

  /** Log level for workflow operations */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
