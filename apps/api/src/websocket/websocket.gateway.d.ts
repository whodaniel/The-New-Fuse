import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CacheService } from '../cache/cache.service.js';
import { UnifiedMonitoringService } from '@the-new-fuse/core';
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private cache;
    private monitoring;
    server: Server;
    constructor(cache: CacheService, monitoring: UnifiedMonitoringService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleMessage(client: Socket, payload: any): Promise<void>;
}
