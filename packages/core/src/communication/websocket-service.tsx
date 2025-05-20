import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RedisPubSub } from '../redis/redis.pubsub.js';

interface TaskPayload {
  id: string;
  type: string;
  data: unknown;
}

@Injectable()
@WebSocketGateway()
export class AgentWebSocketGateway {
    constructor(private readonly pubSub: RedisPubSub) {}

    @SubscribeMessage('agent:message')
    async handleMessage(client: Socket, data: { type: string; payload: unknown }): Promise<void> {
        const { type, payload } = data;
        
        switch(type) {
            case 'TASK_REQUEST':
                await this.handleTaskRequest(client, payload as TaskPayload);
                break;
            case 'STATUS_UPDATE':
                await this.updateAgentStatus(client, payload);
                break;
            default:
                throw new Error(`Unsupported message type: ${type}`);
        }
    }

    private async handleTaskRequest(client: Socket, payload: TaskPayload): Promise<void> {
        const taskId = await this.pubSub.publish('tasks', payload);
        client.emit('task:created', { taskId });
    }

    private async updateAgentStatus(client: Socket, payload: unknown): Promise<void> {
        await this.pubSub.publish('agent:status', {
            agentId: client.id,
            status: payload
        });
    }
}
