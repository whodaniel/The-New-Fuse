import { LLMResult, LLMResponse } from './llm.js';
import * as vscode from 'vscode';

/**
 * Type definitions for Model Context Protocol (MCP)
 *
 * Based on the protocol used by Copilot and other AI tools for tool execution
 */

// Re-export LLMResponse to fix import issues
export { LLMResponse };

/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
  version: string;
  name?: string;
  description?: string;
  tools: MCPTool[];
  capabilities?: string[];
  [key: string]: any;
}

/**
 * MCP Server representation
 */
export interface MCPServer {
  id: string;
  name: string;
  url: string;
  status?: 'online' | 'offline' | 'error';
  isBuiltIn?: boolean;
  config?: MCPServerConfig;
  description?: string; // Added description
  capabilities?: string[]; // Added capabilities
}

/**
 * MCP Tool definition
 */
export interface MCPTool {
  id?: string; // Added optional id
  name: string;
  description?: string;
  parameters?: MCPToolParameter[];
  returns?: MCPToolReturn;
  execute?(params: Record<string, any>): Promise<any>;
}

/**
 * MCP Tool parameter
 */
export interface MCPToolParameter {
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: any;
  enum?: any[];
  items?: {
    type: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * MCP Tool return type
 */
export interface MCPToolReturn {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'void';
  description?: string;
  schema?: any;
}

/**
 * MCP Tool execution request
 */
export interface MCPToolExecutionRequest {
  id: string;
  type: 'execute_tool';
  tool: string;
  params: Record<string, any>;
}

/**
 * MCP Tool execution response
 */
export interface MCPToolExecutionResponse {
  id: string;
  type: 'execute_tool_response';
  status: 'success' | 'error';
  result?: any;
  error?: {
    code: string;
    message: string;
    [key: string]: any;
  };
}

/**
 * MCP Get Config request
 */
export interface MCPGetConfigRequest {
  id: string;
  type: 'get_config';
}

/**
 * MCP Get Config response
 */
export interface MCPGetConfigResponse {
  id: string;
  type: 'get_config_response';
  status: 'success' | 'error';
  config?: MCPServerConfig;
  error?: {
    code: string;
    message: string;
    [key: string]: any;
  };
}

/**
 * MCP Ping request
 */
export interface MCPPingRequest {
  id: string;
  type: 'ping';
  timestamp: string;
}

/**
 * MCP Pong response
 */
export interface MCPPongResponse {
  id: string;
  type: 'pong';
  timestamp: string;
}

/**
 * MCP Config Update notification
 */
export interface MCPConfigUpdate {
  type: 'config_update';
  config: Partial<MCPServerConfig>;
}

/**
 * MCP Stream Start notification
 */
export interface MCPStreamStart {
  id: string;
  type: 'stream_start';
  streamId: string;
}

/**
 * MCP Stream Data notification
 */
export interface MCPStreamData {
  type: 'stream_data';
  streamId: string;
  data: any;
}

/**
 * MCP Stream End notification
 */
export interface MCPStreamEnd {
  type: 'stream_end';
  streamId: string;
  error?: {
    code: string;
    message: string;
    [key: string]: any;
  };
}

/**
 * Union type for all MCP messages
 */
export type MCPMessage =
  | MCPToolExecutionRequest
  | MCPToolExecutionResponse
  | MCPGetConfigRequest
  | MCPGetConfigResponse
  | MCPPingRequest
  | MCPPongResponse
  | MCPConfigUpdate
  | MCPStreamStart
  | MCPStreamData
  | MCPStreamEnd;

// Type for messages that have an ID (requests and responses)
export type MCPMessageWithId = MCPMessage & { id: string };

export interface MCPMarketplaceService {
    servers: MCPServer[];
    tools: MCPTool[];
    initialize(): Promise<void>;
    registerServer(server: MCPServer): Promise<void>;
    unregisterServer(serverId: string): Promise<void>;
    updateServerConfig(serverId: string, config: MCPServerConfig): Promise<void>;
    getServer(serverId: string): MCPServer | undefined;
    getServers(): MCPServer[];
    getTools(): MCPTool[];
    findToolById(toolId: string): MCPTool | undefined;
}

export interface MCPRequest {
    type: string;
    intent: string;
    payload?: any;
    metadata?: Record<string, any>;
    timestamp?: string;
}

export interface MCPResponse {
    type: string;
    status: 'success' | 'error';
    payload?: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp?: string;
}

export interface LanguageModelAccessInformation {
    // Adding missing properties based on verification-commands.ts errors
    authenticated?: boolean;
    hasAccess?: boolean;
    subscriptionStatus?: string | { isSubscribed?: boolean }; // Allow string or object structure
    capabilities?: string[];
}

export interface TheFuseAPI {
    sendMessage(message: string): Promise<string>;
    getAvailableModels(): Promise<string[]>;
    getCurrentModel(): Promise<string>;
    generateText?(prompt: string): Promise<string>;
    languageModelAccessInformation?: LanguageModelAccessInformation;
}

export interface MCPManager {
    initialize(): Promise<void>;
    registerServer(server: MCPServer): Promise<void>;
    unregisterServer(serverId: string): Promise<void>;
    executeTool(serverId: string, toolName: string, params: Record<string, any>): Promise<any>;
    updateServerConfig(serverId: string, config: MCPServerConfig): Promise<void>;
    getAllServers(): MCPServer[];
    getServer(serverId: string): MCPServer | undefined;
    getActiveServer(): MCPServer | undefined;
    setActiveServer(serverId: string | undefined): boolean;
    connectToServer(serverId: string): Promise<boolean>;
    disconnectFromServer(serverId: string): void;
    refreshServerConfig(serverId: string): Promise<MCPServerConfig | undefined>;
    getTools(serverId?: string): Promise<MCPTool[]>;
    registerTool(tool: MCPTool): void;
    getRegisteredTools(): MCPTool[];
    dispose(): void;

    // Event emitters
    readonly onServerAdded: vscode.Event<MCPServer>;
    readonly onServerRemoved: vscode.Event<string>; // serverId
    readonly onServerUpdated: vscode.Event<MCPServer>;
    readonly onActiveServerChanged: vscode.Event<MCPServer | undefined>;

    // Optional methods
    onToolsUpdated?(): Promise<void>;
}

/**
 * MCP Monitor interface
 */
export interface MCPMonitor {
  recordEvent(eventName: string, eventData?: Record<string, any>): void;
  recordError(error: Error, context?: Record<string, any>): void;
  getStats(): Promise<Record<string, any>>;
  getAlerts(count?: number): MCPAlert[];
  trackMessage?(type: string, size: number, duration: number): void;
  trackConnection?(connected: boolean): void;
  trackError?(error: Error | string, context?: Record<string, any>): void;
}

/**
 * MCP Alert interface
 */
export interface MCPAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  details?: any;
}
