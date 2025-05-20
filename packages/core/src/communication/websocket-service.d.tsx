import { Socket } from 'socket.io';
import { RedisPubSub } from '../redis/redis.pubsub.js';
export declare class AgentWebSocketGateway {
    private readonly pubSub;
    constructor(pubSub: RedisPubSub);
    handleMessage(client: Socket, data: {
        type: string;
        payload: unknown;
    }): Promise<void>;
    private handleTaskRequest;
    private updateAgentStatus;
}
