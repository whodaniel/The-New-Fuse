import { BaseServiceConfig } from './service-types.js';
export declare enum AgentState {
    INITIALIZING = "INITIALIZING",
    READY = "READY",
    BUSY = "BUSY",
    ERROR = "ERROR",
    TERMINATED = "TERMINATED"
}
export declare enum AgentCapability {
    CODE_GENERATION = "code_generation",
    CODE_REVIEW = "code_review",
    ARCHITECTURE_DESIGN = "architecture_design",
    TESTING = "testing",
    DOCUMENTATION = "documentation",
    OPTIMIZATION = "optimization",
    SECURITY_AUDIT = "security_audit",
    PROJECT_MANAGEMENT = "project_management"
}
export interface AgentConfig extends BaseServiceConfig {
    agentId: string;
    capabilities: Set<AgentCapability>;
    modelName?: string;
    maxConcurrentTasks?: number;
    taskTimeout?: number;
    retryLimit?: number;
    memoryLimit?: number;
}
export interface ProcessedMessage {
    id: string;
    content: string;
    role: 'system' | 'user' | 'assistant';
    timestamp: Date;
    metadata: Record<string, unknown>;
}
export interface LLMContext {
    messages: ProcessedMessage[];
    functions?: Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
    tools?: Array<{
        type: string;
        function: {
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        };
    }>;
}
export interface LLMResponse {
    id: string;
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    metadata?: Record<string, unknown>;
}
export interface StreamChunk {
    id: string;
    content: string;
    isComplete: boolean;
}
//# sourceMappingURL=agent-types.d.ts.map