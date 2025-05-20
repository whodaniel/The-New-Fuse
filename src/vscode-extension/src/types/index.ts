import * as vscode from 'vscode';

export interface WebViewMessage {
    command: string;
    text?: string;
    data?: any;
    timestamp?: string;
    type?: string;
    metadata?: Record<string, any>;
}

export interface MonitoringClient {
    recordEvent(eventName: string, eventData?: Record<string, any>): void;
    recordError(error: Error, context?: string): void;
    getStats(): Promise<Record<string, any>>;
}

export interface MCPManager {
    registerTool(tool: MCPTool): void;
    getRegisteredTools(): MCPTool[];
    executeTool(toolId: string, params: any): Promise<any>;
}

export interface MCPTool {
    id: string;
    name: string;
    description: string;
    execute(params: any): Promise<any>;
}

export interface AgentIntegration {
    registerAgent(agentId: string, capabilities: string[]): void;
    sendMessage(agentId: string, message: string): Promise<string>;
    getAgents(): { id: string, capabilities: string[] }[];
}

export interface TheFuseAPI {
    sendMessage(message: string): Promise<string>;
    getAvailableModels(): Promise<string[]>;
    getCurrentModel(): Promise<string | undefined>;
    monitoring?: MonitoringClient;
    mcpManager?: MCPManager;
    agentIntegration?: AgentIntegration;
    chromeWebSocketService?: any; // Using 'any' to avoid circular dependencies
}

export interface LanguageModelAccessInformation {
    apiKey: string;
    model: string;
    organizationId?: string;
}

export type MessageType = 'message' | 'error' | 'status' | 'command';

export interface AIMessage {
    id: string;
    type: MessageType;
    text: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

export interface MessageHandler {
    handleMessage(message: WebViewMessage): Promise<void>;
}