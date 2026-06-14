/**
 * @fileoverview Dependency injection types and constants
 */
export const TYPES = {
    // Core Services
    SystemMonitor: Symbol.for('SystemMonitor'),
    MetricsCollector: Symbol.for('MetricsCollector'),
    PerformanceMonitor: Symbol.for('PerformanceMonitor'),
    UnifiedMonitoringService: Symbol.for('UnifiedMonitoringService'),
    // Agent Services
    AgentOrchestrator: Symbol.for('AgentOrchestrator'),
    AgentSwarmOrchestrationService: Symbol.for('AgentSwarmOrchestrationService'),
    AgentProcessor: Symbol.for('AgentProcessor'),
    AgentLLMService: Symbol.for('AgentLLMService'),
    // Memory Services
    MemorySystem: Symbol.for('MemorySystem'),
    MemoryManager: Symbol.for('MemoryManager'),
    // Workflow Services
    WorkflowEngine: Symbol.for('WorkflowEngine'),
    WorkflowExecutor: Symbol.for('WorkflowExecutor'),
    // AI Services
    LocalAIDetectionService: Symbol.for('LocalAIDetectionService'),
    PromptService: Symbol.for('PromptService'),
    // Configuration and Database
    ConfigService: Symbol.for('ConfigService'),
    DatabaseService: Symbol.for('DatabaseService'),
    // Utilities
    Logger: Symbol.for('Logger'),
    ErrorHandler: Symbol.for('ErrorHandler'),
};
// Service Lifecycle States
export var ServiceState;
(function (ServiceState) {
    ServiceState["UNINITIALIZED"] = "UNINITIALIZED";
    ServiceState["INITIALIZING"] = "INITIALIZING";
    ServiceState["RUNNING"] = "RUNNING";
    ServiceState["STOPPING"] = "STOPPING";
    ServiceState["STOPPED"] = "STOPPED";
    ServiceState["ERROR"] = "ERROR";
})(ServiceState || (ServiceState = {}));
// Common Constants
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_BATCH_SIZE = 100;
export const DEFAULT_CACHE_TTL = 300; // 5 minutes
// Environment Constants
export const ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
    TEST: 'test',
};
// Error Codes
export const ERROR_CODES = {
    // System Errors
    SYSTEM_INITIALIZATION_FAILED: 'SYSTEM_INITIALIZATION_FAILED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    // Agent Errors
    AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
    AGENT_INITIALIZATION_FAILED: 'AGENT_INITIALIZATION_FAILED',
    AGENT_EXECUTION_FAILED: 'AGENT_EXECUTION_FAILED',
    AGENT_TIMEOUT: 'AGENT_TIMEOUT',
    // Task Errors
    TASK_NOT_FOUND: 'TASK_NOT_FOUND',
    TASK_EXECUTION_FAILED: 'TASK_EXECUTION_FAILED',
    TASK_VALIDATION_FAILED: 'TASK_VALIDATION_FAILED',
    // Workflow Errors
    WORKFLOW_NOT_FOUND: 'WORKFLOW_NOT_FOUND',
    WORKFLOW_EXECUTION_FAILED: 'WORKFLOW_EXECUTION_FAILED',
    WORKFLOW_VALIDATION_FAILED: 'WORKFLOW_VALIDATION_FAILED',
    // Memory Errors
    MEMORY_STORAGE_FAILED: 'MEMORY_STORAGE_FAILED',
    MEMORY_RETRIEVAL_FAILED: 'MEMORY_RETRIEVAL_FAILED',
    MEMORY_QUERY_FAILED: 'MEMORY_QUERY_FAILED',
    // Database Errors
    DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
    DATABASE_QUERY_FAILED: 'DATABASE_QUERY_FAILED',
    DATABASE_TRANSACTION_FAILED: 'DATABASE_TRANSACTION_FAILED',
    // Validation Errors
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
    // Authentication/Authorization Errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    // Network Errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    CONNECTION_REFUSED: 'CONNECTION_REFUSED',
};
//# sourceMappingURL=types.js.map