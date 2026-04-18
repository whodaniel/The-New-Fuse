import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service.js';
import { AgentMessage } from '@the-new-fuse/types';

@Injectable()
export class AgentCommunicationService {
    constructor(private readonly redis: RedisService) {}

    async broadcastMessage(message: AgentMessage) {
        await this.redis.publish('agent:broadcast', JSON.stringify(message));
    }

    async createDirectChannel(agentId: string, callback?: (message: string) => void) {
        const channelId = `agent:direct:${agentId}`;
        if (callback) {
            await this.redis.subscribe(channelId, callback);
        }
        return channelId;
    }

    async sendDirectMessage(targetAgent: string, message: AgentMessage) {
        const channel = `agent:direct:${targetAgent}`;
        await this.redis.publish(channel, JSON.stringify(message));
    }
}