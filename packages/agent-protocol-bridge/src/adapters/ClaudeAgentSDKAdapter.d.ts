/**
 * Claude Agent SDK Adapter for The New Fuse Framework
 *
 * Simplified adapter that integrates the Anthropic Claude Agent SDK (v0.1.5+)
 * with the existing protocol bridge architecture.
 *
 * This adapter provides:
 * - Claude SDK query execution
 * - A2A protocol message translation
 * - Basic tool integration
 * - Event-driven message handling
 */
import { type SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';
import { EventEmitter } from 'events';
import { ProtocolMessage } from '../AgentProtocolBridge';
export interface ClaudeSDKAgentConfig {
    agentId: string;
    agentName: string;
    model?: 'sonnet' | 'opus' | 'haiku';
    maxTokens?: number;
    systemPrompt?: string | {
        type: 'preset';
        preset: 'claude_code';
        append?: string;
    };
    settingSources?: ('user' | 'project' | 'local')[];
    mcpServers?: Record<string, {
        command: string;
        args?: string[];
        env?: Record<string, string>;
    }>;
}
export interface ClaudeToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, any>;
    handler: (input: Record<string, unknown>) => Promise<any>;
}
export declare class ClaudeAgentSDKAdapter extends EventEmitter {
    private readonly logger;
    private config;
    private tools;
    constructor(config: ClaudeSDKAgentConfig);
    /**
     * Register a custom tool for Claude to use
     */
    registerTool(toolDef: ClaudeToolDefinition): void;
    /**
     * Execute a query using the Claude Agent SDK
     */
    executeQuery(prompt: string | AsyncIterable<SDKUserMessage>): Promise<any>;
    /**
     * Translate A2A message to Claude SDK query
     */
    handleA2AMessage(message: ProtocolMessage): Promise<ProtocolMessage>;
    /**
     * Convert A2A message to Claude prompt
     */
    private a2aMessageToPrompt;
    /**
     * Convert Claude response to A2A message
     */
    private claudeResponseToA2A;
    /**
     * Create error response
     */
    private createErrorResponse;
    /**
     * Get adapter status
     */
    getStatus(): {
        agentId: string;
        agentName: string;
        toolsRegistered: number;
        config: Partial<ClaudeSDKAgentConfig>;
    };
    /**
     * Cleanup resources
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=ClaudeAgentSDKAdapter.d.ts.map