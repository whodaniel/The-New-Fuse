/**
 * Enhanced Agent - Advanced agent with full capabilities
 *
 * An enhanced agent implementation that provides:
 * - Multi-model LLM support
 * - Context management
 * - Tool integration
 * - Memory systems
 * - Learning capabilities
 * - Self-improvement
 */
import { EventEmitter } from 'events';
export interface EnhancedAgentConfig {
    id: string;
    name: string;
    capabilities: string[];
    models: AgentModel[];
    tools: AgentTool[];
    memory: MemoryConfig;
    learningEnabled: boolean;
}
export interface AgentModel {
    id: string;
    provider: 'openai' | 'anthropic' | 'google' | 'local';
    model: string;
    contextWindow: number;
    capabilities: string[];
    priority: number;
}
export interface AgentTool {
    id: string;
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (input: unknown) => Promise<unknown>;
}
export interface MemoryConfig {
    shortTermSize: number;
    longTermEnabled: boolean;
    vectorStoreId?: string;
    summarizationInterval: number;
}
export interface AgentContext {
    conversationId: string;
    messages: Message[];
    variables: Record<string, unknown>;
    metadata: Record<string, unknown>;
}
export interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    name?: string;
    toolCallId?: string;
    timestamp: Date;
}
export interface AgentResponse {
    content: string;
    toolCalls?: ToolCall[];
    metadata: {
        model: string;
        tokens: {
            input: number;
            output: number;
        };
        latency: number;
    };
}
export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
interface AgentMetrics {
    requestsProcessed: number;
    tokensUsed: number;
    averageLatency: number;
    toolsInvoked: number;
    errors: number;
}
export declare class EnhancedAgent extends EventEmitter {
    private config;
    private contexts;
    private shortTermMemory;
    private metrics;
    private isRunning;
    constructor(config: EnhancedAgentConfig);
    /**
     * Start the agent
     */
    start(): Promise<void>;
    /**
     * Stop the agent
     */
    stop(): Promise<void>;
    /**
     * Get agent status
     */
    getStatus(): {
        id: string;
        name: string;
        running: boolean;
        capabilities: string[];
        metrics: AgentMetrics;
    };
    /**
     * Process a user message
     */
    processMessage(conversationId: string, message: string, options?: {
        model?: string;
        systemPrompt?: string;
        tools?: string[];
    }): Promise<AgentResponse>;
    /**
     * Create a new context
     */
    private createContext;
    /**
     * Get context
     */
    getContext(conversationId: string): AgentContext | undefined;
    /**
     * Clear context
     */
    clearContext(conversationId: string): void;
    /**
     * Select the best model for the task
     */
    private selectModel;
    /**
     * Build prompt with context
     */
    private buildPrompt;
    /**
     * Call model (simulated)
     */
    private callModel;
    /**
     * Get available tools
     */
    private getTools;
    /**
     * Execute a tool
     */
    private executeTool;
    /**
     * Register a tool
     */
    registerTool(tool: AgentTool): void;
    /**
     * Unregister a tool
     */
    unregisterTool(toolId: string): void;
    /**
     * Manage memory for a context
     */
    private manageMemory;
    /**
     * Search memory
     */
    searchMemory(query: string, limit?: number): Message[];
    /**
     * Learn from feedback
     */
    learnFromFeedback(conversationId: string, messageIndex: number, feedback: 'positive' | 'negative', correction?: string): Promise<void>;
    /**
     * Get capabilities
     */
    getCapabilities(): string[];
    /**
     * Check if has capability
     */
    hasCapability(capability: string): boolean;
    /**
     * Add capability
     */
    addCapability(capability: string): void;
}
export declare function createEnhancedAgent(id: string, name: string, options?: Partial<EnhancedAgentConfig>): EnhancedAgent;
export default EnhancedAgent;
//# sourceMappingURL=enhanced_agent.d.ts.map