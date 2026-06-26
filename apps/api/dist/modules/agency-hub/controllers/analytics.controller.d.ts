import { AgencyAnalyticsService } from '../services/agency-analytics.service';
export declare class AnalyticsController {
    private readonly agencyAnalyticsService;
    constructor(agencyAnalyticsService: AgencyAnalyticsService);
    getAnalyticsOverview(agencyId: string, timeframe?: string): Promise<{
        timeframe: string;
        totalAgents: number;
        activeAgents: number;
        totalWorkflows: number;
        totalInteractions: number;
        totalRequests: number;
        successRate: number;
        averageResponseTime: number;
        avgResponseTime: number;
        agentMetrics: never[];
        costAnalysis: {
            totalCost: number;
            costByProvider: never[];
            dailyCosts: never[];
        };
    }>;
    getPerformanceMetrics(agencyId: string, timeframe?: string, _granularity?: string): Promise<{
        timeframe: string;
        dataPoints: {
            timestamp: string;
            requests: number;
            responses: number;
            errors: number;
            avgResponseTime: number;
        }[];
        agentMetrics: never[];
    }>;
    getProviderPerformance(agencyId: string, timeframe?: string, _categoryId?: string): Promise<{
        timeframe: string;
        providerPerformance: {
            provider: string;
            totalRequests: number;
            successRate: number;
            avgLatency: number;
            costPerRequest: number;
        }[];
        costAnalysis: {
            totalCost: number;
            costByProvider: never[];
            dailyCosts: never[];
        };
    }>;
    getQualityTrends(agencyId: string, timeframe?: string, _breakdown?: string): Promise<{
        timeframe: string;
        qualityTrends: {
            date: string;
            qualityScore: number;
            userSatisfaction: number;
            errorRate: number;
        }[];
    }>;
}
//# sourceMappingURL=analytics.controller.d.ts.map