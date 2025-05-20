export interface MCPMessage<T = unknown> {
    version: string;
    messageId: string;
    timestamp: number;
    source: {
        id: string;
        type: 'ai_agent' | 'user' | 'system';
        capabilities: string[];
    };
    target: {
        id: string;
        type: 'ai_agent' | 'user' | 'system';
    };
    content: {
        type: MCPMessageType;
        action: string;
        data: T;
        priority: 'low' | 'medium' | 'high';
    };
    metadata: {
        conversationId?: string;
        parentMessageId?: string;
        capabilities?: string[];
        protocol: 'mcp';
        protocolVersion: '1.0.0';
    };
}

export interface MCPCapability {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    returns: Record<string, unknown>;
    execute: (params: unknown) => Promise<any>;
}

export interface MCPAgent {
    id: string;
    capabilities: Map<string, MCPCapability>;
    onMessage: (message: MCPMessage) => Promise<void>;
    sendMessage: (message: MCPMessage) => Promise<void>;
}

/**
 * Core types for Model Context Protocol (MCP) implementation
 */

// JSON-RPC 2.0 Request
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, any> | any[];
}

// JSON-RPC 2.0 Success Response
export interface JsonRpcSuccessResponse {
  jsonrpc: '2.0';
  id: string | number;
  result: any;
}

// JSON-RPC 2.0 Error Response
export interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  id: string | number;
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

// MCP Tool Definition
export interface McpTool {
  id?: string;
  name: string;
  description: string;
  type: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      format?: string;
      required?: boolean;
    }>;
    required: string[];
  };
  parameterSchema?: any; // Zod schema for parameter validation
  handler: (params: Record<string, any>) => Promise<any>;
}

// MCP Resource Definition
export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: () => Promise<string | Buffer>;
}

// MCP Prompt Definition
export interface McpPrompt {
  name: string;
  description: string;
  template: string;
  parameters?: Record<string, {
    type: string;
    description: string;
  }>;
  handler?: (params: Record<string, any>) => Promise<string>;
}

// MCP Server Configuration
export interface McpServerConfig {
  id: string;
  name: string;
  description?: string;
  version: string;
  transport: 'stdio' | 'sse';
  port?: number; // Required for SSE
  url?: string; // Alternative to port for SSE
  authRequired: boolean;
  authKey?: string;
}

// MCP Client Configuration
export interface McpClientConfig {
  serverUrl: string;
  transport: 'stdio' | 'sse';
  timeout?: number;
  authKey?: string;
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
  };
}