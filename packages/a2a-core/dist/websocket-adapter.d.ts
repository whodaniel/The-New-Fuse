import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { EventEmitter } from 'events';
import { A2AMessage, AgentHeartbeat, AgentStatus, A2AConfig } from './types.js';
import { A2ARedisAdapter } from './redis-adapter.js';
export declare class A2AWebSocketAdapter extends EventEmitter implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly config;
    private readonly redisAdapter;
    server: Server;
    private readonly logger;
    private readonly connectedAgents;
    private readonly socketToAgent;
    constructor(config: A2AConfig, redisAdapter: A2ARedisAdapter);
    private setupRedisSubscriptions;
    handleConnection(client: any): Promise<void>;
    handleDisconnect(client: any): Promise<void>;
    handleAuthenticate(client: any, data: {
        agentId: string;
        token?: string;
        signature?: string;
    }): Promise<void>;
    handleSendMessage(client: any, data: A2AMessage): Promise<void>;
    handleSendRequest(client: any, data: {
        toAgent: string;
        payload: any;
        timeout?: number;
        conversationId?: string;
    }): Promise<void>;
    handleSendBroadcast(client: any, data: {
        payload: any;
        channel?: string;
        topic?: string;
    }): Promise<void>;
    handleJoinConversation(client: any, data: {
        conversationId: string;
    }): Promise<void>;
    handleLeaveConversation(client: any, data: {
        conversationId: string;
    }): Promise<void>;
    handleDiscoverAgents(client: any, data: {
        type?: string;
        capabilities?: string[];
        status?: AgentStatus;
    }): Promise<void>;
    handleSendHeartbeat(client: any, data: Omit<AgentHeartbeat, 'agentId' | 'timestamp'>): Promise<void>;
    private forwardMessageToWebSocket;
    private validateAgent;
    getConnectedAgents(): string[];
    isAgentConnected(agentId: string): boolean;
    sendDirectMessage(message: A2AMessage): Promise<void>;
}
