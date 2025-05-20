import { Injectable } from '@nestjs/common';
import { A2ALogger } from './A2ALogger.js';
import { RedisClient } from './RedisClient.js';

@Injectable()
export class A2ATransactionManager {
    private readonly transactionKey = 'a2a:transaction:';
    private readonly lockTimeout = 30000; // 30 seconds

    constructor(
        private redis: RedisClient,
        private logger: A2ALogger
    ) {}

    async beginTransaction(workflowId: string): Promise<string> {
        const transactionId = `${workflowId}:${Date.now()}`;
        const key = this.getTransactionKey(transactionId);
        
        await this.redis.multi()
            .hset(key, 'status', 'active')
            .hset(key, 'startTime', Date.now().toString())
            .hset(key, 'operations', '[]')
            .expire(key, this.lockTimeout)
            .exec();

        return transactionId;
    }

    async addOperation(transactionId: string, operation: any): Promise<void> {
        const key = this.getTransactionKey(transactionId);
        const operations = await this.getOperations(transactionId);
        
        operations.push({
            ...operation,
            timestamp: Date.now(),
            status: 'pending'
        });

        await this.redis.hset(key, 'operations', JSON.stringify(operations));
    }

    async commit(transactionId: string): Promise<void> {
        const key = this.getTransactionKey(transactionId);
        const operations = await this.getOperations(transactionId);

        try {
            for (const operation of operations) {
                if (operation.status === 'pending') {
                    await this.executeOperation(operation);
                    operation.status = 'completed';
                }
            }

            await this.redis.hset(key, 'status', 'committed');
            await this.redis.hset(key, 'operations', JSON.stringify(operations));
        } catch (error) {
            await this.rollback(transactionId);
            throw error;
        }
    }

    async rollback(transactionId: string): Promise<void> {
        const key = this.getTransactionKey(transactionId);
        const operations = await this.getOperations(transactionId);

        for (const operation of [...operations].reverse()) {
            if (operation.status === 'completed') {
                await this.executeRollback(operation);
            }
        }

        await this.redis.hset(key, 'status', 'rolled_back');
    }

    private async getOperations(transactionId: string): Promise<any[]> {
        const key = this.getTransactionKey(transactionId);
        const data = await this.redis.hget(key, 'operations');
        return JSON.parse(data || '[]');
    }

    private async executeOperation(operation: any): Promise<void> {
        // Implement operation execution logic
    }

    private async executeRollback(operation: any): Promise<void> {
        // Implement rollback logic for the operation
    }

    private getTransactionKey(transactionId: string): string {
        return `${this.transactionKey}${transactionId}`;
    }
}