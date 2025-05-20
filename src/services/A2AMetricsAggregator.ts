import { Injectable, OnModuleInit } from '@nestjs/common';
import { AgentMetricsService } from './AgentMetricsService.js';
import { A2AMessageQueue } from './A2AMessageQueue.js';
import { MetricType } from '../types/metrics.js';

@Injectable()
export class A2AMetricsAggregator implements OnModuleInit {
    private aggregationInterval = 60000; // 1 minute
    private metricsBuffer: Map<string, any[]> = new Map();

    constructor(
        private metricsService: AgentMetricsService,
        private messageQueue: A2AMessageQueue
    ) {}

    async onModuleInit() {
        this.startAggregation();
    }

    private startAggregation() {
        setInterval(() => this.aggregateMetrics(), this.aggregationInterval);
    }

    async recordMetric(agentId: string, type: MetricType, value: number) {
        if (!this.metricsBuffer.has(agentId)) {
            this.metricsBuffer.set(agentId, []);
        }
        this.metricsBuffer.get(agentId).push({ type, value, timestamp: Date.now() });
    }

    private async aggregateMetrics() {
        for (const [agentId, metrics] of this.metricsBuffer.entries()) {
            const aggregated = this.calculateAggregates(metrics);
            await this.metricsService.trackMetric(agentId, 'aggregated', aggregated);
            this.metricsBuffer.set(agentId, []);
        }
    }

    private calculateAggregates(metrics: any[]): any {
        const grouped = metrics.reduce((acc, metric) => {
            if (!acc[metric.type]) acc[metric.type] = [];
            acc[metric.type].push(metric.value);
            return acc;
        }, {});

        return Object.entries(grouped).reduce((acc, [type, values]) => {
            acc[type] = {
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                max: Math.max(...values),
                min: Math.min(...values)
            };
            return acc;
        }, {});
    }
}