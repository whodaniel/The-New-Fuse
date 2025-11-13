/**
 * Claude Agent SDK Service
 *
 * Integrates the Anthropic Claude Agent SDK into The New Fuse Framework's
 * core orchestration layer. This service provides:
 *
 * - Agent lifecycle management with SDK
 * - Multi-agent coordination via SDK
 * - Protocol bridge integration (A2A, MCP, Pydantic)
 * - Enhanced error handling and retry logic
 * - Performance monitoring and metrics
 */
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ClaudeAgentSDKAdapter, ClaudeSDKAgentConfig, ClaudeSDKExecutionContext, ClaudeSDKExecutionResult } from '@the-new-fuse/agent-protocol-bridge';
import type { IA2ACommunicator } from '@the-new-fuse/a2a-core';
import type { IMCPClient } from '@the-new-fuse/mcp-core';
export interface ManagedClaudeAgent {
    id: string;
    name: string;
    adapter: ClaudeAgentSDKAdapter;
    config: ClaudeSDKAgentConfig;
    status: 'idle' | 'busy' | 'error' | 'disposed';
    lastExecutionTime?: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    createdAt: Date;
    lastActiveAt?: Date;
}
export interface ClaudeAgentExecutionOptions {
    agentId?: string;
    agentName?: string;
    agentSelector?: (agents: ManagedClaudeAgent[]) => ManagedClaudeAgent;
    createIfNotExists?: boolean;
    context?: ClaudeSDKExecutionContext;
    retryOnError?: boolean;
    maxRetries?: number;
    routeViaA2A?: boolean;
    mcpServers?: string[];
}
/**
 * Claude Agent SDK Service
 *
 * Central service for managing Claude Agent SDK instances within
 * The New Fuse framework, providing seamless integration with
 * existing protocols and orchestration systems.
 */
export declare class ClaudeAgentSDKService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
    private readonly a2aService?;
    private readonly mcpClient?;
    private readonly logger;
    private readonly agents;
    private defaultAgentId?;
    constructor(a2aService?: IA2ACommunicator | undefined, mcpClient?: IMCPClient | undefined);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Register a new Claude agent with the service
     */
    registerAgent(config: ClaudeSDKAgentConfig): Promise<ManagedClaudeAgent>;
    /**
     * Execute a query using a Claude agent
     */
    execute(prompt: string, options?: ClaudeAgentExecutionOptions): Promise<ClaudeSDKExecutionResult>;
    /**
     * Execute with a specific agent
     */
    private executeWithAgent;
    /**
     * Execute via A2A protocol for multi-agent coordination
     */
    private executeViaA2A;
    /**
     * Select appropriate agent based on options
     */
    private selectAgent;
    /**
     * Setup A2A routing for incoming messages
     */
    private setupA2ARouting;
    /**
     * Setup event forwarding from adapter to service
     */
    private setupEventForwarding;
    /**
     * Dispose a managed agent
     */
    disposeAgent(agentId: string): Promise<boolean>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): ManagedClaudeAgent | undefined;
    /**
     * List all managed agents
     */
    listAgents(): ManagedClaudeAgent[];
    /**
     * Get service statistics
     */
    getStatistics(): {
        totalAgents: number;
        activeAgents: number;
        idleAgents: number;
        errorAgents: number;
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
        defaultAgentId: string | undefined;
    };
    /**
     * Calculate average execution time across all agents
     */
    private calculateAverageExecutionTime;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        agents: number;
        issues?: string[];
    }>;
}
//# sourceMappingURL=ClaudeAgentSDKService.d.ts.map