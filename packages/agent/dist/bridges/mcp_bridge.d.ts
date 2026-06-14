/**
 * MCP Bridge - Model Context Protocol Integration
 *
 * Provides bridge functionality for MCP (Model Context Protocol):
 * - Tool registration and execution
 * - Resource management
 * - Prompt handling
 * - Server lifecycle management
 *
 * CONNECTS TO:
 * - UniversalBridge: For transport abstraction
 * - ProtocolBridge: For A2A protocol integration
 * - TNFMCPModule: For NestJS integration
 */
import { BaseBridge, MessageType, Priority } from './index.js';
export interface MCPServerInfo {
    name: string;
    version: string;
    protocolVersion: string;
    capabilities: {
        tools?: boolean;
        resources?: boolean;
        prompts?: boolean;
        logging?: boolean;
    };
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description?: string;
            enum?: string[];
        }>;
        required?: string[];
    };
}
export interface MCPToolCall {
    name: string;
    arguments: Record<string, unknown>;
}
export interface MCPToolResult {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
}
export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}
export interface MCPResourceContent {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
}
export interface MCPPrompt {
    name: string;
    description?: string;
    arguments?: Array<{
        name: string;
        description?: string;
        required?: boolean;
    }>;
}
export interface MCPPromptMessage {
    role: 'user' | 'assistant';
    content: {
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    };
}
export interface MCPBridgeConfig {
    serverName: string;
    serverVersion: string;
    protocolVersion: string;
    capabilities: {
        tools: boolean;
        resources: boolean;
        prompts: boolean;
        logging: boolean;
    };
}
export declare class MCPBridge extends BaseBridge {
    private config;
    private tools;
    private toolHandlers;
    private resources;
    private resourceHandlers;
    private prompts;
    private promptHandlers;
    constructor(config?: Partial<MCPBridgeConfig>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    getServerInfo(): MCPServerInfo;
    /**
     * Register a tool
     */
    registerTool(tool: MCPTool, handler: (args: Record<string, unknown>) => Promise<MCPToolResult>): void;
    /**
     * Unregister a tool
     */
    unregisterTool(name: string): void;
    /**
     * List all tools
     */
    listTools(): MCPTool[];
    /**
     * Call a tool
     */
    callTool(call: MCPToolCall): Promise<MCPToolResult>;
    /**
     * Register a resource
     */
    registerResource(resource: MCPResource, handler: () => Promise<MCPResourceContent>): void;
    /**
     * Unregister a resource
     */
    unregisterResource(uri: string): void;
    /**
     * List all resources
     */
    listResources(): MCPResource[];
    /**
     * Read a resource
     */
    readResource(params: {
        uri: string;
    }): Promise<MCPResourceContent>;
    /**
     * Register a prompt
     */
    registerPrompt(prompt: MCPPrompt, handler: (args: Record<string, unknown>) => Promise<MCPPromptMessage[]>): void;
    /**
     * Unregister a prompt
     */
    unregisterPrompt(name: string): void;
    /**
     * List all prompts
     */
    listPrompts(): MCPPrompt[];
    /**
     * Get a prompt
     */
    getPrompt(params: {
        name: string;
        arguments?: Record<string, unknown>;
    }): Promise<MCPPromptMessage[]>;
    private registerBuiltInTools;
    getStatistics(): {
        connected: boolean;
        tools: number;
        resources: number;
        prompts: number;
        serverInfo: MCPServerInfo;
    };
}
export default MCPBridge;
//# sourceMappingURL=mcp_bridge.d.ts.map