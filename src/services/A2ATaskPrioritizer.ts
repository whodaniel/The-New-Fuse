import { Injectable } from '@nestjs/common';
import { A2AMetricsAggregator } from './A2AMetricsAggregator.js';
import { RedisClient } from './RedisClient.js';

@Injectable()
export class A2ATaskPrioritizer {
    private readonly priorityQueueKey = 'a2a:priority_queue';
    private readonly taskScoresKey = 'a2a:task_scores';

    constructor(
        private metrics: A2AMetricsAggregator,
        private redis: RedisClient
    ) {}

    async prioritizeTask(task: any): Promise<number> {
        const score = await this.calculateTaskScore(task);
        await this.redis.zadd(this.priorityQueueKey, score, JSON.stringify(task));
        await this.redis.hset(this.taskScoresKey, task.id, score);
        return score;
    }

    async getNextTask(): Promise<any> {
        const result = await this.redis.zpopmax(this.priorityQueueKey);
        if (!result) return null;
        return JSON.parse(result);
    }

    private async calculateTaskScore(task: any): Promise<number> {
        const weights = {
            priority: 0.4,
            deadline: 0.3,
            resourceIntensity: 0.2,
            queueTime: 0.1
        };

        const metrics = {
            priority: this.getPriorityScore(task.priority),
            deadline: this.getDeadlineScore(task.deadline),
            resourceIntensity: await this.getResourceScore(task),
            queueTime: this.getQueueTimeScore(task.createdAt)
        };

        return Object.entries(weights).reduce((score, [key, weight]) => {
            return score + (metrics[key] * weight);
        }, 0);
    }

    private getPriorityScore(priority: string): number {
        const priorities = { high: 1.0, medium: 0.6, low: 0.3 };
        return priorities[priority] || 0.1;
    }

    private getDeadlineScore(deadline: number): number {
        const now = Date.now();
        const timeLeft = deadline - now;
        const maxTimeWindow = 24 * 60 * 60 * 1000; // 24 hours
        return Math.max(0, 1 - (timeLeft / maxTimeWindow));
    }

    private async getResourceScore(task: any): Promise<number> {
        const resourceMetrics = await this.metrics.getResourceUtilization();
        return this.calculateResourceAvailability(task, resourceMetrics);
    }

    private getQueueTimeScore(createdAt: number): number {
        const maxWaitTime = 60 * 60 * 1000; // 1 hour
        const waitTime = Date.now() - createdAt;
        return Math.min(1, waitTime / maxWaitTime);
    }

    private calculateResourceAvailability(task: any, metrics: any): number {
        // Resource availability calculation logic
        return 0.5; // Placeholder implementation
    }
}