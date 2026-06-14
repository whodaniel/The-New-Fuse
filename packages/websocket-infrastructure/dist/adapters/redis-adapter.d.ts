import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { WebSocketAdapter, WebSocketMetrics } from '../types/index.js';
import { Server } from 'socket.io';
interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
}
export declare class RedisWebSocketAdapter implements WebSocketAdapter, OnModuleInit, OnModuleDestroy {
    private readonly redisService;
    private readonly logger;
    private pubClient?;
    private subClient?;
    private io?;
    private readonly config;
    private metrics;
    private metricsInterval?;
    constructor(config: RedisConfig, redisService: UnifiedRedisService);
    initialize(): Promise<void>;
    private waitForConnection;
    setupSocketIO(io: Server): void;
    broadcast(channel: string, data: any): void;
    sendToUser(userId: string, data: any): void;
    disconnect(socketId: string, reason?: string): void;
    publish(channel: string, message: any): Promise<void>;
    subscribe(channel: string, handler: (message: any) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    get(key: string): Promise<any | null>;
    delete(key: string): Promise<void>;
    getMetrics(): WebSocketMetrics;
    private startMetricsCollection;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
export {};
//# sourceMappingURL=redis-adapter.d.ts.map