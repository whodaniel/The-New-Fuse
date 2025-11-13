import { AlertService } from './alerts/alert.service';
import { PerformanceMonitoringService } from './performance-monitoring.service';
import { ErrorTrackingService } from './error-tracking.service';
import { SecurityLoggingService } from './security-logging.service';
export declare class MonitoringService {
    private readonly alertService;
    private readonly performanceService;
    private readonly errorTracking;
    private readonly securityLogging;
    private readonly logger;
    constructor(alertService: AlertService, performanceService: PerformanceMonitoringService, errorTracking: ErrorTrackingService, securityLogging: SecurityLoggingService);
    initialize(): Promise<void>;
    trackMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
    trackError(error: Error, context?: Record<string, any>): Promise<void>;
    logSecurityEvent(event: string, data?: Record<string, any>): Promise<void>;
    createAlert(type: string, message: string, severity: 'low' | 'medium' | 'high'): Promise<void>;
}
//# sourceMappingURL=monitoring.service.d.ts.map