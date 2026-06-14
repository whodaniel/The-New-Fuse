import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CacheService } from '../cache/cache.service';
import { UnifiedMonitoringService } from '../types/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private cache;
    private jwtService;
    private configService;
    private monitoring?;
    server: Server;
    private readonly logger;
    constructor(cache: CacheService, jwtService: JwtService, configService: ConfigService, monitoring?: UnifiedMonitoringService | undefined);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleMessage(client: Socket, payload: any): Promise<void>;
}
//# sourceMappingURL=websocket.gateway.d.ts.map