/**
 * Redis Transport for The New Fuse Relay System
 *
 * Provides pub/sub messaging and distributed coordination
 * Based on existing Redis infrastructure in src/redis/
 */
import { EventEmitter } from 'events';
import { Transport, RelayMessage } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
export interface RedisTransportConfig {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    channels: {
        agentCommunication: string;
        workflowExecution: string;
        systemEvents: string;
        heartbeat: string;
    };
    logger: Logger;
}
export declare class RedisTransport extends EventEmitter implements Transport {
    readonly name = "redis";
    private config;
    private publisher;
    private subscriber;
    private logger;
    private _isConnected;
    private messageHandlers;
    private heartbeatInterval?;
    constructor(config: RedisTransportConfig);
    private setupEventHandlers;
    private setupChannelSubscriptions;
    private handleRedisMessage;
    start(): Promise<boolean>;
    stop(): Promise<void>;
    send(message: RelayMessage): Promise<boolean>;
    private getChannelForMessage;
    onMessage(handler: (message: RelayMessage) => void): void;
    isConnected(): boolean;
    private startHeartbeat;
    setDistributedLock(key: string, value: string, ttlMs: number): Promise<boolean>;
    releaseDistributedLock(key: string, value: string): Promise<boolean>;
    storeAgentState(agentId: string, state: any, ttlMs?: number): Promise<boolean>;
    getAgentState(agentId: string): Promise<any | null>;
    addToWorkflowQueue(workflowId: string, task: any): Promise<boolean>;
    getFromWorkflowQueue(workflowId: string): Promise<any | null>;
}
//# sourceMappingURL=RedisTransport.d.ts.map