export interface MCPContext {
    current: Record<string, any>;
    sync(): Promise<void>;
    update(context: Partial<MCPContext>): Promise<void>;
}

import { ProtocolVersion } from '../config/A2AConfig.js';

// A2A Message V1 (Flat Structure)
export interface A2AMessageV1 {
    id: string;
    type: string;
    timestamp: number;
    sender: string;
    recipient?: string;
    payload: any;
    metadata: {
        priority: 'low' | 'medium' | 'high';
        timeout?: number;
        retryCount?: number;
        protocol_version: '1.0';
    };
}

// A2A Message V2 (Header/Body Structure)
export interface A2AMessageV2 {
    header: {
        id: string;
        type: string;
        version: string;
        priority: 'low' | 'medium' | 'high';
        source: string;
        target?: string;
    };
    body: {
        content: any;
        metadata: {
            sent_at: number;
            timeout?: number;
            retries?: number;
            trace_id?: string;
        };
    };
}

// Union type for both message versions
export type A2AMessage = A2AMessageV1 | A2AMessageV2;

// Message type constants
export enum A2AMessageType {
    TASK_REQUEST = 'TASK_REQUEST',
    QUERY = 'QUERY',
    RESPONSE = 'RESPONSE',
    NOTIFICATION = 'NOTIFICATION',
    ERROR = 'ERROR',
    HEARTBEAT = 'HEARTBEAT',
    CAPABILITY_DISCOVERY = 'CAPABILITY_DISCOVERY',
    WORKFLOW_STEP = 'WORKFLOW_STEP'
}

// Communication pattern types
export type CommunicationPattern = 'direct' | 'broadcast' | 'request-response';

// Legacy A2A Message interface for backward compatibility
export interface LegacyA2AMessage {
    type: string;
    payload: Record<string, any>;
    metadata: {
        timestamp: number;
        sender: string;
        protocol_version: string;
    };
}

export interface PythonBridgeConfig {
    pythonPath: string;
    timeout?: number;
}