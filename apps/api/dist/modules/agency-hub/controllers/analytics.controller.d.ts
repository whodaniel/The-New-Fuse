export declare class AnalyticsController {
    getAnalyticsOverview(agencyId: string, timeframe?: string): Promise<void>;
    getPerformanceMetrics(agencyId: string, timeframe?: string, granularity?: string): Promise<void>;
    getProviderPerformance(agencyId: string, timeframe?: string, categoryId?: string): Promise<void>;
    getQualityTrends(agencyId: string, timeframe?: string, breakdown?: string): Promise<void>;
    getUtilizationMetrics(agencyId: string, timeframe?: string): Promise<void>;
    getCostAnalysis(agencyId: string, timeframe?: string, breakdown?: string): Promise<void>;
    getBottleneckAnalysis(agencyId: string, timeframe?: string): Promise<void>;
    getPredictiveAnalytics(agencyId: string, horizon?: string): Promise<void>;
    exportAnalyticsData(agencyId: string, timeframe?: string, format?: string, include?: string): Promise<void>;
    private notImplemented;
}
//# sourceMappingURL=analytics.controller.d.ts.map