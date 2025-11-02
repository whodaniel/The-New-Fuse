/**
 * @fileoverview Core package exports for The New Fuse platform
 * Production-ready implementations of core services and utilities
 */

// Core Services - Only export what we've properly implemented
export { SystemMonitor } from './services/SystemMonitor';
export { MetricsCollector } from './services/MetricsCollector';
export { PerformanceMonitor } from './services/PerformanceMonitor';
export { UnifiedMonitoringService } from './services/UnifiedMonitoringService';
export { LocalAIDetectionService } from './services/LocalAIDetectionService';
export { AgentLLMService, LLMResponse } from './services/AgentLLMService';
export { PromptService, PromptTemplate, PromptContext } from './services/PromptService';
export { FeatureFlagService } from './services/FeatureFlagService';
export { MongoFeatureFlagService } from './services/MongoFeatureFlagService';

// Agent Services - Only export working implementations
export { AgentOrchestrator, Task, Agent, TaskResult } from './agents/agent-orchestrator';
export { AgentSwarmOrchestrationService } from './agents/AgentSwarmOrchestrationService';

// Memory System
export { MemorySystem } from './memory/MemorySystem';
export { MemoryManager } from './memory/MemoryManager';

// Workflow System
export { WorkflowEngine } from './workflow/WorkflowEngine';
export { WorkflowExecutor } from './workflow/WorkflowExecutor';

// Configuration and Database
export { ConfigService } from './config/ConfigService';
export { DatabaseService } from './database/DatabaseService';

// Redis Services and Constants
export { REDIS_CHANNELS, REDIS_QUEUES } from './config/redis.config';

// Models
export { FeatureFlag, FeatureFlagDocument } from './models/FeatureFlag';

// Types and Interfaces
export * from './types/core';
export * from './types/agent';
export * from './types/memory';
export * from './types/workflow';
export * from './types/featureFlags';

// Export monitoring types with explicit naming to avoid conflicts
export { 
  PerformanceMetrics, 
  SystemMetrics, 
  ApplicationMetrics, 
  AgentMetrics, 
  WorkflowMetrics,
  Alert, 
  AlertSeverity, 
  AlertStatus, 
  AlertCondition, 
  AlertAction,
  LogEntry, 
  LogLevel,
  Trace, 
  Span, 
  SpanLog,
  Metric, 
  MetricType, 
  MetricSeries, 
  MetricDataPoint,
  HealthStatus as MonitoringHealthStatus,
  ServiceHealth as MonitoringServiceHealth
} from './types/monitoring';

// Constants
export * from './constants/types';

// Utilities
export { Logger, logger } from './utils/logger';
export * from './utils/errors';