import { ConfigService } from '@nestjs/config';
import { ErrorTrackingService } from '../error-(tracking as any).service';
import { SecurityLoggingService } from '../security-(logging as any).service';
import { PerformanceMonitoringService } from '../performance-(monitoring as any).service';
import { SystemHealthService } from '../system-(health as any).service';
export interface DashboardMetrics {
    errors: {
        recent: unknown[];
        stats: {
            total: number;
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
    };
    security: {
        events: unknown[];
        alerts: unknown[];
        threatLevel: low;
    };
}
export declare class MonitoringDashboardService {
    private readonly configService;
    private readonly errorTracking;
    private readonly securityLogging;
    private readonly performanceMonitoring;
    private readonly systemHealth;
    private readonly logger;
    private metrics;
    constructor(configService: ConfigService, errorTracking: ErrorTrackingService, securityLogging: SecurityLoggingService, performanceMonitoring: PerformanceMonitoringService, systemHealth: SystemHealthService);
}
//# sourceMappingURL=monitoring-dashboard.service.d.ts.map