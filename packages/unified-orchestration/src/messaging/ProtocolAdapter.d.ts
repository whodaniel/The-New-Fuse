/**
 * Protocol Adapters for Unified Message Routing
 *
 * This module provides adapters for different communication protocols,
 * enabling seamless message routing across WebSocket, Redis, HTTP, and file-based systems.
 */
import { EventEmitter } from 'eventemitter3';
import { MessageEnvelope, MessageProtocol } from './UnifiedMessageTypes';
export interface ProtocolAdapter {
    protocol: MessageProtocol;
    send(envelope: MessageEnvelope, target?: string): Promise<void>;
    receive(): AsyncIterable<MessageEnvelope>;
    close(): Promise<void>;
    isConnected(): boolean;
}
export interface ProtocolAdapterEvents {
    'message:received': (envelope: MessageEnvelope) => void;
    'connection:established': (protocol: MessageProtocol) => void;
    'connection:lost': (protocol: MessageProtocol, error?: Error) => void;
    'error': (error: Error) => void;
}
/**
 * WebSocket Protocol Adapter
 */
export declare class WebSocketAdapter extends EventEmitter<ProtocolAdapterEvents> implements ProtocolAdapter {
    private config;
    readonly protocol: MessageProtocol;
    private connections;
    private server?;
    private _isListening;
    constructor(config: {
        port?: number;
        host?: string;
        endpoints?: Record<string, string>;
    });
    initialize(): Promise<void>;
    send(envelope: MessageEnvelope, target?: string): Promise<void>;
    receive(): AsyncIterable<MessageEnvelope>;
    close(): Promise<void>;
    isConnected(): boolean;
    private connectToEndpoint;
    private extractClientId;
}
/**
 * Redis Protocol Adapter
 */
export declare class RedisAdapter extends EventEmitter<ProtocolAdapterEvents> implements ProtocolAdapter {
    private config;
    readonly protocol: MessageProtocol;
    private publisher;
    private subscriber;
    private _isConnected;
    constructor(config: {
        host: string;
        port: number;
        password?: string;
        db?: number;
        channels?: string[];
    });
    initialize(): Promise<void>;
    send(envelope: MessageEnvelope, target?: string): Promise<void>;
    receive(): AsyncIterable<MessageEnvelope>;
    close(): Promise<void>;
    isConnected(): boolean;
    subscribe(channels: string[]): Promise<void>;
    unsubscribe(channels: string[]): Promise<void>;
}
/**
 * HTTP Protocol Adapter
 */
export declare class HTTPAdapter extends EventEmitter<ProtocolAdapterEvents> implements ProtocolAdapter {
    private config;
    readonly protocol: MessageProtocol;
    private endpoints;
    constructor(config: {
        endpoints?: Record<string, string>;
        timeout?: number;
    });
    initialize(): Promise<void>;
    send(envelope: MessageEnvelope, target?: string): Promise<void>;
}
//# sourceMappingURL=ProtocolAdapter.d.ts.map