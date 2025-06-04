import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../services/redis.service.js';
export declare class AgentCommunicationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly redisService;
    server: Server;
    private logger;
    private subscriber;
    constructor(redisService: RedisService);
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    private setupRedisSubscriptions;
}
