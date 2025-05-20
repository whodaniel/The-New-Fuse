import { getCustomRepository } from 'typeorm';
import { MetricRepository } from '../database/repositories/MetricRepository.js';
import { Metric } from '../database/entities/Metric.js';

export class MetricsService {
    private metricRepository: MetricRepository;

    constructor() {
        this.metricRepository = getCustomRepository(MetricRepository);
    }

    async recordPerformanceMetric(data: {
        duration: number;
        operation: string;
        success: boolean;
        metadata?: Record<string, unknown>;
    }): Promise<Metric> {
        return this.metricRepository.createPerformanceMetric(data);
    }

    async recordErrorMetric(data: {
        error: string;
        stack?: string;
        context?: Record<string, unknown>;
    }): Promise<Metric> {
        return this.metricRepository.createErrorMetric(data);
    }

    async recordUsageMetric(data: {
        endpoint: string;
        userId?: string;
        responseTime: number;
        statusCode: number;
        metadata?: Record<string, unknown>;
    }): Promise<Metric> {
        return this.metricRepository.createUsageMetric(data);
    }

    async findMetricsByTimeRange(
        startTime: Date,
        endTime: Date,
        type?: string
    ): Promise<Metric[]> {
        return this.metricRepository.findMetricsByTimeRange(
            startTime,
            endTime,
            type
        );
    }

    async getAggregatedMetrics(options: {
        startTime: Date;
        endTime: Date;
        type: string;
        aggregation: 'avg' | 'sum' | 'count';
        groupBy?: 'hour' | 'day' | 'month';
    }): Promise<any[]> {
        return this.metricRepository.getAggregatedMetrics(options);
    }

    async getPerformanceStats(
        startTime: Date,
        endTime: Date
    ): Promise<{
        totalOperations: number;
        averageDuration: number;
        successRate: number;
        errorRate: number;
    }> {
        const metrics = await this.metricRepository.findMetricsByTimeRange(
            startTime,
            endTime,
            'performance'
        );

        const totalOperations = metrics.length;
        const successfulOperations = metrics.filter(m => (m as any).data.success).length;
        const totalDuration = metrics.reduce((sum, m) => sum + (m as any).data.duration, 0);

        return {
            totalOperations,
            averageDuration: totalOperations ? totalDuration / totalOperations : 0,
            successRate: totalOperations ? successfulOperations / totalOperations : 0,
            errorRate: totalOperations ? (totalOperations - successfulOperations) / totalOperations : 0
        };
    }

    async getErrorStats(
        startTime: Date,
        endTime: Date
    ): Promise<{
        totalErrors: number;
        errorsByType: Record<string, number>;
    }> {
        const errors = await this.metricRepository.findMetricsByTimeRange(
            startTime,
            endTime,
            'error'
        );

        const errorsByType = errors.reduce((acc, error) => {
            const type = error.data.error.split(':')[0];
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalErrors: errors.length,
            errorsByType
        };
    }

    async cleanupOldMetrics(retentionDays: number): Promise<number> {
        return this.metricRepository.deleteOldMetrics(retentionDays);
    }
}
