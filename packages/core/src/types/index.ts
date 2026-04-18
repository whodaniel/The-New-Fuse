// Core exports
export * from './agent.js';
export * from './analysis.js';
export * from './core.js';
export * from './communication.js';
export { CommunicationPattern, ModelType, ResourceType, TokenType, WalletType } from './models.js';
export { MessageRole, MessageType, MessageStatus, VerificationLevel } from './enums.js';
export * from './monitoring.js';
export * from './prompt.types.js';
export * from './security.js';
export * from './state.js';

export * from './validation.js';

// Constants and enums
export { ServiceState } from '../constants/types.js';

// Named exports from analysis and agent
export { type ValidationError, type ValidationWarning } from './analysis.js';
export type { AgentState } from './agent.js';

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
  MessageBroker: Symbol('MessageBroker'),
  MessageRouter: Symbol('MessageRouter'),
  NotificationService: Symbol('NotificationService'),
  AnalysisManager: Symbol('AnalysisManager'),
  AnalysisVisualizer: Symbol('AnalysisVisualizer'),
};
