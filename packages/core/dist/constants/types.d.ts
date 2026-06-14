/**
 * @fileoverview Dependency injection types and constants
 */
export declare const TYPES: {
    readonly SystemMonitor: symbol;
    readonly MetricsCollector: symbol;
    readonly PerformanceMonitor: symbol;
    readonly UnifiedMonitoringService: symbol;
    readonly AgentOrchestrator: symbol;
    readonly AgentSwarmOrchestrationService: symbol;
    readonly AgentProcessor: symbol;
    readonly AgentLLMService: symbol;
    readonly MemorySystem: symbol;
    readonly MemoryManager: symbol;
    readonly WorkflowEngine: symbol;
    readonly WorkflowExecutor: symbol;
    readonly LocalAIDetectionService: symbol;
    readonly PromptService: symbol;
    readonly ConfigService: symbol;
    readonly DatabaseService: symbol;
    readonly Logger: symbol;
    readonly ErrorHandler: symbol;
};
export declare enum ServiceState {
    UNINITIALIZED = "UNINITIALIZED",
    INITIALIZING = "INITIALIZING",
    RUNNING = "RUNNING",
    STOPPING = "STOPPING",
    STOPPED = "STOPPED",
    ERROR = "ERROR"
}
export declare const DEFAULT_TIMEOUT = 30000;
export declare const DEFAULT_RETRY_ATTEMPTS = 3;
export declare const DEFAULT_BATCH_SIZE = 100;
export declare const DEFAULT_CACHE_TTL = 300;
export declare const ENVIRONMENTS: {
    readonly DEVELOPMENT: "development";
    readonly STAGING: "staging";
    readonly PRODUCTION: "production";
    readonly TEST: "test";
};
export declare const ERROR_CODES: {
    readonly SYSTEM_INITIALIZATION_FAILED: "SYSTEM_INITIALIZATION_FAILED";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly CONFIGURATION_ERROR: "CONFIGURATION_ERROR";
    readonly AGENT_NOT_FOUND: "AGENT_NOT_FOUND";
    readonly AGENT_INITIALIZATION_FAILED: "AGENT_INITIALIZATION_FAILED";
    readonly AGENT_EXECUTION_FAILED: "AGENT_EXECUTION_FAILED";
    readonly AGENT_TIMEOUT: "AGENT_TIMEOUT";
    readonly TASK_NOT_FOUND: "TASK_NOT_FOUND";
    readonly TASK_EXECUTION_FAILED: "TASK_EXECUTION_FAILED";
    readonly TASK_VALIDATION_FAILED: "TASK_VALIDATION_FAILED";
    readonly WORKFLOW_NOT_FOUND: "WORKFLOW_NOT_FOUND";
    readonly WORKFLOW_EXECUTION_FAILED: "WORKFLOW_EXECUTION_FAILED";
    readonly WORKFLOW_VALIDATION_FAILED: "WORKFLOW_VALIDATION_FAILED";
    readonly MEMORY_STORAGE_FAILED: "MEMORY_STORAGE_FAILED";
    readonly MEMORY_RETRIEVAL_FAILED: "MEMORY_RETRIEVAL_FAILED";
    readonly MEMORY_QUERY_FAILED: "MEMORY_QUERY_FAILED";
    readonly DATABASE_CONNECTION_FAILED: "DATABASE_CONNECTION_FAILED";
    readonly DATABASE_QUERY_FAILED: "DATABASE_QUERY_FAILED";
    readonly DATABASE_TRANSACTION_FAILED: "DATABASE_TRANSACTION_FAILED";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly INVALID_FORMAT: "INVALID_FORMAT";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly TIMEOUT_ERROR: "TIMEOUT_ERROR";
    readonly CONNECTION_REFUSED: "CONNECTION_REFUSED";
};
//# sourceMappingURL=types.d.ts.map