/**
 * Message Control Protocol (MCP) Implementation
 *
 * This module implements a simplified MCP protocol for AI agent communication,
 * enabling autonomous discovery and interaction between AI extensions.
 */
import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
export interface MCPMessage {
    namespace: string;
    command: string;
    parameters: Record<string, any>;
    requestId?: string;
}
export interface MCPResponse {
    success: boolean;
    result?: any;
    error?: string;
}
type MCPHandler = (parameters: Record<string, any>) => Promise<any>;
/**
 * MCP Protocol Manager
 */
export declare class MCPProtocolManager {
    private context;
    private agentClient;
    private handlers;
    private outputChannel;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient);
    /**
     * Register built-in MCP handlers
     */
    private registerBuiltinHandlers;
    /**
     * Register VS Code commands
     */
    private registerCommands;
    /**
     * Register an MCP handler
     */
    registerHandler(fullCommand: string, handler: MCPHandler): void;
    /**
     * Register an MCP handler from a string or function
     */
    registerHandlerFromString(fullCommand: string, handlerFn: string | Function): Promise<boolean>;
    /**
     * Send an MCP message to another agent
     */
    sendMCPMessage(recipient: string, namespace: string, command: string, parameters: Record<string, any>): Promise<MCPResponse>;
    /**
     * Start auto-discovery of AI agents
     */
    startAutoDiscovery(): Promise<boolean>;
    /**
     * Handle incoming agent messages
     */
    private handleAgentMessage;
    /**
     * Log a message to the output channel
     */
    private log;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
export declare function createMCPProtocolManager(context: vscode.ExtensionContext, agentClient: AgentClient): MCPProtocolManager;
export {};
//# sourceMappingURL=mcp-protocol.d.ts.map