import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthenticatedSocket, WebSocketConfig } from './types/index.js';
import { RedisWebSocketAdapter } from './adapters/redis-adapter.js';
export declare class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly config;
    private readonly redisAdapter?;
    server: Server;
    private readonly logger;
    private readonly connectionPool;
    private readonly connectionManager;
    private readonly messageQueue;
    private readonly monitoring;
    private readonly compressionMiddleware;
    constructor(config: WebSocketConfig, redisAdapter?: RedisWebSocketAdapter | undefined);
    afterInit(server: Server): Promise<void>;
    handleConnection(client: AuthenticatedSocket): void;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleMessage(client: AuthenticatedSocket, payload: any): Promise<void>;
    broadcast(channel: string, data: any): void;
    sendToUser(userId: string, channel: string, data: any): void;
    sendToRoom(room: string, channel: string, data: any): void;
    queueMessage(channel: string, data: any, priority?: number): string;
    getConnectionStats(): import("./types/index.js").ConnectionPoolStats;
    getMetrics(): Promise<import("./types/index.js").WebSocketMetrics>;
    getHealth(): Promise<import("./types/index.js").HealthStatus>;
    private setupEventListeners;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=websocket.gateway.d.ts.map