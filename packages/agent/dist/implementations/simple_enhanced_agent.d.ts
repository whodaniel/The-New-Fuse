/**
 * Simple Enhanced Agent - Lightweight enhanced agent
 *
 * A simpler version of the enhanced agent for:
 * - Quick deployment
 * - Lower resource usage
 * - Basic chat and tool capabilities
 * - Minimal configuration
 */
import { EventEmitter } from 'events';
export interface SimpleAgentConfig {
    id: string;
    name: string;
    model?: string;
    systemPrompt?: string;
    tools?: SimpleTool[];
    maxHistory?: number;
}
export interface SimpleTool {
    name: string;
    description: string;
    parameters: Record<string, {
        type: string;
        description?: string;
        required?: boolean;
    }>;
    execute: (params: Record<string, unknown>) => Promise<unknown>;
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
export interface ChatResponse {
    content: string;
    toolResults?: Array<{
        tool: string;
        result: unknown;
    }>;
}
export declare class SimpleEnhancedAgent extends EventEmitter {
    private config;
    private history;
    private systemPrompt;
    private maxHistory;
    private isActive;
    constructor(config: SimpleAgentConfig);
    /**
     * Start the agent
     */
    start(): void;
    /**
     * Stop the agent
     */
    stop(): void;
    /**
     * Check if active
     */
    isRunning(): boolean;
    /**
     * Send a message and get response
     */
    chat(userMessage: string): Promise<ChatResponse>;
    /**
     * Check for tool invocations in the message
     */
    private checkToolInvocations;
    /**
     * Generate a response (simulated)
     */
    private generateResponse;
    /**
     * Trim history to max size
     */
    private trimHistory;
    /**
     * Get chat history
     */
    getHistory(): ChatMessage[];
    /**
     * Clear history
     */
    clearHistory(): void;
    /**
     * Set system prompt
     */
    setSystemPrompt(prompt: string): void;
    /**
     * Add a tool
     */
    addTool(tool: SimpleTool): void;
    /**
     * Remove a tool
     */
    removeTool(name: string): void;
    /**
     * Get available tools
     */
    getTools(): SimpleTool[];
    /**
     * Get agent info
     */
    getInfo(): {
        id: string;
        name: string;
        model: string;
        isActive: boolean;
        historyLength: number;
        toolCount: number;
    };
}
export declare function createSimpleAgent(id: string, name: string, options?: Partial<SimpleAgentConfig>): SimpleEnhancedAgent;
export default SimpleEnhancedAgent;
//# sourceMappingURL=simple_enhanced_agent.d.ts.map