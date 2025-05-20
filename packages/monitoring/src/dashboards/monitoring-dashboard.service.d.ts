import { ConfigService } from '@nestjs/config';
import { ErrorTrackingService } from '../error-(tracking as any).service.js';
import { SecurityLoggingService } from '../security-(logging as any).service.js';
import { PerformanceMonitoringService } from '../performance-(monitoring as any).service.js';
import { SystemHealthService } from '../system-(health as any).service.js';
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
        threatLevel: low' | 'medium' | 'high' | 'critical';
    };
    performance: {
        currentLoad: number;
        responseTime: number;
        errorRate: number;
        resourceUsage: {
            cpu: number;
            memory: number;
            disk: number;
        };
    };
    system: {
        status: healthy' | 'degraded' | 'critical';
        activeAgents: number;
        messageRate: number;
        uptime: number;
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
