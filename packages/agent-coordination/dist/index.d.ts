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
export * from './redis-coordinator.js';
export * from './types/coordination.types';
export * from './broadcast/broadcast-manager.js';
export * from './coordination/shared-state-manager.js';
export * from './presence/presence-tracker.js';
export * from './queues/task-queue-manager.js';
export * from './serializers/message-serializer.js';
export { AgentCapability, AgentInfo, AgentPool, AgentPoolConfig, CoordinationConfig, PerformanceMetrics as CorePerformanceMetrics, ExecutionMode, Task, TaskAssigner, TaskAssignment, TaskDependency, TaskQueue, TaskResult, } from './core/index.js';
export * from './orchestration/index.js';
export * from './state/index.js';
export * from './patterns/index.js';
export * from './monitoring/index.js';
//# sourceMappingURL=index.d.ts.map