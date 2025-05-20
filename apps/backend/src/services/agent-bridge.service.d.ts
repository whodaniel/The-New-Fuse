import { Server, Socket } from 'socket.io';
import { RedisService } from './redis.service.js';
export declare class AgentBridgeService {
    private readonly redisService;
    server: Server;
    private readonly logger;
    constructor(redisService: RedisService);
    private setupRedisSubscriptions;
    private handleRedisMessage;
    handleJoinChannel(client: Socket, channel: string): void;
    handleLeaveChannel(client: Socket, channel: string): void;
    handleAgentMessage(client: Socket, payload: any): Promise<void>;
}
