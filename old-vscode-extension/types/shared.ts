/**
 * Shared type definitions for The New Fuse extension components
 */

export enum MessageType {
    INITIATION = 'initiation',
    MESSAGE = 'message',
    CODE_INPUT = 'code_input',
    CODE_OUTPUT = 'code_output',
    AI_REQUEST = 'ai_request',
    AI_RESPONSE = 'ai_response',
    CAPABILITY_QUERY = 'capability_query',
    CAPABILITY_RESPONSE = 'capability_response',
    MCP_REQUEST = 'mcp_request',
    MCP_RESPONSE = 'mcp_response',
    HEARTBEAT = 'heartbeat'
}

export enum ConnectionStatus {
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    ERROR = 'ERROR'
}

export interface AIMessage {
    id: string;
    type: MessageType;
    conversationId: string;
    sourceAgent: string;
    targetAgent: string;
    content?: any;
    text?: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface ConversationState {
    id: string;
    sourceAgent: string;
    targetAgent: string;
    messages: AIMessage[];
    startTime: number;
    lastMessageTime?: number;
    status: 'active' | 'idle' | 'ended';
    metadata?: Record<string, any>;
}

export interface AIAgent {
    id: string;
    name: string;
    capabilities: string[];
    version: string;
    provider?: string;
    apiVersion: string;
    lastSeen: number;
    active: boolean;
    metadata?: Record<string, any>;
}

export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    version?: string;
    parameters?: Record<string, any>;
}

export interface ChromeMessage {
    command: string;
    data: any;
}

export interface FileProtocolMessage {
    id: string;
    sender: string;
    recipient: string;
    action: string;
    payload: any;
    timestamp: number;
    signature?: string;
    status?: 'pending' | 'processed' | 'error';
}

export interface MCPRequest {
    type: string;
    action: string;
    parameters: Record<string, any>;
    context?: Record<string, any>;
    metadata?: Record<string, any>;
}

export interface MCPResponse {
    type: string;
    status: 'success' | 'error';
    result: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metadata?: Record<string, any>;
}

export interface WebviewMessage {
    command: string;
    message?: {
        conversationId: string;
        content: string;
    };
    agentId?: string;
    conversationId?: string;
}

export interface AgentStatusChange {
    agentId: string;
    status: 'active' | 'inactive' | 'error';
    timestamp: number;
    reason?: string;
}

export interface ConnectionStatusUpdate {
    id: string;
    status: ConnectionStatus;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface ConversationUpdate {
    conversationId: string;
    type: 'created' | 'updated' | 'ended';
    changes?: Partial<ConversationState>;
    timestamp: number;
}

export type MessageHandler = (message: any) => Promise<void>;
export type StatusChangeHandler = (status: ConnectionStatus) => void;
export type ErrorHandler = (error: Error) => void;