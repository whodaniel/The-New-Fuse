import { EnhancedAgencyService } from '../../../types/core/services/enhanced-agency.service';
import { AgentSwarmOrchestrationService } from '../../../types/core/services/agent-swarm-orchestration.service';
import { ServiceCategoryRouterService } from '../../../types/core/services/service-category-router.service';
export declare class AnalyticsController {
    private readonly enhancedAgencyService;
    private readonly swarmOrchestrationService;
    private readonly serviceCategoryRouter;
    constructor(enhancedAgencyService: EnhancedAgencyService, swarmOrchestrationService: AgentSwarmOrchestrationService, serviceCategoryRouter: ServiceCategoryRouterService);
    getAnalyticsOverview(agencyId: string, timeframe?: string): Promise<{
        timeframe: string;
        generatedAt: string;
        agency: any;
        swarm: any;
        services: any;
        summary: {
            totalExecutions: any;
            totalRequests: any;
            averageQuality: any;
            providerUtilization: any;
            clientSatisfaction: any;
        };
    }>;
    getPerformanceMetrics(agencyId: string, timeframe?: string, granularity?: string): Promise<any>;
    getProviderPerformance(agencyId: string, timeframe?: string, categoryId?: string): Promise<any>;
    getQualityTrends(agencyId: string, timeframe?: string, breakdown?: string): Promise<any>;
    getUtilizationMetrics(agencyId: string, timeframe?: string): Promise<any>;
    getCostAnalysis(agencyId: string, timeframe?: string, breakdown?: string): Promise<any>;
    getBottleneckAnalysis(agencyId: string, timeframe?: string): Promise<any>;
    getPredictiveAnalytics(agencyId: string, horizon?: string): Promise<any>;
    exportAnalyticsData(agencyId: string, timeframe?: string, format?: string, include?: string): Promise<any>;
}
//# sourceMappingURL=analytics.controller.d.ts.map