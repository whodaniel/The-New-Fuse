interface DateRange {
    startDate: Date;
    endDate: Date;
}
interface WorkflowInsights {
    performance: any;
    bottlenecks: any[];
    optimization: any;
    businessImpact: any;
    predictions: any;
}
interface AnalyticsFilters {
    workflowId?: string;
    timeRange?: DateRange;
    metrics?: string[];
}
interface AnalyticsDashboard {
    performance: any;
    trends: any;
    insights: any;
}
export declare class WorkflowAnalytics {
    private readonly metricsCollector;
    private readonly insightGenerator;
    private readonly dashboardGenerator;
    constructor();
    generateBusinessInsights(workflowId: string, timeRange: DateRange): Promise<WorkflowInsights>;
    generateDashboard(filters: AnalyticsFilters): Promise<AnalyticsDashboard>;
    private analyzeTrends;
    private analyzePerformanceMetrics;
    private identifyBottlenecks;
    private generateOptimizationSuggestions;
    private calculateBusinessImpact;
    private generatePredictions;
}
export {};
//# sourceMappingURL=analytics.d.ts.map