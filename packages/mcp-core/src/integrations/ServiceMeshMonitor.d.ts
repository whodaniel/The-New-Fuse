/**
 * Service Mesh Monitor
 *
 * Provides comprehensive monitoring capabilities for MCP services in a service mesh,
 * including health monitoring, metrics collection, and performance tracking.
 */
import { EventEmitter } from 'events';
import { ServiceMeshProvider, ServiceMeshMetrics, ServiceMeshIntegrationResult } from './MCPServiceMesh';
import { ServiceHealth } from '../types/broker';
/**
 * Monitoring configuration
 */
export interface ServiceMeshMonitorConfig {
    /** Health check interval in seconds */
    healthCheckInterval: number;
    /** Metrics collection interval in seconds */
    metricsInterval: number;
    /** Health check timeout in milliseconds */
    healthCheckTimeout: number;
    /** Maximum number of consecutive failures before marking unhealthy */
    maxConsecutiveFailures: number;
    /** Enable detailed performance monitoring */
    enablePerformanceMonitoring: boolean;
    /** Enable alerting */
    enableAlerting: boolean;
    /** Alert thresholds */
    alertThresholds: AlertThresholds;
    /** Metrics retention period in seconds */
    metricsRetention: number;
}
/**
 * Alert thresholds configuration
 */
export interface AlertThresholds {
    /** CPU utilization threshold (0-1) */
    cpuThreshold: number;
    /** Memory utilization threshold (0-1) */
    memoryThreshold: number;
    /** Error rate threshold (0-1) */
    errorRateThreshold: number;
    /** Response time threshold in milliseconds */
    responseTimeThreshold: number;
    /** Minimum health score threshold (0-1) */
    healthScoreThreshold: number;
}
/**
 * Service monitoring data
 */
export interface ServiceMonitoringData {
    /** Service ID */
    serviceId: string;
    /** Current health status */
    health: ServiceHealth;
    /** Latest metrics */
    metrics: ServiceMeshMetrics;
    /** Historical metrics */
    metricsHistory: ServiceMeshMetrics[];
    /** Consecutive failure count */
    consecutiveFailures: number;
    /** Last successful health check */
    lastSuccessfulCheck: Date;
    /** Monitoring start time */
    monitoringStarted: Date;
    /** Alert status */
    alertStatus: AlertStatus;
}
/**
 * Alert status
 */
export interface AlertStatus {
    /** Whether service is in alert state */
    inAlert: boolean;
    /** Active alerts */
    activeAlerts: Alert[];
    /** Last alert time */
    lastAlertTime?: Date;
    /** Alert suppression until */
    suppressedUntil?: Date;
}
/**
 * Alert definition
 */
export interface Alert {
    /** Alert ID */
    id: string;
    /** Alert type */
    type: 'health' | 'performance' | 'availability' | 'resource';
    /** Alert severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Alert message */
    message: string;
    /** Alert details */
    details: Record<string, any>;
    /** Alert timestamp */
    timestamp: Date;
    /** Metric that triggered the alert */
    triggerMetric?: {
        name: string;
        value: number;
        threshold: number;
    };
}
/**
 * Monitoring statistics
 */
export interface MonitoringStatistics {
    /** Total services monitored */
    totalServices: number;
    /** Healthy services count */
    healthyServices: number;
    /** Unhealthy services count */
    unhealthyServices: number;
    /** Services in alert state */
    servicesInAlert: number;
    /** Total health checks performed */
    totalHealthChecks: number;
    /** Failed health checks */
    failedHealthChecks: number;
    /** Average response time across all services */
    averageResponseTime: number;
    /** Total metrics collected */
    totalMetricsCollected: number;
    /** Monitoring uptime */
    monitoringUptime: number;
    /** Last statistics update */
    lastUpdate: Date;
}
/**
 * Service Mesh Monitor implementation
 */
export declare class ServiceMeshMonitor extends EventEmitter {
    private provider;
    private config;
    private monitoredServices;
    private healthCheckInterval?;
    private metricsCollectionInterval?;
    private isRunning;
    private statistics;
    constructor(provider: ServiceMeshProvider, config: ServiceMeshMonitorConfig);
    /**
     * Initialize monitoring statistics
     */
    private initializeStatistics;
    /**
     * Start monitoring services
     */
    startMonitoring(): Promise<ServiceMeshIntegrationResult>;
    /**
     * Stop monitoring services
     */
    stopMonitoring(): Promise<ServiceMeshIntegrationResult>;
    /**
     * Add service to monitoring
     */
    addService(serviceId: string): Promise<ServiceMeshIntegrationResult>;
    /**
     * Remove service from monitoring
     */
    removeService(serviceId: string): Promise<ServiceMeshIntegrationResult>;
    /**
     * Get service monitoring data
     */
    getServiceMonitoringData(serviceId: string): ServiceMonitoringData | undefined;
    /**
     * Get all monitored services
     */
    getMonitoredServices(): string[];
    /**
     * Get monitoring statistics
     */
    getStatistics(): MonitoringStatistics;
    /**
     * Get services by health status
     */
    getServicesByHealthStatus(status: 'online' | 'offline' | 'degraded'): string[];
    /**
     * Get services in alert state
     */
    getServicesInAlert(): Array<{
        serviceId: string;
        alerts: Alert[];
    }>;
    /**
     * Perform health checks for all monitored services
     */
    private performHealthChecks;
    /**
     * Perform health check for a specific service
     */
    private performHealthCheck;
    /**
     * Collect metrics for all monitored services
     */
    private collectMetrics;
    /**
     * Collect metrics for a specific service
     */
    private collectServiceMetrics;
    /**
     * Check for health-related alerts
     */
    private checkHealthAlerts;
    /**
     * Check for performance-related alerts
     */
    private checkPerformanceAlerts;
    /**
     * Process alerts for a service
     */
    private processAlerts;
    /**
     * Update monitoring statistics
     */
    private updateStatistics;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=ServiceMeshMonitor.d.ts.map