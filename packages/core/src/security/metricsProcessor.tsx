import { Logger } from 'winston';
import { getLogger } from '../logging/loggingConfig.js';
import { SystemMetrics, ApplicationMetrics, AgentMetrics } from './metricsCollector.js';
import { GDesignerTask } from '../integrations/GDesignerService.js';

const logger: Logger = getLogger('metrics_processor');

export interface MetricThresholds {
    system: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkLatency: number;
    };
    application: {
        errorRate: number;
        responseTime: number;
        queueLength: number;
        connectionLimit: number;
    };
    agent: {
        errorRate: number;
        processingTime: number;
        queueLength: number;
        resourceUsage: number;
    };
}

export interface MetricAlert {
    timestamp: number;
    type: string;
    severity: string;
    metric: string;
    value: number;
    threshold: number;
    message: string;
}

export class MetricsProcessor {
    private readonly thresholds: MetricThresholds;
    private alertHandlers: ((alert: MetricAlert) => Promise<void>)[];

    constructor(thresholds: MetricThresholds) {
        this.thresholds = thresholds;
        this.alertHandlers = [];
    }

    public async processSystemMetrics(metrics: SystemMetrics): Promise<MetricAlert[]> {
        const alerts: MetricAlert[] = [];
        const timestamp = Date.now();

        try {
            if (metrics.cpu.usage > this.thresholds.system.cpuUsage) {
                alerts.push({
                    timestamp,
                    type: 'system',
                    severity: 'warning',
                    metric: 'cpu_usage',
                    value: metrics.cpu.usage,
                    threshold: this.thresholds.system.cpuUsage,
                    message: `High CPU usage detected: ${metrics.cpu.usage}%`
                });
            }

            // Calculate memory usage percentage
            const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100;

            if (memoryUsagePercent > this.thresholds.system.memoryUsage) {
                alerts.push({
                    timestamp,
                    type: 'system',
                    severity: 'warning',
                    metric: 'memory_usage',
                    value: memoryUsagePercent,
                    threshold: this.thresholds.system.memoryUsage,
                    message: `High memory usage detected: ${memoryUsagePercent.toFixed(2)}%`
                });
            }

            await this.handleAlerts(alerts);
            return alerts;
        } catch (error) {
            logger.error('Error processing system metrics:', error);
            throw error;
        }
    }

    private async handleAlerts(alerts: MetricAlert[]): Promise<void> {
        await Promise.all(
            alerts.map(alert =>
                Promise.all(this.alertHandlers.map(handler => handler(alert)))
            )
        );
    }

    public async processApplicationMetrics(metrics: ApplicationMetrics): Promise<MetricAlert[]> {
        const alerts: MetricAlert[] = [];
        const timestamp = Date.now();

        try {
            // Check error rate
            const errorRate = metrics.requests.failed / (metrics.requests.total || 1) * 100;
            if (errorRate > this.thresholds.application.errorRate) {
                alerts.push({
                    timestamp,
                    type: 'application',
                    severity: 'warning',
                    metric: 'error_rate',
                    value: errorRate,
                    threshold: this.thresholds.application.errorRate,
                    message: `High error rate detected: ${errorRate.toFixed(2)}%`
                });
            }

            // Check response time
            if (metrics.requests.latency > this.thresholds.application.responseTime) {
                alerts.push({
                    timestamp,
                    type: 'application',
                    severity: 'warning',
                    metric: 'response_time',
                    value: metrics.requests.latency,
                    threshold: this.thresholds.application.responseTime,
                    message: `Slow response time detected: ${metrics.requests.latency}ms`
                });
            }

            await this.handleAlerts(alerts);
            return alerts;
        } catch (error) {
            logger.error('Error processing application metrics:', error);
            throw error;
        }
    }

    public async processAgentMetrics(metrics: {
        agentId: string;
        type: string;
        timestamp: number;
        [key: string]: any;
    }): Promise<void> {
        try {
            logger.debug('Processing agent metrics', { agentId: metrics.agentId, type: metrics.type });
            // Implementation would process and store agent metrics
            // and generate alerts based on thresholds
        } catch (error) {
            logger.error('Error processing agent metrics:', error);
            throw error;
        }
    }

    public async processTaskMetrics(metrics: {
        taskId: string;
        duration: number;
        success: boolean;
        error?: string;
    }): Promise<void> {
        try {
            logger.debug('Processing task metrics', {
                taskId: metrics.taskId,
                duration: metrics.duration,
                success: metrics.success
            });
            // Implementation would process and store task metrics
        } catch (error) {
            logger.error('Error processing task metrics:', error);
            throw error;
        }
    }

    public async processWorkflowMetrics(metrics: {
        workflowId: string;
        type: string;
        timestamp: number;
        error?: string;
    }): Promise<void> {
        try {
            logger.debug('Processing workflow metrics', {
                workflowId: metrics.workflowId,
                type: metrics.type
            });
            // Implementation would process and store workflow metrics
        } catch (error) {
            logger.error('Error processing workflow metrics:', error);
            throw error;
        }
    }

    public registerAlertHandler(handler: (alert: MetricAlert) => Promise<void>): void {
        this.alertHandlers.push(handler);
    }
}