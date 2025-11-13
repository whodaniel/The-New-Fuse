/**
 * AgentHub.ts
 *
 * Central service for managing AI agent communication, TRAYCER-style.
 * Handles task delegation, command execution, and agent discovery.
 */
import { EventEmitter } from 'events';
import { ProtobufAdapter } from '../adapters/ProtobufAdapter';
import { A2AService } from '@the-new-fuse/a2a-core';
import { MCPClient } from '@the-new-fuse/mcp-core';
import { MessageRouter } from '@the-new-fuse/relay-core';
import { AgentDiscoveryService } from './AgentDiscoveryService';
import { AgentCommunicationBridge } from './AgentCommunicationBridge';
export interface AgentConfiguration {
    id: string;
    name: string;
    displayName?: string;
    type: string;
    status: string;
    description?: string;
    systemPrompt?: string;
    capabilities: AgentCapability[];
    configuration: AgentConfigurationDetails;
    metadata?: Record<string, any>;
    provider?: string;
    userId?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    command?: string;
    args?: string[];
    workingDirectory?: string;
    environment?: Record<string, string>;
    enabled?: boolean;
}
export interface AgentCapability {
    name: string;
    description: string;
    parameters: Record<string, any>;
}
export interface AgentConfigurationDetails {
    provider: string;
    command: string;
    defaultModel?: string;
    localAI?: boolean;
    autoDetected?: boolean;
    systemAgent?: boolean;
    a2aEnabled?: boolean;
    mcpEnabled?: boolean;
}
export interface ExecutionContext {
    workspaceRoot: string;
    files: string[];
    currentFile?: string;
    selection?: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    metadata?: Record<string, any>;
}
export interface TaskExecutionOptions {
    timeout?: number;
    maxRetries?: number;
    context?: ExecutionContext;
    background?: boolean;
}
export declare class AgentHub extends EventEmitter {
    private a2aService?;
    private mcpClient?;
    private messageRouter?;
    private agentsDirectory?;
    private discoveryService?;
    private communicationBridge?;
    private protobufAdapter;
    private agents;
    private runningProcesses;
    private agentProcesses;
    private taskQueue;
    private a2aAgents;
    constructor(a2aService?: A2AService | undefined, mcpClient?: MCPClient | undefined, messageRouter?: MessageRouter | undefined, agentsDirectory?: string | undefined, discoveryService?: AgentDiscoveryService | undefined, communicationBridge?: AgentCommunicationBridge | undefined, protobufAdapter?: ProtobufAdapter);
    /**
     * Initialize agents using discovery service or fallback to legacy loading
     */
    private initializeAgents;
    /**
     * Setup event listeners for discovery service
     */
    private setupDiscoveryServiceEvents;
    /**
     * Register a single agent configuration
     */
    registerAgent(config: AgentConfiguration): Promise<void>;
    /**
     * Initialize service integration with A2A and MCP
     */
    private initializeServiceIntegration;
    /**
     * Load agent configurations from local-ai-agents directory
     */
    private loadAgentConfigurations;
    /**
     * Event handlers for A2A and MCP integration
     */
    private handleA2AAgentRegistered;
    private handleA2AAgentUpdated;
}
//# sourceMappingURL=AgentHub.d.ts.map