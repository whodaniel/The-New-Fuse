/**
 * Build monitoring and reporting system exports
 */

// New unified monitoring system (recommended)
export { BuildMonitoringSystem } from './BuildMonitoringSystem.js';

// New unified error handler (recommended)
export { BuildUnifiedErrorHandler } from './BuildUnifiedErrorHandler.js';
export type { BuildError, BuildErrorContext, BuildErrorHandlerConfig } from './BuildUnifiedErrorHandler.js';

// Legacy components (still available)
export { BuildMetricsCollector } from './BuildMetricsCollector.js';
export type { DetailedBuildMetrics, StageMetrics, PerformanceStats } from './BuildMetricsCollector.js';

export { BuildFailureAnalyzer } from './BuildFailureAnalyzer.js';
export type { 
  FailureType, 
  FailureAnalysis, 
  BuildRecommendation 
} from './BuildFailureAnalyzer.js';