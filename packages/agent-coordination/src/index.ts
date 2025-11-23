/**
 * Multi-Agent Coordination Framework
 *
 * Provides comprehensive tools for distributed multi-agent task execution including:
 * - Task distribution with priority queues
 * - Agent orchestration and load balancing
 * - Shared state management
 * - Coordination patterns (Map-Reduce, Pipeline, Consensus, Swarm)
 * - Real-time monitoring and metrics
 */

// Legacy Redis coordinator
export * from './redis-coordinator';

// Types
export * from './types/coordination.types';

// Legacy components
export * from './broadcast/broadcast-manager';
export * from './coordination/shared-state-manager';
export * from './presence/presence-tracker';
export * from './queues/task-queue-manager';
export * from './serializers/message-serializer';

// Core components
export {
  AgentCapability,
  AgentInfo,
  AgentPool,
  AgentPoolConfig,
  CoordinationConfig,
  PerformanceMetrics as CorePerformanceMetrics,
  ExecutionMode,
  Task,
  TaskAssigner,
  TaskAssignment,
  TaskDependency,
  TaskQueue,
  TaskResult,
} from './core';

// Orchestration
export * from './orchestration';

// State management
export * from './state';

// Coordination patterns
export * from './patterns';

// Monitoring
export * from './monitoring';
