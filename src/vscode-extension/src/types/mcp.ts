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
}

export interface MCPStatus {
    connected: boolean;
    reconnectAttempt: number;
    lastCommand?: MCPCommand;
    lastResponse?: MCPResponse;
    error?: string;
}
