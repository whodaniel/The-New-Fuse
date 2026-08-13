/**
 * MCP Performance Optimization Exports
 */

// Caching strategies
export {
  LRUCache,
  MultiLevelCache,
  CacheFactory,
  EvictionStrategy
} from './CacheStrategy.js';

export type {
  ICache,
  CacheEntry,
  CacheConfig,
  CacheStats
} from './CacheStrategy.js';

// Connection pool optimization
export {
  OptimizedConnectionPool,
  ConnectionPoolFactory
} from './ConnectionPoolOptimizer.js';

export type {
  IConnection,
  IConnectionFactory,
  ConnectionPoolConfig,
  PoolStatistics
} from './ConnectionPoolOptimizer.js';

// Load testing
export {
  LoadTestRunner
} from './LoadTestRunner.js';

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
} from './LoadTestRunner.js';

// Performance validation
export {
  PerformanceValidator
} from './PerformanceValidator.js';

export type {
  PerformanceTargets,
  ValidationResult,
  TargetValidation,
  PerformanceMetrics,
  ScalabilityAnalysis
} from './PerformanceValidator.js';