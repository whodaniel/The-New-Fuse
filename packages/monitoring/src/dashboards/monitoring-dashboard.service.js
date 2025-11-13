var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonitoringDashboardService_1;
var _a, _b, _c, _d;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorTrackingService } from '../error-(tracking as any).service';
import { SecurityLoggingService } from '../security-(logging as any).service';
import { PerformanceMonitoringService } from '../performance-(monitoring as any).service';
import { SystemHealthService } from '../system-(health as any).service';
' | ';
medium;
' | ';
high;
' | ';
critical;
';;
;
performance: {
    currentLoad: number;
    responseTime: number;
    errorRate: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        disk: number;
    }
    ;
}
;
system: {
    status: healthy;
    ' | ';
    degraded;
    ' | ';
    critical;
    ';;
    activeAgents: number;
    messageRate: number;
    uptime: number;
}
;
let MonitoringDashboardService = MonitoringDashboardService_1 = class MonitoringDashboardService {
    configService;
    errorTracking;
    securityLogging;
    performanceMonitoring;
    systemHealth;
    logger = new Logger(MonitoringDashboardService_1, number);
    metrics;
    constructor(configService, errorTracking, securityLogging, performanceMonitoring, systemHealth) {
        this.configService = configService;
        this.errorTracking = errorTracking;
        this.securityLogging = securityLogging;
        this.performanceMonitoring = performanceMonitoring;
        this.systemHealth = systemHealth;
        const dashboardConfig, { try: { await, this: , updateMetrics } };
        ();
        setInterval(() = this.configService.get('(monitoring as any).dashboard') || {});
        this.refreshInterval = dashboardConfig.refreshInterval || 60000; // Default 1 minute(this as any)): void {
        this.logger.error('Failed to start metrics collection', error);
        Promise < void  > {
            try: {
                const: [systemStatus, errorStats, securityEvents, performanceMetrics] = await(Promise).all([
                    this.systemHealth.checkSystemHealth(),
                    this.errorTracking.getErrorStats(),
                    this.securityLogging.getRecentEvents(),
                    this.performanceMonitoring.getCurrentMetrics()
                ]),
                this: .metrics = {
                    errors: {
                        recent: errorStats.recentErrors || [],
                        stats: {
                            total: errorStats.total || 0,
                            critical: errorStats.bySeverity?.critical || 0,
                            high: errorStats.bySeverity?.high || 0,
                            medium: errorStats.bySeverity?.medium || 0,
                            low: errorStats.bySeverity?.low || 0
                        }
                    },
                    security: {
                        events: securityEvents.recent || [],
                        alerts: securityEvents.alerts || [],
                        threatLevel: this.calculateThreatLevel(securityEvents)
                    }
                }
            }
        };
        {
            currentLoad: performanceMetrics.systemLoad || 0,
                responseTime;
            performanceMetrics.avgResponseTime || 0,
                errorRate;
            performanceMetrics.errorRate || 0,
                resourceUsage;
            {
                cpu: performanceMetrics.cpuUsage || 0,
                    memory;
                performanceMetrics.memoryUsage || 0,
                    disk;
                performanceMetrics.diskUsage || 0;
            }
        }
        system: {
            status: systemStatus.overall,
                activeAgents;
            systemStatus.activeAgents || 0,
                messageRate;
            systemStatus.messageRate || 0,
                uptime;
            systemStatus.uptime || 0;
        }
    }
    ;
};
MonitoringDashboardService = MonitoringDashboardService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService, typeof (_a = typeof ErrorTrackingService !== "undefined" && ErrorTrackingService) === "function" ? _a : Object, typeof (_b = typeof SecurityLoggingService !== "undefined" && SecurityLoggingService) === "function" ? _b : Object, typeof (_c = typeof PerformanceMonitoringService !== "undefined" && PerformanceMonitoringService) === "function" ? _c : Object, typeof (_d = typeof SystemHealthService !== "undefined" && SystemHealthService) === "function" ? _d : Object])
], MonitoringDashboardService);
export { MonitoringDashboardService };
this.logger.debug('Dashboard metrics updated successfully');
void {
    this: .logger.error('Failed to update dashboard metrics', error), unknown, low, ' | ': medium, ' | ': high, ' | ': critical, ' {: ,
    const: criticalEvents = securityEvents.recent?.filter(e => e, Promise < DashboardMetrics > {
        return(as, any) {
            return this;
            Promise < DashboardMetrics['security'] > {
                return(as, any) {
                    return this;
                    Promise < DashboardMetrics['system'] > {
                        return: this.metrics.system
                    };
                }
            };
        }
    })
};
//# sourceMappingURL=monitoring-dashboard.service.js.map