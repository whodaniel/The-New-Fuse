import { MonitoringDashboardService, DashboardData, SystemMetrics, PerformanceAlert } from './dashboard.service';
export declare class MonitoringDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: MonitoringDashboardService);
    getDashboard(): Promise<DashboardData>;
    getCurrentMetrics(): Promise<SystemMetrics>;
    getMetricsHistory(timeRange?: string): Promise<{
        timeRange: string;
        dataPoints: SystemMetrics[];
    }>;
    getAlerts(limit?: number, status?: string): Promise<PerformanceAlert[]>;
    resolveAlert(alertId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=dashboard.controller.d.ts.map