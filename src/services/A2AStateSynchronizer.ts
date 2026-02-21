import { Injectable, OnModuleInit } from '@nestjs/common';
import { A2AMessageQueue } from './A2AMessageQueue.js';
import { A2ALogger } from './A2ALogger.js';
import { RedisClient } from './RedisClient.js';

@Injectable()
export class A2AStateSynchronizer implements OnModuleInit {
    private readonly statePrefix = 'a2a:state:';
    private readonly lockPrefix = 'a2a:lock:';
    private readonly lockTTL = 30; // seconds

    constructor(
        private messageQueue: A2AMessageQueue,
        private redis: RedisClient,
        private logger: A2ALogger
    ) {}

    async onModuleInit() {
        this.subscribeToStateChanges();
    }

    private subscribeToStateChanges() {
        this.messageQueue.subscribeToPendingMessages('state_sync', async (message) => {
            if (message.type === 'STATE_UPDATE') {
                await this.handleStateUpdate(message);
            }
        });
    }

    async updateState(agentId: string, state: any): Promise<void> {
        const lockKey = this.getLockKey(agentId);
        const stateKey = this.getStateKey(agentId);

        try {
            await this.acquireLock(lockKey);
            await this.redis.set(stateKey, JSON.stringify(state));
            await this.broadcastStateUpdate(agentId, state);
        } finally {
            await this.releaseLock(lockKey);
        }
    }

    async getState(agentId: string): Promise<any> {
        const stateKey = this.getStateKey(agentId);
        const state = await this.redis.get(stateKey);
        return state ? JSON.parse(state) : null;
    }

    private async handleStateUpdate(message: any) {
        const { agentId, state } = message.payload;
        await this.updateState(agentId, state);
    }

    private async broadcastStateUpdate(agentId: string, state: any) {
        await this.messageQueue.enqueueMessage('state_sync', {
            type: 'STATE_UPDATE',
            payload: { agentId, state },
            metadata: {
                timestamp: Date.now(),
                sender: 'state_sync'
            }
        });
    }

    private async acquireLock(lockKey: string): Promise<void> {
        const acquired = await this.redis.set(
            lockKey,
            'locked',
            'NX',
            'EX',
            this.lockTTL
        );

        if (!acquired) {
            throw new Error('Failed to acquire state lock');
        }
    }

    private async releaseLock(lockKey: string): Promise<void> {
        await this.redis.del(lockKey);
    }

    private getStateKey(agentId: string): string {
        return `${this.statePrefix}${agentId}`;
    }

    private getLockKey(agentId: string): string {
        return `${this.lockPrefix}${agentId}`;
    }
}