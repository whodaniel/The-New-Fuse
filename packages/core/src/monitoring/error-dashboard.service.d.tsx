import { MetricsService } from './metrics.service.js';
import { AlertingService } from './alerting.service.js';
export declare class ErrorDashboardService {
    private readonly metrics;
    private readonly alerting;
    private readonly thresholds;
    constructor(metrics: MetricsService, alerting: AlertingService);
    trackError(): Promise<void>;
}
