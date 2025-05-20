import { getCustomRepository } from 'typeorm';
import { MetricRepository } from '../database/repositories/MetricRepository';
import { Metric } from '../database/entities/Metric';

export interface PerformanceMetric extends Metric {
    duration: number;
    operation: string;
    success: boolean;
    metadata?: Record<string, unknown>;
}

export interface ErrorMetric extends Metric {
    error: string;
    stack?: string;
    context?: Record<string, unknown>;
}

export interface UsageMetric extends Metric {
    endpoint: string;
    userId?: string;
    responseTime: number;
    statusCode: number;
    metadata?: Record<string, unknown>;
}

export interface MetricTimeRange {
    startTime: Date;
    endTime: Date;
    type?: string;
}

export interface MetricAggregation {
    startTime: Date;
    endTime: Date;
    type: string;
    aggregation: 'avg' | 'sum' | 'count';
    groupBy?: 'hour' | 'day' | 'month';
}

export interface AggregatedMetricResult {
    timestamp: Date;
    value: number;
    groupKey?: string;
}

export interface PerformanceStats {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    errorRate: number;
}

export class MetricsService {
    private readonly metricRepository: MetricRepository;

    constructor() {
        this.metricRepository = getCustomRepository(MetricRepository);
    }

    async createPerformanceMetric(data: PerformanceMetric): Promise<Metric> {
        return this.metricRepository.createPerformanceMetric(data);
    }

    async createErrorMetric(data: ErrorMetric): Promise<Metric> {
        return this.metricRepository.createErrorMetric(data);
    }

    async createUsageMetric(data: UsageMetric): Promise<Metric> {
        return this.metricRepository.createUsageMetric(data);
    }

    async findMetricsByTimeRange(timeRange: MetricTimeRange): Promise<Metric[]> {
        return this.metricRepository.findMetricsByTimeRange(
            timeRange.startTime,
            timeRange.endTime,
            timeRange.type
        );
    }

    async getAggregatedMetrics(options: MetricAggregation): Promise<AggregatedMetricResult[]> {
        return this.metricRepository.getAggregatedMetrics(options);
    }

    async getPerformanceStats(startTime: Date, endTime: Date): Promise<PerformanceStats> {
        try {
            const metrics = await this.findMetricsByTimeRange({
                startTime,
                endTime,
                type: 'performance'
            }) as PerformanceMetric[];

            const totalOperations = metrics.length;
            const successfulOperations = metrics.filter(
                (m) => m.success
            ).length;
            const totalDuration = metrics.reduce(
                (sum, m) => sum + (m.duration || 0),
                0
            );

            return {
                totalOperations,
                averageDuration: totalOperations ? totalDuration / totalOperations : 0,
                successRate: totalOperations ? successfulOperations / totalOperations : 0,
                errorRate: totalOperations ? (totalOperations - successfulOperations) / totalOperations : 0
            };
        } catch (error) {
            console.error('Error getting performance stats:', error);
            throw new Error('Failed to retrieve performance statistics');
        }
    }
}
