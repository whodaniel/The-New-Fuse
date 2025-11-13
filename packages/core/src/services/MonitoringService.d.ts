import { LoggingService } from './LoggingService';
export interface MonitoringMetric {
    id: string;
    name: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    value: number;
    labels: Record<string, string>;
    timestamp: Date;
    unit?: string;
    description?: string;
}
export interface MonitoringAlert {
    id: string;
    name: string;
    condition: string;
    threshold: number;
    status: 'active' | 'resolved' | 'suppressed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    triggered_at?: Date;
    resolved_at?: Date;
    message: string;
    targets: string[];
}
export interface SystemHealth {
    status: 'healthy' | 'warning' | 'critical';
    components: {
        [key: string]: {
            status: 'up' | 'down' | 'degraded';
            response_time?: number;
            error_rate?: number;
            last_check: Date;
            message?: string;
        };
    };
    overall_score: number;
    last_updated: Date;
}
export interface MonitoringDashboard {
    id: string;
    name: string;
    widgets: MonitoringWidget[];
    created_at: Date;
    updated_at: Date;
}
export interface MonitoringWidget {
    id: string;
    type: 'chart' | 'metric' | 'alert' | 'table';
    title: string;
    query: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: Record<string, any>;
}
export declare class MonitoringService {
    private readonly logger;
    private metrics;
    private alerts;
    private dashboards;
    private health_checks;
    private monitoring_interval?;
    constructor(logger: LoggingService);
    recordMetric(name: string, value: number, type: MonitoringMetric['type'], labels?: Record<string, string>, options?: {
        unit?: string;
        description?: string;
    }): Promise<string>;
}
export default MonitoringService;
//# sourceMappingURL=MonitoringService.d.ts.map