export const TYPES = {
  // Implementation needed
}
  // Core Services
  ConfigService: Symbol.for('ConfigService'),
  DatabaseService: Symbol.for('DatabaseService'),
  RedisService: Symbol.for('RedisService'),
  LoggingService: Symbol.for('LoggingService'),
  CacheService: Symbol.for('CacheService'),
  TimeService: Symbol.for('TimeService'),
  ErrorHandler: Symbol.for('ErrorHandler'),
  
  // Agent Services
  AgentService: Symbol.for('AgentService'),
  AgentLLMService: Symbol.for('AgentLLMService'),
  LocalAIDetectionService: Symbol.for('LocalAIDetectionService'),
  AgentManager: Symbol.for('AgentManager'),
  AgentOrchestrator: Symbol.for('AgentOrchestrator'),
  
  // Communication Services
  WebSocketService: Symbol.for('WebSocketService'),
  WebSocketManager: Symbol.for('WebSocketManager'),
  CommunicationManager: Symbol.for('CommunicationManager'),
  MessageRouter: Symbol.for('MessageRouter'),
  
  // Memory Services
  MemoryManager: Symbol.for('MemoryManager'),
  MemoryService: Symbol.for('MemoryService'),
  VectorMemoryStore: Symbol.for('VectorMemoryStore'),
  
  // Workflow Services
  WorkflowEngine: Symbol.for('WorkflowEngine'),
  WorkflowService: Symbol.for('WorkflowService'),
  WorkflowExecutor: Symbol.for('WorkflowExecutor'),
  
  // Task Services
  TaskService: Symbol.for('TaskService'),
  TaskExecutor: Symbol.for('TaskExecutor'),
  TaskScheduler: Symbol.for('TaskScheduler'),
  
  // Monitoring Services
  MonitoringService: Symbol.for('MonitoringService'),
  MetricsService: Symbol.for('MetricsService'),
  SystemMonitor: Symbol.for('SystemMonitor'),
  
  // Security Services
  SecurityService: Symbol.for('SecurityService'),
  AuthenticationService: Symbol.for('AuthenticationService'),
  AuthorizationService: Symbol.for('AuthorizationService'),
  
  // Integration Services
  IntegrationManager: Symbol.for('IntegrationManager'),
  ServiceRegistry: Symbol.for('ServiceRegistry'),
  
  // Queue Services
  QueueService: Symbol.for('QueueService'),
  MessageQueue: Symbol.for('MessageQueue'),
  
  // Error Services
  ErrorHandlingService: Symbol.for('ErrorHandlingService'),
  ErrorRecoveryService: Symbol.for('ErrorRecoveryService'),
  
  // Repositories
  AgentRepository: Symbol.for('AgentRepository'),
  UserRepository: Symbol.for('UserRepository'),
  WorkflowRepository: Symbol.for('WorkflowRepository'),
  TaskRepository: Symbol.for('TaskRepository'),
  
  // Legacy aliases
  Config: Symbol.for('ConfigService'),
  Logger: Symbol.for('LoggingService'),
  Cache: Symbol.for('CacheService'),
  Time: Symbol.for('TimeService')
} as const;
export type DITypes = typeof TYPES;