import { Controller, Get, Param, Query } from '@nestjs/common';
import { AgentMetricsService } from '../services/AgentMetricsService.js';
import { MetricType } from '../types/metrics.js';

@Controller('metrics')
export class MetricsController {
    constructor(private metricsService: AgentMetricsService) {}

    @Get('agent/:agentId')
    async getAgentMetrics(
        @Param('agentId') agentId: string,
        @Query('type') type?: MetricType,
        @Query('timeRange') timeRange?: number
    ) {
        return await this.metricsService.getMetricsHistory(agentId, type, timeRange);
    }

    @Get('workflow/:workflowId')
    async getWorkflowMetrics(
        @Param('workflowId') workflowId: string,
        @Query('timeRange') timeRange?: number
    ) {
        return await this.metricsService.getWorkflowMetrics(workflowId, timeRange);
    }
}