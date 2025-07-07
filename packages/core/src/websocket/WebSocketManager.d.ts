import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
export interface WebSocketClient {
    id: string;
    socket: Socket;
    connectedAt: Date;
    lastActivity: Date;
    metadata: Record<string, any>;
}
export interface BroadcastMessage {
    type: string;
    data: any;
    target?: string;
    timestamp: Date;
}
export declare class WebSocketManager extends EventEmitter implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private server;
    private readonly clients;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private handleConnection;
    private handleDisconnection;
    private handleError;
    private handleMessage;
    private handlePing;
    private handleJoinRoom;
    private handleLeaveRoom;
    broadcast(message: BroadcastMessage): void;
    broadcastToRoom(room: string, message: BroadcastMessage): void;
    sendToClient(clientId: string, type: string, data: any): boolean;
    disconnectClient(clientId: string, reason?: string): boolean;
    getClient(clientId: string): WebSocketClient | undefined;
    getAllClients(): WebSocketClient[];
    getConnectedClientsCount(): number;
    getClientsInRoom(room: string): WebSocketClient[];
    isClientConnected(clientId: string): boolean;
    updateClientMetadata(clientId: string, metadata: Record<string, any>): boolean;
    private generateClientId;
    healthCheck(): Promise<{
        status: string;
        connectedClients: number;
        uptime: number;
    }>;
    cleanupInactiveClients(timeoutMs?: number): number;
}
//# sourceMappingURL=WebSocketManager.d.ts.map