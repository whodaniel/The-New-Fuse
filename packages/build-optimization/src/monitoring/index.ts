/**
 * Build monitoring and reporting system exports
 */

// New unified monitoring system (recommended)
export { BuildMonitoringSystem } from './BuildMonitoringSystem';

// New unified error handler (recommended)
export { BuildUnifiedErrorHandler } from './BuildUnifiedErrorHandler';
export type { BuildError, BuildErrorContext, BuildErrorHandlerConfig } from './BuildUnifiedErrorHandler';

// Legacy components (still available)
export { BuildMetricsCollector } from './BuildMetricsCollector';
export type { DetailedBuildMetrics, StageMetrics, PerformanceStats } from './BuildMetricsCollector';

export { BuildFailureAnalyzer } from './BuildFailureAnalyzer';
export type { 
  FailureType, 
  FailureAnalysis, 
  BuildRecommendation 
} from './BuildFailureAnalyzer';