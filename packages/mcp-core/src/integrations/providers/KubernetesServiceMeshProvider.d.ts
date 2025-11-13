/**
 * Kubernetes Service Mesh Provider
 *
 * Implementation of ServiceMeshProvider for Kubernetes-based service meshes
 * (Istio, Linkerd, Consul Connect, etc.)
 */
import { ServiceMeshProvider, ServiceMeshRegistration, ServiceMeshQuery, ServiceMeshMetrics, ServiceScalingConfig, ScalingEvent } from '../MCPServiceMesh';
import { ServiceHealth } from '../../types/broker';
/**
 * Kubernetes configuration
 */
export interface KubernetesConfig {
    /** Kubernetes API server URL */
    apiServer: string;
    /** Namespace for MCP services */
    namespace: string;
    /** Service account token */
    token?: string;
    /** Certificate authority data */
    ca?: string;
    /** Service mesh type */
    meshType: 'istio' | 'linkerd' | 'consul' | 'generic';
    /** Labels to apply to all services */
    defaultLabels?: Record<string, string>;
    /** Annotations to apply to all services */
    defaultAnnotations?: Record<string, string>;
}
/**
 * Kubernetes service mesh provider implementation
 */
export declare class KubernetesServiceMeshProvider implements ServiceMeshProvider {
    readonly name = "kubernetes";
    readonly version = "1.0.0";
    private config;
    private kubeClient;
    private registeredServices;
    constructor(config: KubernetesConfig);
    /**
     * Initialize Kubernetes client
     */
    private initializeKubernetesClient;
    /**
     * Register service with Kubernetes service mesh
     */
    registerService(registration: ServiceMeshRegistration): Promise<string>;
    /**
     * Unregister service from Kubernetes service mesh
     */
    unregisterService(serviceId: string): Promise<void>;
    /**
     * Discover services in Kubernetes service mesh
     */
    discoverServices(query: ServiceMeshQuery): Promise<ServiceMeshRegistration[]>;
    /**
     * Get service health from Kubernetes
     */
    getServiceHealth(serviceId: string): Promise<ServiceHealth>;
    /**
     * Update service health in Kubernetes
     */
    updateServiceHealth(serviceId: string, health: ServiceHealth): Promise<void>;
    /**
     * Get service metrics from Kubernetes
     */
    getServiceMetrics(serviceId: string): Promise<ServiceMeshMetrics>;
    /**
     * Configure service scaling in Kubernetes
     */
    configureScaling(serviceId: string, config: ServiceScalingConfig): Promise<void>;
    /**
     * Get scaling status from Kubernetes
     */
    getScalingStatus(serviceId: string): Promise<{
        currentInstances: number;
        desiredInstances: number;
        scalingEvents: ScalingEvent[];
    }>;
    /**
     * Check if Kubernetes provider is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Create Kubernetes Service definition
     */
    private createKubernetesServiceDefinition;
    /**
     * Create Kubernetes Deployment definition
     */
    private createKubernetesDeploymentDefinition;
    /**
     * Get service mesh specific annotations
     */
    private getServiceMeshAnnotations;
    /**
     * Apply service mesh specific configuration
     */
    private applyServiceMeshConfig;
    /**
     * Create HPA definition for scaling
     */
    private createHPADefinition;
    /**
     * Build label selector from query
     */
    private buildLabelSelector;
    /**
     * Convert Kubernetes service to ServiceMeshRegistration
     */
    private convertKubernetesServiceToRegistration;
    /**
     * Mock Kubernetes service for testing
     */
    private mockKubernetesService;
    /**
     * Mock Kubernetes deployment for testing
     */
    private mockKubernetesDeployment;
    /**
     * Mock Kubernetes metrics for testing
     */
    private mockKubernetesMetrics;
    /**
     * Create mock Kubernetes service from registration
     */
    private createMockKubernetesServiceFromRegistration;
    /**
     * Check if service matches selector
     */
    private matchesSelector;
}
//# sourceMappingURL=KubernetesServiceMeshProvider.d.ts.map