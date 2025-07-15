// Minimal core package export to resolve import errors
// TODO: Implement proper core functionality

export class SystemMonitor {
  constructor() {}
  start() {}
  stop() {}
}

export class MetricsCollector {
  constructor() {}
  collect() {}
}

export class PerformanceMonitor {
  constructor() {}
  monitor() {}
}

export class AgentLLMService {
  constructor() {}
  process() {}
}

export class MemorySystem {
  constructor() {}
  store() {}
  retrieve() {}
}

export class PromptService {
  constructor() {}
  generatePrompt() {}
}

export class WorkflowEngine {
  constructor() {}
  execute() {}
}

export class WorkflowExecutor {
  constructor() {}
  run() {}
}

export class UnifiedMonitoringService {
  constructor() {}
  monitor() {}
  recordMetric(metric: string, value: number, tags?: any) {}
  captureError(error: Error, context?: any) {}
}

export class LocalAIDetectionService {
  constructor() {}
  detect() {}
  detectAvailableAIs(): LocalAIProvider[] { return []; }
  checkProviderAvailability(provider: LocalAIProvider): Promise<boolean> { return Promise.resolve(false); }
}

export class AgentSwarmOrchestrationService {
  constructor() {}
  orchestrate() {}
  createExecution() {}
  getExecutions() {}
  getExecutionDetails() {}
}

export interface LocalAIProvider {
  name: string;
  endpoint: string;
  command?: string;
  checkCommand?: string;
}

export interface MemoryContent {
  id: string;
  content: string;
}

export interface MemoryQuery {
  query: string;
}

// Task enums for API compatibility
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class ConfigService {}
export class DatabaseService {}
export const TYPES = {};