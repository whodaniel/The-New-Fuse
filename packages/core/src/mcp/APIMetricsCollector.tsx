import { Injectable } from '@nestjs/common';
import { MCPTool } from './types.js';
import { APISpec } from '../agents/types/workflow.types.js';
import { Logger } from '../utils/logger.js';

interface APIMetric {
    timestamp: number;
    duration: number;
    success: boolean;
    error?: string;
    endpoint: string;
    method: string;
    agentId: string;
    statusCode?: number;
    responseSize?: number;
}

@Injectable()
export class APIMetricsCollector {
    private metrics: Map<string, APIMetric[]> = new Map();
    private logger: Logger;

    constructor() {
        this.logger = new Logger('APIMetricsCollector');
    }

    /**
     * Record a metric for an API call
     */
    recordMetric(
        toolName: string,
        agentId: string,
        metric: Omit<APIMetric, 'timestamp'>
    ): void {
        const metricWithTimestamp: APIMetric = {
            ...metric,
            timestamp: Date.now()
        };

        if (!this.metrics.has(toolName)) {
            this.metrics.set(toolName, []);
        }

        this.metrics.get(toolName)?.push(metricWithTimestamp);
        this.logger.debug(`Recorded metric for ${toolName}: ${JSON.stringify(metricWithTimestamp)}`);
    }

    /**
     * Get performance metrics for an API tool
     */
    getToolMetrics(toolName: string): {
        totalCalls: number;
        successRate: number;
        avgDuration: number;
        errorRate: number;
        last24Hours: {
            calls: number;
            successRate: number;
        };
    } {
        const toolMetrics = this.metrics.get(toolName) || [];
        const now = Date.now();
        const last24Hours = now - (24 * 60 * 60 * 1000);

        const recent = toolMetrics.filter(m => m.timestamp >= last24Hours);
        const totalCalls = toolMetrics.length;
        const successfulCalls = toolMetrics.filter(m => m.success).length;
        const totalDuration = toolMetrics.reduce((sum, m) => sum + m.duration, 0);

        return {
            totalCalls,
            successRate: totalCalls ? successfulCalls / totalCalls : 0,
            avgDuration: totalCalls ? totalDuration / totalCalls : 0,
            errorRate: totalCalls ? (totalCalls - successfulCalls) / totalCalls : 0,
            last24Hours: {
                calls: recent.length,
                successRate: recent.length ? 
                    recent.filter(m => m.success).length / recent.length : 0
            }
        };
    }

    /**
     * Get agent-specific API usage metrics
     */
    getAgentMetrics(agentId: string): {
        totalApiCalls: number;
        toolUsage: Record<string, number>;
        performance: {
            successRate: number;
            avgDuration: number;
            errorRate: number;
        };
    } {
        let totalCalls = 0;
        let successfulCalls = 0;
        let totalDuration = 0;
        const toolUsage: Record<string, number> = {};

        // Aggregate metrics across all tools for this agent
        for (const [toolName, metrics] of this.metrics.entries()) {
            const agentMetrics = metrics.filter(m => m.agentId === agentId);
            toolUsage[toolName] = agentMetrics.length;
            totalCalls += agentMetrics.length;
            successfulCalls += agentMetrics.filter(m => m.success).length;
            totalDuration += agentMetrics.reduce((sum, m) => sum + m.duration, 0);
        }

        return {
            totalApiCalls: totalCalls,
            toolUsage,
            performance: {
                successRate: totalCalls ? successfulCalls / totalCalls : 0,
                avgDuration: totalCalls ? totalDuration / totalCalls : 0,
                errorRate: totalCalls ? (totalCalls - successfulCalls) / totalCalls : 0
            }
        };
    }

    /**
     * Create a wrapped version of an API tool that collects metrics
     */
    wrapToolWithMetrics(
        tool: MCPTool,
        agentId: string,
        endpoint: string,
        method: string
    ): MCPTool {
        return {
            ...tool,
            execute: async (params: any) => {
                const startTime = Date.now();
                try {
                    const result = await tool.execute(params);
                    const duration = Date.now() - startTime;

                    this.recordMetric(tool.name, agentId, {
                        duration,
                        success: true,
                        endpoint,
                        method,
                        agentId,
                        statusCode: 200,
                        responseSize: JSON.stringify(result).length
                    });

                    return result;
                } catch (error) {
                    const duration = Date.now() - startTime;
                    this.recordMetric(tool.name, agentId, {
                        duration,
                        success: false,
                        error: error.message,
                        endpoint,
                        method,
                        agentId,
                        statusCode: error.status || 500
                    });
                    throw error;
                }
            }
        };
    }

    /**
     * Clear old metrics to prevent memory growth
     */
    clearOldMetrics(olderThan: number = 30 * 24 * 60 * 60 * 1000): void {
        const cutoff = Date.now() - olderThan;
        for (const [toolName, metrics] of this.metrics.entries()) {
            this.metrics.set(
                toolName,
                metrics.filter(m => m.timestamp >= cutoff)
            );
        }
    }
}