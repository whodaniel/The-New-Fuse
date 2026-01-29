/**
 * Type definitions for the KIMI Orchestrator
 */

import type { Agent } from '@the-new-fuse/relay-core';

/**
 * Configuration for the KIMI Orchestrator
 */
export interface KimiOrchestratorConfig {
  /** Maximum number of parallel agents (default: 100) */
  maxAgents: number;
  /** WebSocket URL for TNF relay server */
  relayUrl: string;
  /** Redis connection URL for state management */
  redisUrl?: string;
  /** Heartbeat interval in milliseconds (default: 30000) */
  heartbeatIntervalMs: number;
  /** Agent timeout in milliseconds (default: 120000) */
  agentTimeoutMs: number;
  /** Task distribution strategy */
  distributionStrategy: 'round-robin' | 'load-balanced' | 'capability-based';
  /** Enable automatic recovery for failed agents */
  enableAutoRecovery: boolean;
  /** Maximum retries for failed tasks */
  maxRetries: number;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * KIMI Agent instance managed by the orchestrator
 */
export interface KimiAgent extends Agent {
  /** Agent capabilities specific to KIMI k2.5 */
  capabilities: KimiCapability[];
  /** Current task being processed */
  currentTask?: TaskAssignment;
  /** Number of tasks completed */
  tasksCompleted: number;
  /** Average task completion time in milliseconds */
  averageResponseTime: number;
  /** Agent load (0-100) */
  load: number;
  /** Agent health status */
  health: 'healthy' | 'degraded' | 'unhealthy';
  /** Maximum concurrent tasks this agent can handle */
  maxConcurrentTasks: number;
  /** Currently running tasks */
  runningTasks: number;
  /** Agent priority (higher = preferred for task assignment) */
  priority: number;
  /** Last health check timestamp */
  lastHealthCheck: string;
}

/**
 * KIMI k2.5 specific capabilities
 */
export type KimiCapability =
  | 'code-generation'
  | 'code-review'
  | 'debugging'
  | 'architecture-design'
  | 'documentation'
  | 'testing'
  | 'refactoring'
  | 'analysis'
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'react'
  | 'nodejs'
  | 'database'
  | 'api-design'
  | 'security-audit'
  | 'performance-optimization';

/**
 * Task assignment for an agent
 */
export interface TaskAssignment {
  /** Unique task ID */
  id: string;
  /** Task type */
  type: string;
  /** Task payload */
  payload: unknown;
  /** Assigned agent ID */
  agentId: string;
  /** Task priority (1-10, higher = more important) */
  priority: number;
  /** Task creation timestamp */
  createdAt: string;
  /** Task start timestamp */
  startedAt?: string;
  /** Task completion timestamp */
  completedAt?: string;
  /** Required capabilities for this task */
  requiredCapabilities: KimiCapability[];
  /** Maximum time allowed for task completion */
  timeoutMs: number;
  /** Current retry count */
  retryCount: number;
  /** Task status */
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Task result */
  result?: unknown;
  /** Error message if failed */
  error?: string;
}

/**
 * Task decomposition result
 */
export interface TaskDecomposition {
  /** Original task */
  originalTask: TaskAssignment;
  /** Sub-tasks */
  subtasks: TaskAssignment[];
  /** Dependencies between sub-tasks */
  dependencies: Map<string, string[]>;
  /** Estimated total completion time */
  estimatedCompletionTimeMs: number;
}

/**
 * Agent health status
 */
export interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastHeartbeat: string;
  responseTimeMs: number;
  cpuUsage?: number;
  memoryUsage?: number;
  activeTasks: number;
  queueDepth: number;
  errorRate: number;
}

/**
 * Agent pool statistics
 */
export interface AgentPoolStats {
  /** Total registered agents */
  totalAgents: number;
  /** Currently active agents */
  activeAgents: number;
  /** Healthy agents */
  healthyAgents: number;
  /** Degraded agents */
  degradedAgents: number;
  /** Unhealthy/offline agents */
  unhealthyAgents: number;
  /** Total tasks processed */
  totalTasksProcessed: number;
  /** Tasks currently running */
  runningTasks: number;
  /** Tasks in queue */
  queuedTasks: number;
  /** Average task completion time */
  averageCompletionTimeMs: number;
  /** Pool utilization (0-100) */
  utilizationPercent: number;
}

/**
 * Load balancing strategy configuration
 */
export interface LoadBalanceConfig {
  strategy: 'round-robin' | 'least-connections' | 'weighted-response-time' | 'capability-matching';
  /** Weight for response time in scoring (0-1) */
  responseTimeWeight: number;
  /** Weight for current load in scoring (0-1) */
  loadWeight: number;
  /** Weight for capability match in scoring (0-1) */
  capabilityWeight: number;
  /** Enable sticky sessions for related tasks */
  enableStickySessions: boolean;
  /** Maximum tasks per agent */
  maxTasksPerAgent: number;
}

/**
 * Orchestrator event types
 */
export interface OrchestratorEvents {
  'agent:registered': { agent: KimiAgent };
  'agent:unregistered': { agentId: string };
  'agent:health-changed': { agentId: string; health: AgentHealth };
  'agent:failed': { agentId: string; error: Error };
  'agent:recovered': { agentId: string };
  'task:assigned': { task: TaskAssignment; agentId: string };
  'task:completed': { task: TaskAssignment; result: unknown };
  'task:failed': { task: TaskAssignment; error: Error };
  'task:cancelled': { taskId: string };
  'pool:stats': { stats: AgentPoolStats };
  error: { error: Error; context?: unknown };
}

/**
 * MCP tool definitions for Kilo Code integration
 */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Result of an orchestrator operation
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTimeMs: number;
    agentId?: string;
    retryCount?: number;
  };
}
