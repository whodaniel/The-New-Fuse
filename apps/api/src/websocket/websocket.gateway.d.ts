import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CacheService } from '../cache/cache.service';
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private cache;
    server: Server;
    private readonly logger;
    constructor(cache: CacheService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleMessage(client: Socket, payload: any): Promise<void>;
}
//# sourceMappingURL=websocket.gateway.d.ts.map