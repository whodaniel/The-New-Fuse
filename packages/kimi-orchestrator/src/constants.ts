/**
 * Default configuration constants for the KIMI Orchestrator
 */

import type { KimiOrchestratorConfig, LoadBalanceConfig } from './types';

/**
 * Default orchestrator configuration
 */
export const DEFAULT_ORCHESTRATOR_CONFIG: KimiOrchestratorConfig = {
  maxAgents: 100,
  relayUrl: 'ws://localhost:3000/ws',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  heartbeatIntervalMs: 30000, // 30 seconds
  agentTimeoutMs: 120000, // 2 minutes
  distributionStrategy: 'load-balanced',
  enableAutoRecovery: true,
  maxRetries: 3,
  logLevel: 'info',
};

/**
 * Default load balancing configuration
 */
export const DEFAULT_LOAD_BALANCE_CONFIG: LoadBalanceConfig = {
  strategy: 'weighted-response-time',
  responseTimeWeight: 0.3,
  loadWeight: 0.5,
  capabilityWeight: 0.2,
  enableStickySessions: false,
  maxTasksPerAgent: 5,
};

/**
 * Agent state transition timeouts
 */
export const AGENT_STATE_TIMEOUTS = {
  registration: 30000, // 30 seconds to register
  heartbeat: 60000, // 60 seconds between heartbeats
  taskAssignment: 10000, // 10 seconds to accept task
  taskCompletion: 300000, // 5 minutes default task timeout
  recovery: 60000, // 60 seconds to recover
};

/**
 * Health check thresholds
 */
export const HEALTH_THRESHOLDS = {
  maxResponseTimeMs: 5000, // 5 seconds
  maxErrorRate: 0.1, // 10% error rate
  maxConsecutiveFailures: 3,
  degradedThreshold: 0.7, // 70% health score
  unhealthyThreshold: 0.4, // 40% health score
};

/**
 * Task priority levels
 */
export const TASK_PRIORITIES = {
  CRITICAL: 10,
  HIGH: 8,
  MEDIUM: 5,
  LOW: 3,
  BACKGROUND: 1,
};

/**
 * Agent capability sets for different task types
 */
export const CAPABILITY_SETS = {
  CODE_GENERATION: ['code-generation', 'typescript', 'javascript', 'react', 'nodejs'] as const,
  CODE_REVIEW: ['code-review', 'typescript', 'javascript', 'analysis'] as const,
  DEBUGGING: ['debugging', 'analysis', 'typescript', 'javascript', 'nodejs'] as const,
  ARCHITECTURE: ['architecture-design', 'analysis', 'api-design'] as const,
  DOCUMENTATION: ['documentation', 'analysis'] as const,
  TESTING: ['testing', 'typescript', 'javascript'] as const,
  REFACTORING: ['refactoring', 'typescript', 'javascript', 'code-generation'] as const,
  SECURITY: ['security-audit', 'analysis'] as const,
  PERFORMANCE: ['performance-optimization', 'analysis', 'nodejs'] as const,
  DATABASE: ['database', 'nodejs', 'typescript'] as const,
};

/**
 * Event names for the orchestrator
 */
export const ORCHESTRATOR_EVENTS = {
  // Agent events
  AGENT_REGISTERED: 'agent:registered',
  AGENT_UNREGISTERED: 'agent:unregistered',
  AGENT_HEALTH_CHANGED: 'agent:health-changed',
  AGENT_FAILED: 'agent:failed',
  AGENT_RECOVERED: 'agent:recovered',

  // Task events
  TASK_ASSIGNED: 'task:assigned',
  TASK_COMPLETED: 'task:completed',
  TASK_FAILED: 'task:failed',
  TASK_CANCELLED: 'task:cancelled',

  // Pool events
  POOL_STATS: 'pool:stats',

  // Error events
  ERROR: 'error',
} as const;

/**
 * MCP tool names
 */
export const MCP_TOOL_NAMES = {
  REGISTER_AGENT: 'kimi_register_agent',
  UNREGISTER_AGENT: 'kimi_unregister_agent',
  ASSIGN_TASK: 'kimi_assign_task',
  GET_AGENT_STATUS: 'kimi_get_agent_status',
  GET_POOL_STATS: 'kimi_get_pool_stats',
  LIST_AGENTS: 'kimi_list_agents',
  CANCEL_TASK: 'kimi_cancel_task',
  DECOMPOSE_TASK: 'kimi_decompose_task',
} as const;

/**
 * Maximum values
 */
export const LIMITS = {
  MAX_AGENTS: 100,
  MAX_TASKS_PER_AGENT: 10,
  MAX_QUEUE_SIZE: 1000,
  MAX_TASK_TIMEOUT_MS: 600000, // 10 minutes
  MAX_RETRY_ATTEMPTS: 5,
};
