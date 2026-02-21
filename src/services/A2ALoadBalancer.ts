import { Injectable, OnModuleInit } from '@nestjs/common';
import { A2AMetricsAggregator } from './A2AMetricsAggregator.js';
import { A2ATaskPrioritizer } from './A2ATaskPrioritizer.js';
import { RedisClient } from './RedisClient.js';

@Injectable()
export class A2ALoadBalancer implements OnModuleInit {
    private readonly agentLoadKey = 'a2a:agent_load';
    private readonly healthCheckInterval = 5000; // 5 seconds

    constructor(
        private metrics: A2AMetricsAggregator,
        private taskPrioritizer: A2ATaskPrioritizer,
        private redis: RedisClient
    ) {}

    async onModuleInit() {
        this.startHealthChecks();
    }

    async assignTask(task: any, availableAgents: string[]): Promise<string> {
        const agentLoads = await this.getAgentLoads(availableAgents);
        const taskPriority = await this.taskPrioritizer.prioritizeTask(task);
        
        return this.selectOptimalAgent(agentLoads, taskPriority);
    }

    private async getAgentLoads(agents: string[]): Promise<Map<string, number>> {
        const loads = new Map<string, number>();
        
        for (const agent of agents) {
            const load = await this.redis.hget(this.agentLoadKey, agent);
            loads.set(agent, parseFloat(load) || 0);
        }
        
        return loads;
    }

    private selectOptimalAgent(
        loads: Map<string, number>,
        taskPriority: number
    ): string {
        const weightedLoads = Array.from(loads.entries()).map(([agent, load]) => ({
            agent,
            score: this.calculateAssignmentScore(load, taskPriority)
        }));

        weightedLoads.sort((a, b) => b.score - a.score);
        return weightedLoads[0]?.agent;
    }

    private calculateAssignmentScore(load: number, priority: number): number {
        const loadWeight = 0.7;
        const priorityWeight = 0.3;
        
        const normalizedLoad = 1 - (load / 100); // Convert load to 0-1 scale
        return (normalizedLoad * loadWeight) + (priority * priorityWeight);
    }

    async updateAgentLoad(agentId: string, load: number): Promise<void> {
        await this.redis.hset(this.agentLoadKey, agentId, load.toString());
    }

    private startHealthChecks(): void {
        setInterval(async () => {
            await this.performHealthCheck();
        }, this.healthCheckInterval);
    }

    private async performHealthCheck(): Promise<void> {
        const agents = await this.redis.hgetall(this.agentLoadKey);
        
        for (const [agent, load] of Object.entries(agents)) {
            if (parseFloat(load) > 90) {
                await this.handleHighLoad(agent);
            }
        }
    }

    private async handleHighLoad(agent: string): Promise<void> {
        // Implement high load handling strategy
    }
}