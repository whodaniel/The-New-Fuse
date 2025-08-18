/**
 * MCP Performance Optimization Exports
 */

// Caching strategies
export {
  LRUCache,
  MultiLevelCache,
  CacheFactory,
  EvictionStrategy
} from './CacheStrategy';

export type {
  ICache,
  CacheEntry,
  CacheConfig,
  CacheStats
} from './CacheStrategy';

// Connection pool optimization
export {
  OptimizedConnectionPool,
  ConnectionPoolFactory
} from './ConnectionPoolOptimizer';

export type {
  IConnection,
  IConnectionFactory,
  ConnectionPoolConfig,
  PoolStatistics
} from './ConnectionPoolOptimizer';

// Load testing
export {
  LoadTestRunner
} from './LoadTestRunner';

export type {
  LoadTestScenario,
  LoadTestPhase,
  LoadTestOperation,
  LoadTestResult,
  PhaseResult,
  OperationResult,
  TestStatistics,
  TimelinePoint,
  ErrorSummary
} from './LoadTestRunner';

// Performance validation
export {
  PerformanceValidator
} from './PerformanceValidator';

export type {
  PerformanceTargets,
  ValidationResult,
  TargetValidation,
  PerformanceMetrics,
  ScalabilityAnalysis
} from './PerformanceValidator';