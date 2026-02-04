import { MCPBrokerService } from '../mcp/services/mcp-broker.service.tsx';
import { MetricsService } from '../metrics/metrics.service.js';
import { WorkflowMonitoringService } from './WorkflowMonitoringService.js';
import { Logger } from '../common/logger.service.js';
export interface PerformanceMetrics {
    latency: number;
    throughput: number;
    errorRate: number;
    resourceUtilization: Record<string, number>;
}
export declare class AnalyticsIntegrationService {
    private readonly mcpBroker;
    private readonly metrics;
    private readonly workflowMonitor;
    private readonly logger;
    private readonly metricPrefix;
    constructor(mcpBroker: MCPBrokerService, metrics: MetricsService, workflowMonitor: WorkflowMonitoringService, logger: Logger);
    private initializeAnalytics;
    trackWorkflowPerformance(workflowId: string): Promise<PerformanceMetrics>;
    trackAgentPerformance(agentId: string): Promise<PerformanceMetrics>;
    trackToolUsage(toolName: string): Promise<void>;
    private calculateAverageLatency;
    private calculateThroughput;
    private getWorkflowDuration;
    private recordPerformanceMetrics;
}
//# sourceMappingURL=AnalyticsIntegrationService.d.ts.map