import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventEmitter } from 'events';
import { A2AMessage, AgentHeartbeat, AgentStatus, A2AConfig } from './types';
import { A2ARedisAdapter } from './redis-adapter';
interface A2ASocket extends Socket {
    agentId?: string;
    isAuthenticated?: boolean;
}
export declare class A2AWebSocketAdapter extends EventEmitter implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly config;
    private readonly redisAdapter;
    server: Server;
    private readonly logger;
    private readonly connectedAgents;
    private readonly socketToAgent;
    constructor(config: A2AConfig, redisAdapter: A2ARedisAdapter);
    private setupRedisSubscriptions;
    handleConnection(client: A2ASocket): Promise<void>;
    handleDisconnect(client: A2ASocket): Promise<void>;
    handleAuthenticate(client: A2ASocket, data: {
        agentId: string;
        token?: string;
        signature?: string;
    }): Promise<void>;
    handleSendMessage(client: A2ASocket, data: A2AMessage): Promise<void>;
    handleSendRequest(client: A2ASocket, data: {
        toAgent: string;
        payload: any;
        timeout?: number;
        conversationId?: string;
    }): Promise<void>;
    handleSendBroadcast(client: A2ASocket, data: {
        payload: any;
        channel?: string;
        topic?: string;
    }): Promise<void>;
    handleJoinConversation(client: A2ASocket, data: {
        conversationId: string;
    }): Promise<void>;
    handleLeaveConversation(client: A2ASocket, data: {
        conversationId: string;
    }): Promise<void>;
    handleDiscoverAgents(client: A2ASocket, data: {
        type?: string;
        capabilities?: string[];
        status?: AgentStatus;
    }): Promise<void>;
    handleSendHeartbeat(client: A2ASocket, data: Omit<AgentHeartbeat, 'agentId' | 'timestamp'>): Promise<void>;
    private forwardMessageToWebSocket;
    private validateAgent;
    getConnectedAgents(): string[];
    isAgentConnected(agentId: string): boolean;
    sendDirectMessage(message: A2AMessage): Promise<void>;
}
export {};
//# sourceMappingURL=websocket-adapter.d.ts.map