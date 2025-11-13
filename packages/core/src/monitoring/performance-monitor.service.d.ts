import { LoggingService } from '../services/LoggingService';
export interface PerformanceMetric {
    id: string;
    name: string;
    category: MetricCategory;
    value: number;
    unit: MetricUnit;
    timestamp: Date;
    source: string;
    tags: Record<string, string>;
    threshold?: PerformanceThreshold;
}
export type MetricCategory = 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'application' | 'user_experience' | 'business' | 'security' | 'availability';
export type MetricUnit = 'percentage' | 'milliseconds' | 'seconds' | 'bytes' | 'kilobytes' | 'megabytes' | 'gigabytes' | 'count' | 'rate' | 'boolean';
export interface PerformanceThreshold {
    warning: number;
    critical: number;
    operator: 'greater_than' | 'less_than' | 'equals' | 'between';
    enabled: boolean;
}
export interface PerformanceAlert {
    id: string;
    metric_id: string;
    severity: 'warning' | 'critical';
    title: string;
    message: string;
    triggered_at: Date;
    resolved_at?: Date;
    current_value: number;
    threshold_value: number;
    metadata: Record<string, any>;
}
export interface PerformanceReport {
    id: string;
    name: string;
    description: string;
    time_range: TimeRange;
    metrics: PerformanceMetric[];
    summary: PerformanceSummary;
    charts: ChartConfig[];
    generated_at: Date;
    format: 'json' | 'pdf' | 'html' | 'csv';
}
export interface TimeRange {
    start: Date;
    end: Date;
    duration: number;
    interval: 'minute' | 'hour' | 'day' | 'week' | 'month';
}
export interface PerformanceSummary {
    total_metrics: number;
    metrics_by_category: Record<MetricCategory, number>;
    alerts_triggered: number;
    average_performance_score: number;
    worst_performing_components: ComponentPerformance[];
    best_performing_components: ComponentPerformance[];
    trends: PerformanceTrend[];
}
export interface ComponentPerformance {
    component: string;
    category: MetricCategory;
    score: number;
    primary_metric: string;
    value: number;
    trend: 'improving' | 'stable' | 'degrading';
}
export interface PerformanceTrend {
    metric_name: string;
    direction: 'up' | 'down' | 'stable';
    change_percentage: number;
    period: string;
}
export interface ChartConfig {
    id: string;
    title: string;
    type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
    metrics: string[];
    time_range: TimeRange;
    aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
}
export interface MonitoringRule {
    id: string;
    name: string;
    description: string;
    metric_pattern: string;
    threshold: PerformanceThreshold;
    actions: AlertAction[];
    enabled: boolean;
    created_at: Date;
    last_triggered: Date;
    trigger_count: number;
}
export interface AlertAction {
    type: 'notification' | 'webhook' | 'email' | 'auto_scale' | 'restart' | 'log';
    configuration: Record<string, any>;
    delay: number;
}
export interface PerformanceMonitorStats {
    total_metrics_collected: number;
    metrics_per_second: number;
    alerts_active: number;
    alerts_resolved_24h: number;
    monitoring_rules_active: number;
    data_retention_days: number;
    storage_usage_mb: number;
    collection_latency_ms: number;
    uptime_percentage: number;
}
export declare class PerformanceMonitorService {
    private readonly logger;
    private metrics;
    private alerts;
    private monitoring_rules;
    private reports;
    private collection_intervals;
    private stats;
    private metric_buffers;
    private last_collection_time;
    constructor(logger: LoggingService);
    /**
     * Initialize monitoring statistics
     */
    private initializeStats;
    /**
     * Initialize default monitoring rules
     */
    private initializeDefaultRules;
    /**
     * Check if value violates threshold
     */
    private checkThreshold;
    /**
     * Create performance alert
     */
    private createPerformanceAlert;
    _$: any;
}
//# sourceMappingURL=performance-monitor.service.d.ts.map