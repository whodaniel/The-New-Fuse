import { Injectable } from '@nestjs/common';
import { MetricType } from '../types.js';

@Injectable()
export class AgentMetricsService {
    private metrics = new Map<string, Map<MetricType, number[]>>();

    trackMetric(agentId: string, type: MetricType, value: number) {
        if (!this.metrics.has(agentId)) {
            this.metrics.set(agentId, new Map());
        }
        const agentMetrics = this.metrics.get(agentId);
        if (!agentMetrics.has(type)) {
            agentMetrics.set(type, []);
        }
        agentMetrics.get(type).push(value);
    }

    getMetrics(agentId: string, type?: MetricType) {
        const agentMetrics = this.metrics.get(agentId);
        if (!agentMetrics) return null;
        if (type) {
            return {
                type,
                values: agentMetrics.get(type) || []
            };
        }
        return Object.fromEntries(agentMetrics.entries());
    }

    calculateAverages(agentId: string) {
        const agentMetrics = this.metrics.get(agentId);
        if (!agentMetrics) return null;

        return Object.fromEntries(
            Array.from(agentMetrics.entries()).map(([type, values]) => [
                type,
                values.reduce((a, b) => a + b, 0) / values.length
            ])
        );
    }
}