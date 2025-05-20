import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { A2AMessage } from '../protocols/types.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class A2AMessageQueue implements OnModuleInit {
    private client: RedisClientType;
    private readonly messageExpiry = 3600; // 1 hour

    constructor(private configService: ConfigService) {
        this.client = createClient({
            url: `redis://${this.configService.get('REDIS_HOST')}:${this.configService.get('REDIS_PORT')}`
        });
    }

    async onModuleInit() {
        await this.client.connect();
    }

    async enqueueMessage(targetAgent: string, message: A2AMessage): Promise<void> {
        const queueKey = `a2a:queue:${targetAgent}`;
        await this.client.lPush(queueKey, JSON.stringify(message));
        await this.client.expire(queueKey, this.messageExpiry);
    }

    async dequeueMessage(agentId: string): Promise<A2AMessage | null> {
        const queueKey = `a2a:queue:${agentId}`;
        const message = await this.client.rPop(queueKey);
        return message ? JSON.parse(message) : null;
    }

    async subscribeToPendingMessages(agentId: string, callback: (message: A2AMessage) => Promise<void>): Promise<void> {
        const queueKey = `a2a:queue:${agentId}`;
        while (true) {
            const message = await this.dequeueMessage(agentId);
            if (message) {
                await callback(message);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}