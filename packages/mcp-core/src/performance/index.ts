/**
 * MCP Performance Optimization Exports
 */

// Caching strategies
export { CacheFactory, EvictionStrategy, LRUCache, MultiLevelCache } from './CacheStrategy';

export type { CacheConfig, CacheEntry, CacheStats, ICache } from './CacheStrategy';

// Connection pool optimization
export { ConnectionPoolFactory, OptimizedConnectionPool } from './ConnectionPoolOptimizer';

export type {
  ConnectionPoolConfig,
  IConnection,
  IConnectionFactory,
  PoolStatistics,
} from './ConnectionPoolOptimizer';

// Load testing
export { LoadTestRunner } from './LoadTestRunner';

export type {
  ErrorSummary,
  LoadTestOperation,
  LoadTestPhase,
  LoadTestResult,
  LoadTestScenario,
  OperationResult,
  PhaseResult,
  TestStatistics,
  TimelinePoint,
} from './LoadTestRunner';

// Performance validation
export { PerformanceValidator } from './PerformanceValidator';

export type {
  PerformanceMetrics,
  PerformanceTargets,
  ScalabilityAnalysis,
  TargetValidation,
  ValidationResult,
} from './PerformanceValidator';
