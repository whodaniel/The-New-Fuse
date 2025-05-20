// Core exports
export * from './agent.js'; // Adjusted extension
export * from './analysis.js'; // Adjusted extension
export {
  type InteractionContext,
  CommunicationPattern,
  ModelType,
  ResourceType,
  TokenType,
  WalletType
} from './communication.js'; // Adjusted extension
export * from './enums.js'; // Adjusted extension
// export { // Commented out - './interfaces' likely missing
//   type ExtendedLLMConfig,
//   type BaseMessage
// } from './interfaces.js';

// Type definitions
// export * from './llm.js'; // Commented out - likely missing
// export * from './llm.types.js'; // Commented out - likely missing
// export * from './memory.js'; // Commented out - likely missing
// export * from './memory.types.js'; // Commented out - likely missing
// export * from './messages.js'; // Commented out - likely missing
// export * from './models.js'; // Commented out - likely missing
export * from './monitoring.js'; // Adjusted extension - monitoring.tsx/d.tsx exist
export * from './prompt.types.js'; // Adjusted extension - prompt.types.tsx/d.tsx exist
export * from './security.js'; // Adjusted extension - security.tsx exists
export * from './state.js'; // Adjusted extension
export * from './task.js'; // Adjusted extension - task.tsx/d.tsx exist
export * from './validation.js'; // Adjusted extension - validation.tsx/d.tsx exist
// Named exports from analysis and agent
export {
  type ValidationError,
  type ValidationWarning
} from './analysis.js'; // Adjusted extension
export type { AgentState } from './agent.js'; // Adjusted extension

// Common types
// export type { // Commented out - './common' likely missing
//   CommonConfig,
//   CommonError,
//   CommonEvent,
//   CommonMetadata,
//   CommonResponse
// } from './common.js';

// Dependency Injection Types
export const TYPES = {
  // Core Services
  Logger: Symbol('Logger'),
  ConfigService: Symbol('ConfigService'),
  DatabaseService: Symbol('DatabaseService'),
  JwtService: Symbol('JwtService'),
  MetricsCollector: Symbol('MetricsCollector'),
  PerformanceMonitor: Symbol('PerformanceMonitor'),
  AuthService: Symbol('AuthService'),
  LoggingService: Symbol('LoggingService'),
  MemoryService: Symbol('MemoryService'),
  EventBus: Symbol('EventBus'),

  // Communication
  MessageBroker: Symbol('MessageBroker'),
  MessageRouter: Symbol('MessageRouter'),
  NotificationService: Symbol('NotificationService'),

  // Analysis
  AnalysisManager: Symbol('AnalysisManager'),
  AnalysisVisualizer: Symbol('AnalysisVisualizer')
};

// External package types

// export * as Types from '@the-new-fuse/types';

export type {
  // type WorkflowDefinition, // 'type' keyword here is incorrect syntax
  WorkflowDefinition, // Corrected syntax
  WorkflowDefinitionType,
  WorkflowExecution,
  WorkflowStatus,
  Workflow,
  WorkflowTask,
  WorkflowEdge
} from './workflow.js'; // Adjusted extension - workflow.tsx/d.tsx exist

// Add WorkflowSchema export
export { WorkflowSchema } from './workflow.js'; // Adjusted extension

export interface VectorStore {
  dimensions: number;
  similarity: 'cosine' | 'euclidean' | 'dot';
  store(vectors: number[][], metadata: unknown[]): Promise<void>;
  search(query: number[], k: number): Promise<SearchResult[]>;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: unknown;
}

export interface ChatCompletion {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: 'assistant' | 'user' | 'system';
      content: string;
    };
    finish_reason: string;
  }>;
}
