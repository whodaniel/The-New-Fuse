var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
import { Injectable } from '@nestjs/common';
import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { MetricsService } from '../metrics/metrics.service.js';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';
let AnalyticsIntegrationService = class AnalyticsIntegrationService {
    mcpBroker;
    metrics;
    workflowMonitor;
    logger;
    metricPrefix = 'analytics:';
    constructor(mcpBroker, metrics, workflowMonitor, logger) {
        this.mcpBroker = mcpBroker;
        this.metrics = metrics;
        this.workflowMonitor = workflowMonitor;
        this.logger = logger;
        this.initializeAnalytics();
    }
    async initializeAnalytics() {
        try {
            await this.mcpBroker.executeDirective('analytics', 'initialize', {
                metricTypes: [
                    'workflow_performance',
                    'agent_performance',
                    'tool_usage',
                    'resource_utilization'
                ]
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize analytics:', error);
        }
    }
    async trackWorkflowPerformance(workflowId) {
        const metrics = await this.workflowMonitor.getWorkflowMetrics(workflowId);
        const performance = {
            latency: await this.calculateAverageLatency(workflowId), // Ensure this handles no events
            throughput: await this.calculateThroughput(workflowId), // Ensure this handles no duration/tasks
            errorRate: (metrics.completedTasks + metrics.failedTasks) > 0 ?
                metrics.failedTasks / (metrics.completedTasks + metrics.failedTasks) : 0,
            resourceUtilization: Object.fromEntries(metrics.resourceUtilization)
        };
        await this.recordPerformanceMetrics(workflowId, performance);
        return performance;
    }
    async trackAgentPerformance(agentId) {
        const agentMetrics = await this.metrics.getAgentMetrics(agentId);
        const performance = {
            latency: agentMetrics.averageLatency,
            throughput: agentMetrics.tasksThroughput,
            errorRate: agentMetrics.errorRate,
            resourceUtilization: agentMetrics.resourceUsage
        };
        await this.recordPerformanceMetrics(agentId, performance, 'agent');
        return performance;
    }
    async trackToolUsage(toolName) {
        await this.mcpBroker.executeDirective('analytics', 'trackToolUsage', {
            tool: toolName,
            timestamp: Date.now(),
            metadata: {
                context: 'workflow_execution'
            }
        });
    }
    async calculateAverageLatency(workflowId) {
        const events = await this.workflowMonitor.getWorkflowEvents(workflowId);
        if (events.length === 0)
            return 0;
        const latencies = events
            .filter(e => e.type === 'TASK_COMPLETED')
            .map(e => e.duration);
        return latencies.length > 0 ?
            latencies.reduce((a, b) => a + b, 0) / latencies.length :
            0;
    }
    async calculateThroughput(workflowId) {
        const metrics = await this.workflowMonitor.getWorkflowMetrics(workflowId);
        const totalTasks = metrics.completedTasks + metrics.failedTasks;
        const duration = await this.getWorkflowDuration(workflowId);
        return duration > 0 ? totalTasks / duration : 0;
    }
    async getWorkflowDuration(workflowId) {
        const events = await this.workflowMonitor.getWorkflowEvents(workflowId);
        if (events.length < 2)
            return 0;
        const startTime = events[0].timestamp;
        const endTime = events[events.length - 1].timestamp;
        return (endTime - startTime) / 1000; // Convert to seconds
    }
    async recordPerformanceMetrics(id, metrics, type = 'workflow') {
        const key = `${this.metricPrefix}${type}:${id}`;
        await this.metrics.recordMetrics(key, metrics);
        await this.mcpBroker.executeDirective('analytics', 'recordPerformance', {
            entityId: id,
            entityType: type,
            metrics,
            timestamp: Date.now()
        });
    }
};
AnalyticsIntegrationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MCPBrokerService, typeof (_a = typeof MetricsService !== "undefined" && MetricsService) === "function" ? _a : Object, WorkflowMonitoringService,
        Logger])
], AnalyticsIntegrationService);
export { AnalyticsIntegrationService };
