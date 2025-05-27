import * as vscode from 'vscode';

// Enhanced AgentMessage interface combining old and new features
export interface AgentMessage {
    id: string;
    type: AgentMessageType; // Change type to AgentMessageType
    source: string; // Source of the message (sender)
    recipient?: string; // Optional recipient for direct messaging
    content?: string; // Optional content for simple messages
    payload?: any; // Flexible payload for complex data
    metadata?: Record<string, any>;
    timestamp: number;
    action?: string; // Optional action identifier
    processed?: boolean; // Track if message has been processed
}

// Enum for common message types
export enum AgentMessageType {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
    ERROR = 'error',
    STATUS_UPDATE = 'status_update',
    COMMAND = 'command',
    RESPONSE = 'response',
    TOOL_CODE = 'tool_code', // Add new message type
    TOOL_OUTPUT = 'tool_output' // Add new message type
}

// Enhanced agent registration interface
export interface AgentRegistration {
    id: string;
    name: string;
    version: string;
    capabilities: string[];
    active: boolean;
    lastSeen: number;
    apiVersion: string;
    provider?: string;
    status?: 'online' | 'offline' | 'busy';
}

// Enhanced communication manager interface
export interface AgentCommunicationManager {
    // Core messaging
    sendMessage(message: AgentMessage): Promise<void>;
    broadcastMessage(type: string, payload: any, action?: string): Promise<void>;
    onMessage(callback: (message: AgentMessage) => void): void;
    
    // Connection management
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    
    // Agent management
    registerAgent(registration: AgentRegistration): Promise<string>;
    unregisterAgent(agentId: string): Promise<void>;
    getRegisteredAgents(): AgentRegistration[];
    
    // Subscription management
    subscribe(handler: (message: AgentMessage) => Promise<void>, agentId?: string): () => void;
}

export interface AgentConnection {
    id: string;
    type: string;
    status: 'connected' | 'disconnected' | 'error';
    lastMessage?: AgentMessage;
    error?: string;
    agent?: AgentRegistration;
}

// WebView message interface for UI communication
export interface WebViewMessage {
    type: string;
    text?: string;
    payload?: any;
}

// AI Message interface for chat systems
export interface AIMessage {
    type: AgentMessageType;
    text: string;
    sender?: string;
    timestamp: number;
}
