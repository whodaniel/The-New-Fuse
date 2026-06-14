import { AuthenticatedSocket, ConnectionMetadata, ConnectionPoolStats } from '../types/index.js';
import { EventEmitter } from 'events';
export declare class ConnectionPool extends EventEmitter {
    private readonly logger;
    private connections;
    private userConnections;
    private metadata;
    private readonly maxConnections;
    private readonly idleTimeout;
    private cleanupInterval?;
    constructor(maxConnections?: number, idleTimeout?: number);
    add(socket: AuthenticatedSocket): boolean;
    remove(socketId: string): boolean;
    get(socketId: string): AuthenticatedSocket | undefined;
    getUserConnections(userId: string): AuthenticatedSocket[];
    getMetadata(socketId: string): ConnectionMetadata | undefined;
    updateActivity(socketId: string): void;
    getStats(): ConnectionPoolStats;
    getAllConnections(): AuthenticatedSocket[];
    size(): number;
    hasCapacity(): boolean;
    clear(): void;
    private startCleanupTask;
    private cleanupIdleConnections;
    destroy(): void;
}
//# sourceMappingURL=connection-pool.d.ts.map