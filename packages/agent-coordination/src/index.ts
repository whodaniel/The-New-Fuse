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
export * from './redis-coordinator.js';

// Types
export * from './types/coordination.types.js';

// Legacy components
export * from './broadcast/broadcast-manager.js';
export * from './coordination/shared-state-manager.js';
export * from './presence/presence-tracker.js';
export * from './queues/task-queue-manager.js';
export * from './serializers/message-serializer.js';

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
} from './core/index.js';

// Orchestration
export * from './orchestration/index.js';

// State management
export * from './state/index.js';

// Coordination patterns
export * from './patterns/index.js';

// Monitoring
export * from './monitoring/index.js';
