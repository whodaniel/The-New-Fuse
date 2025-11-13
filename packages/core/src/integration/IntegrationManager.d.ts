import { LoggingService } from '../services/LoggingService';
import { SystemIntegratorService } from './system-integrator';
export interface ManagedIntegration {
    id: string;
    integration_id: string;
    name: string;
    description: string;
    category: IntegrationCategory;
    status: ManagedIntegrationStatus;
    health_score: number;
    performance_metrics: PerformanceMetrics;
    configuration: IntegrationConfiguration;
    dependencies: string[];
    scheduled_tasks: ScheduledTask[];
    alerts: IntegrationAlert[];
    last_health_check: Date;
    next_health_check: Date;
    created_at: Date;
    updated_at: Date;
}
export type IntegrationCategory = 'data_source' | 'data_destination' | 'communication' | 'authentication' | 'monitoring' | 'storage' | 'analytics' | 'workflow' | 'external_api' | 'internal_service';
export type ManagedIntegrationStatus = 'active' | 'inactive' | 'monitoring' | 'maintenance' | 'error' | 'warning' | 'deprecated' | 'testing';
export interface PerformanceMetrics {
    availability: number;
    response_time_avg: number;
    response_time_p95: number;
    response_time_p99: number;
    throughput: number;
    error_rate: number;
    success_rate: number;
    uptime_percentage: number;
    last_24h_requests: number;
    last_24h_errors: number;
}
export interface IntegrationConfiguration {
    auto_restart: boolean;
    health_check_interval: number;
    alert_thresholds: AlertThresholds;
    backup_strategy: BackupStrategy;
    scaling_policy: ScalingPolicy;
    maintenance_window: MaintenanceWindow;
    monitoring_config: MonitoringConfig;
}
export interface AlertThresholds {
    response_time_warning: number;
    response_time_critical: number;
    error_rate_warning: number;
    error_rate_critical: number;
    availability_warning: number;
    availability_critical: number;
}
export interface BackupStrategy {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    retention_days: number;
    backup_location: string;
}
export interface ScalingPolicy {
    enabled: boolean;
    min_instances: number;
    max_instances: number;
    scale_up_threshold: number;
    scale_down_threshold: number;
    cooldown_period: number;
}
export interface MaintenanceWindow {
    enabled: boolean;
    day_of_week: number;
    start_hour: number;
    duration_hours: number;
    timezone: string;
}
export interface MonitoringConfig {
    metrics_collection_interval: number;
    log_level: 'debug' | 'info' | 'warn' | 'error';
    custom_metrics: string[];
    dashboard_enabled: boolean;
}
export interface ScheduledTask {
    id: string;
    name: string;
    type: TaskType;
    schedule: string;
    enabled: boolean;
    last_run: Date;
    next_run: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
    configuration: Record<string, any>;
}
export type TaskType = 'health_check' | 'backup' | 'maintenance' | 'cleanup' | 'sync' | 'restart' | 'update_config' | 'generate_report';
export interface IntegrationAlert {
    id: string;
    integration_id: string;
    severity: AlertSeverity;
    type: AlertType;
    title: string;
    message: string;
    triggered_at: Date;
    resolved_at?: Date;
    acknowledged_at?: Date;
    acknowledged_by?: string;
    resolution_notes?: string;
    metadata: Record<string, any>;
}
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type AlertType = 'availability_down' | 'high_response_time' | 'high_error_rate' | 'authentication_failure' | 'rate_limit_exceeded' | 'dependency_failure' | 'configuration_error' | 'resource_exhaustion';
export interface IntegrationManagerStats {
    total_integrations: number;
    active_integrations: number;
    healthy_integrations: number;
    warning_integrations: number;
    critical_integrations: number;
    total_alerts: number;
    unresolved_alerts: number;
    average_health_score: number;
    average_uptime: number;
    integrations_by_category: Record<IntegrationCategory, number>;
    scheduled_tasks_total: number;
    scheduled_tasks_running: number;
}
export declare class IntegrationManagerService {
    private readonly logger;
    private readonly systemIntegrator;
    private managed_integrations;
    private scheduled_tasks;
    private alerts;
    private health_check_intervals;
    private stats;
    constructor(logger: LoggingService, systemIntegrator: SystemIntegratorService);
    /**
     * Initialize manager statistics
     */
    private initializeStats;
    /**
     * Register a managed integration
     */
    registerManagedIntegration(integration_id: string, config: {
        name: string;
        description: string;
        category: IntegrationCategory;
        configuration?: Partial<IntegrationConfiguration>;
    }): Promise<string>;
    catch(error: any): void;
}
//# sourceMappingURL=IntegrationManager.d.ts.map