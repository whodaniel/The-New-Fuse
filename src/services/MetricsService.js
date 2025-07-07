"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const typeorm_1 = require("typeorm");
const MetricRepository_1 = require("../database/repositories/MetricRepository");
class MetricsService {
    constructor() {
        this.metricRepository = (0, typeorm_1.getCustomRepository)(MetricRepository_1.MetricRepository);
    }
    async createPerformanceMetric(data) {
        return this.metricRepository.createPerformanceMetric(data);
    }
    async createErrorMetric(data) {
        return this.metricRepository.createErrorMetric(data);
    }
    async createUsageMetric(data) {
        return this.metricRepository.createUsageMetric(data);
    }
    async findMetricsByTimeRange(timeRange) {
        return this.metricRepository.findMetricsByTimeRange(timeRange.startTime, timeRange.endTime, timeRange.type);
    }
    async getAggregatedMetrics(options) {
        return this.metricRepository.getAggregatedMetrics(options);
    }
    async getPerformanceStats(startTime, endTime) {
        try {
            const metrics = await this.findMetricsByTimeRange({
                startTime,
                endTime,
                type: 'performance'
            });
            const totalOperations = metrics.length;
            const successfulOperations = metrics.filter((m) => m.success).length;
            const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
            return {
                totalOperations,
                averageDuration: totalOperations ? totalDuration / totalOperations : 0,
                successRate: totalOperations ? successfulOperations / totalOperations : 0,
                errorRate: totalOperations ? (totalOperations - successfulOperations) / totalOperations : 0
            };
        }
        catch (error) {
            console.error('Error getting performance stats:', error);
            throw new Error('Failed to retrieve performance statistics');
        }
    }
}
exports.MetricsService = MetricsService;
