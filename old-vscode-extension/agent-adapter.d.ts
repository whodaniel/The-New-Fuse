/**
 * Agent Adapter Module
 *
 * This module provides adapters for integrating with specific VS Code AI extensions,
 * allowing them to participate in The New Fuse's inter-extension communication system.
 */
import * as vscode from 'vscode';
import { AgentClient } from './agent-communication.js';
export interface ExtensionAdapter {
    id: string;
    name: string;
    extensionId: string;
    capabilities: string[];
    isActive: boolean;
    sendMessage(action: string, payload: any): Promise<any>;
}
/**
 * Adapter for GitHub Copilot
 */
export declare class CopilotAdapter implements ExtensionAdapter {
    id: string;
    name: string;
    extensionId: string;
    capabilities: string[];
    isActive: boolean;
    private context;
    private agentClient;
    private initialized;
    private commandMap;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient);
    isAvailable(): Promise<boolean>;
    initialize(): Promise<boolean>;
    executeCommand(action: string, input: any): Promise<any>;
    private adaptInput;
    private handleAgentMessage;
    dispose(): void;
}
/**
 * Adapter for Claude extension
 */
export declare class ClaudeAdapter implements ExtensionAdapter {
    id: string;
    name: string;
    extensionId: string;
    capabilities: string[];
    isActive: boolean;
    private context;
    private agentClient;
    private initialized;
    private commandMap;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient);
    isAvailable(): Promise<boolean>;
    initialize(): Promise<boolean>;
    executeCommand(action: string, input: any): Promise<any>;
    private adaptInput;
    private handleAgentMessage;
    dispose(): void;
}
/**
 * AgentAdapterManager manages all the extension adapters
 */
export declare class AgentAdapterManager {
    private context;
    private agentClient;
    private adapters;
    private outputChannel;
    constructor(context: vscode.ExtensionContext, agentClient: AgentClient, outputChannel: vscode.OutputChannel);
    /**
     * Initialize the adapter manager and discover extensions
     */
    initialize(): Promise<void>;
    /**
     * Get available adapters
     */
    getAvailableAdapters(): ExtensionAdapter[];
    /**
     * Get adapter by ID
     */
    getAdapter(id: string): ExtensionAdapter | undefined;
    /**
     * Handle messages directed to adapters
     */
    private handleAdapterMessage;
    /**
     * Register an adapter from a registration message
     */
    private registerAdapter;
    /**
     * Route a message to an adapter
     */
    private routeMessageToAdapter;
    /**
     * Detect installed AI extensions and create adapters
     */
    private detectExtensions;
    /**
     * Log a message to the output channel
     */
    private log;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
/**
 * Factory function to create an agent adapter manager
 */
export declare function createAgentAdapterManager(context: vscode.ExtensionContext, agentClient: AgentClient, outputChannel: vscode.OutputChannel): AgentAdapterManager;
//# sourceMappingURL=agent-adapter.d.ts.map