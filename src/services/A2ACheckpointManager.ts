import { Injectable } from '@nestjs/common';
import { A2AStateSynchronizer } from './A2AStateSynchronizer.js';
import { A2ALogger } from './A2ALogger.js';
import { RedisClient } from './RedisClient.js';

@Injectable()
export class A2ACheckpointManager {
    private readonly checkpointPrefix = 'a2a:checkpoint:';
    private readonly recoveryPrefix = 'a2a:recovery:';

    constructor(
        private stateSynchronizer: A2AStateSynchronizer,
        private redis: RedisClient,
        private logger: A2ALogger
    ) {}

    async createCheckpoint(workflowId: string, state: any): Promise<string> {
        const checkpointId = `${workflowId}:${Date.now()}`;
        const key = this.getCheckpointKey(checkpointId);

        await this.redis.set(key, JSON.stringify({
            timestamp: Date.now(),
            state,
            metadata: {
                workflowId,
                version: state.version || '1.0.0'
            }
        }));

        await this.updateRecoveryIndex(workflowId, checkpointId);
        return checkpointId;
    }

    async restoreFromCheckpoint(checkpointId: string): Promise<any> {
        const checkpoint = await this.getCheckpoint(checkpointId);
        if (!checkpoint) {
            throw new Error(`Checkpoint ${checkpointId} not found`);
        }

        await this.stateSynchronizer.updateState(
            checkpoint.metadata.workflowId,
            checkpoint.state
        );

        return checkpoint.state;
    }

    async listCheckpoints(workflowId: string): Promise<string[]> {
        const pattern = this.getCheckpointKey(`${workflowId}:*`);
        return await this.redis.keys(pattern);
    }

    async cleanupOldCheckpoints(workflowId: string, maxAge: number): Promise<void> {
        const checkpoints = await this.listCheckpoints(workflowId);
        const now = Date.now();

        for (const checkpoint of checkpoints) {
            const data = await this.getCheckpoint(checkpoint);
            if (now - data.timestamp > maxAge) {
                await this.redis.del(checkpoint);
            }
        }
    }

    private async getCheckpoint(checkpointId: string): Promise<any> {
        const key = this.getCheckpointKey(checkpointId);
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    private async updateRecoveryIndex(workflowId: string, checkpointId: string): Promise<void> {
        const key = this.getRecoveryKey(workflowId);
        await this.redis.zadd(key, Date.now(), checkpointId);
    }

    private getCheckpointKey(checkpointId: string): string {
        return `${this.checkpointPrefix}${checkpointId}`;
    }

    private getRecoveryKey(workflowId: string): string {
        return `${this.recoveryPrefix}${workflowId}`;
    }
}