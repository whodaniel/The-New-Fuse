/**
 * MCP Service Mesh Integration Implementation
 *
 * This class provides integration between MCP services and service mesh infrastructure
 * for service discovery, load balancing, health monitoring, and automatic scaling.
 */
import { EventEmitter } from 'events';
import { IMCPServiceMesh, ServiceMeshRegistration, ServiceMeshQuery, ServiceMeshMetrics, ServiceScalingConfig, ServiceMeshIntegrationResult, AutoDiscoveryConfig, ServiceMeshIntegrationStatus, ScalingEvent } from '../interfaces/IMCPServiceMesh';
import { MCPServiceInfo, ServiceHealth } from '../types/broker';
export type { ServiceMeshRegistration, ServiceMeshQuery, ServiceMeshMetrics, ServiceScalingConfig, ServiceMeshIntegrationResult, ScalingEvent, ScalingPolicy } from '../interfaces/IMCPServiceMesh';
/**
 * Service mesh provider interface for different mesh implementations
 */
export interface ServiceMeshProvider {
    /** Provider name */
    name: string;
    /** Provider version */
    version: string;
    /** Register service with the mesh */
    registerService(registration: ServiceMeshRegistration): Promise<string>;
    /** Unregister service from the mesh */
    unregisterService(serviceId: string): Promise<void>;
    /** Discover services in the mesh */
    discoverServices(query: ServiceMeshQuery): Promise<ServiceMeshRegistration[]>;
    /** Get service health */
    getServiceHealth(serviceId: string): Promise<ServiceHealth>;
    /** Update service health */
    updateServiceHealth(serviceId: string, health: ServiceHealth): Promise<void>;
    /** Get service metrics */
    getServiceMetrics(serviceId: string): Promise<ServiceMeshMetrics>;
    /** Configure service scaling */
    configureScaling(serviceId: string, config: ServiceScalingConfig): Promise<void>;
    /** Get scaling status */
    getScalingStatus(serviceId: string): Promise<{
        currentInstances: number;
        desiredInstances: number;
        scalingEvents: ScalingEvent[];
    }>;
    /** Check if provider is available */
    isAvailable(): Promise<boolean>;
}
/**
 * Service mesh configuration
 */
export interface ServiceMeshConfig {
    /** Service mesh provider */
    provider: ServiceMeshProvider;
    /** Auto discovery configuration */
    autoDiscovery?: AutoDiscoveryConfig;
    /** Health monitoring configuration */
    healthMonitoring?: {
        enabled: boolean;
        interval: number;
        timeout: number;
    };
    /** Metrics collection configuration */
    metricsCollection?: {
        enabled: boolean;
        interval: number;
        retention: number;
    };
    /** Scaling configuration */
    scaling?: {
        enabled: boolean;
        defaultConfig: Partial<ServiceScalingConfig>;
    };
}
/**
 * MCP Service Mesh Integration implementation
 */
export declare class MCPServiceMesh extends EventEmitter implements IMCPServiceMesh {
    private provider;
    private config;
    private registeredServices;
    private healthMonitorInterval?;
    private metricsCollectionInterval?;
    private autoDiscoveryEnabled;
    private integrationStatus;
    constructor(config: ServiceMeshConfig);
    /**
     * Initialize integration status
     */
    private initializeStatus;
    /**
     * Set up event handlers
     */
    private setupEventHandlers;
    /**
     * Register an MCP service with the service mesh
     */
    registerService(mcpService: MCPServiceInfo, meshConfig: ServiceMeshRegistration): Promise<ServiceMeshIntegrationResult>;
    /**
     * Unregister an MCP service from the service mesh
     */
    unregisterService(serviceId: string): Promise<ServiceMeshIntegrationResult>;
    /**
     * Discover services in the service mesh
     */
    discoverServices(query: ServiceMeshQuery): Promise<ServiceMeshRegistration[]>;
    /**
     * Get service health from the service mesh
     */
    getServiceHealth(serviceId: string): Promise<ServiceHealth>;
    /**
     * Update service health status in the service mesh
     */
    updateServiceHealth(serviceId: string, health: ServiceHealth): Promise<ServiceMeshIntegrationResult>;
    /**
     * Get service metrics from the service mesh
     */
    getServiceMetrics(serviceId: string): Promise<ServiceMeshMetrics>;
    /**
     * Configure service scaling
     */
    configureScaling(serviceId: string, scalingConfig: ServiceScalingConfig): Promise<ServiceMeshIntegrationResult>;
    /**
     * Get current service scaling status
     */
    getScalingStatus(serviceId: string): Promise<{
        currentInstances: number;
        desiredInstances: number;
        scalingEvents: ScalingEvent[];
    }>;
    /**
     * Enable automatic service discovery integration
     */
    enableAutoDiscovery(config: AutoDiscoveryConfig): Promise<ServiceMeshIntegrationResult>;
    /**
     * Disable automatic service discovery integration
     */
    disableAutoDiscovery(): Promise<ServiceMeshIntegrationResult>;
    /**
     * Get service mesh integration status
     */
    getIntegrationStatus(): Promise<ServiceMeshIntegrationStatus>;
    /**
     * Start health monitoring for a service
     */
    private startHealthMonitoring;
    /**
     * Stop health monitoring for a service
     */
    private stopHealthMonitoring;
    /**
     * Start auto-discovery monitoring
     */
    private startAutoDiscoveryMonitoring;
    /**
     * Stop auto-discovery monitoring
     */
    private stopAutoDiscoveryMonitoring;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=MCPServiceMesh.d.ts.map