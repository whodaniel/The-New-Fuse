import { AuthenticatedSocket } from '../types/index.js';
import { ConnectionPool } from './connection-pool.js';
export declare class ConnectionManager {
    private readonly logger;
    private readonly connectionPool;
    private heartbeatInterval?;
    private readonly heartbeatIntervalMs;
    private readonly heartbeatTimeoutMs;
    constructor(connectionPool: ConnectionPool, heartbeatIntervalMs?: number, heartbeatTimeoutMs?: number);
    handleConnection(socket: AuthenticatedSocket): void;
    handleDisconnection(socket: AuthenticatedSocket, reason: string): void;
    private setupHeartbeat;
    private setupEventHandlers;
    broadcast(event: string, data: any): void;
    sendToUser(userId: string, event: string, data: any): void;
    sendToRoom(roomName: string, event: string, data: any): void;
    disconnect(socketId: string, reason?: string): void;
    disconnectUser(userId: string, reason?: string): void;
    getStats(): import("../types/index.js").ConnectionPoolStats;
    destroy(): void;
}
//# sourceMappingURL=connection-manager.d.ts.map