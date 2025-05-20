import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service.js';

@Injectable()
export class AgentCommunicationService {
    constructor(private readonly redis: RedisService) {}

    async broadcastMessage(message: AgentMessage) {
        await this.redis.publish('agent:broadcast', message);
    }

    async createDirectChannel(agentId: string) {
        const channelId = `agent:direct:${agentId}`;
        await this.redis.subscribe(channelId);
        return channelId;
    }

    async sendDirectMessage(targetAgent: string, message: AgentMessage) {
        const channel = `agent:direct:${targetAgent}`;
        await this.redis.publish(channel, message);
    }
}