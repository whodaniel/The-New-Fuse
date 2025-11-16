import * as vscode from 'vscode';

export interface MCPClient {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    sendCommand(command: MCPCommand): Promise<MCPResponse>;
    onResponse(callback: (response: MCPResponse) => void): void;
}

export interface MCPCommand {
    id: string;
    type: MCPCommandType;
    payload: any;
}

export enum MCPCommandType {
    QUERY = 'query',
    ACTION = 'action',
    SYSTEM = 'system'
}

export interface MCPResponse {
    commandId: string;
    success: boolean;
    data?: any;
    error?: string;
    result?: any; // Add result property for MCP2025Client compatibility
}

export interface MCPRequest {
    id: string;
    method: string;
    params?: any;
    jsonrpc?: string;
}

export interface MCPTool {
    name: string;
    description?: string;
    inputSchema?: any;
    annotations?: {
        audience?: string[];
        priority?: number;
    };
}

export interface MCPResource {
    uri: string;
    name?: string;
    description?: string;
    mimeType?: string;
    annotations?: {
        audience?: string[];
        priority?: number;
    };
}

export interface MCPStatus {
    connected: boolean;
    reconnectAttempt: number;
    lastCommand?: MCPCommand;
    lastResponse?: MCPResponse;
    error?: string;
}
