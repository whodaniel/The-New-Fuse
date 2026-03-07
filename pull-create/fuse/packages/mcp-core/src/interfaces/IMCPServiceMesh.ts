/**
 * MCP Service Mesh Integration Interface
 * 
 * This interface defines the contract for integrating MCP services with service mesh
 * infrastructure for service discovery, load balancing, health monitoring, and scaling.
 */

import { MCPServiceInfo, ServiceHealth, RoutingMetrics } from '../types/broker';

/**
 * Service mesh registration information
 */
export interface ServiceMeshRegistration {
  /** Service ID in the mesh */
  serviceId: string;
  /** Service name */
  serviceName: string;
  /** Service version */
  version: string;
  /** Service endpoints */
  endpoints: ServiceEndpoint[];
  /** Service metadata for mesh */
  metadata: Record<string, any>;
  /** Health check configuration */
  healthCheck: ServiceMeshHealthCheck;
  /** Load balancing configuration */
  loadBalancing: ServiceMeshLoadBalancing;
  /** Service tags */
  tags: string[];
}

/**
 * Service endpoint information
 */
export interface ServiceEndpoint {
  /** Endpoint address */
  address: string;
  /** Endpoint port */
  port: number;
  /** Protocol (http, https, grpc, etc.) */
  protocol: string;
  /** Endpoint weight for load balancing */
  weight?: number;
  /** Endpoint metadata */
  metadata?: Record<string, any>;
}

/**
 * Service mesh health check configuration
 */
export interface ServiceMeshHealthCheck {
  /** Health check path */
  path: string;
  /** Health check interval in seconds */
  interval: number;
  /** Health check timeout in milliseconds */
  timeout: number;
  /** Failure threshold */
  failureThreshold: number;
  /** Success threshold */
  successThreshold: number;
  /** Health check method */
  method?: 'GET' | 'POST' | 'HEAD';
  /** Expected status codes */
  expectedStatusCodes?: number[];
}

/**
 * Service mesh load balancing configuration
 */
export interface ServiceMeshLoadBalancing {
  /** Load balancing algorithm */
  algorithm: 'round_robin' | 'least_connections' | 'weighted' | 'ip_hash' | 'random';
  /** Session affinity */
  sessionAffinity?: boolean;
  /** Health check integration */
  healthCheckEnabled: boolean;
  /** Circuit breaker configuration */
  circuitBreaker?: CircuitBreakerConfig;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Failure threshold */
  failureThreshold: number;
  /** Recovery timeout in milliseconds */
  recoveryTimeout: number;
  /** Half-open max calls */
  halfOpenMaxCalls: number;
  /** Minimum request threshold */
  minRequestThreshold: number;
}

/**
 * Service mesh discovery query
 */
export interface ServiceMeshQuery {
  /** Service name pattern */
  serviceName?: string;
  /** Service tags */
  tags?: string[];
  /** Health status filter */
  healthStatus?: 'healthy' | 'unhealthy' | 'warning';
  /** Namespace filter */
  namespace?: string;
  /** Version filter */
  version?: string;
  /** Metadata filters */
  metadata?: Record<string, any>;
}

/**
 * Service mesh metrics
 */
export interface ServiceMeshMetrics {
  /** Service ID */
  serviceId: string;
  /** Request metrics */
  requests: {
    /** Total requests */
    total: number;
    /** Successful requests */
    successful: number;
    /** Failed requests */
    failed: number;
    /** Requests per second */
    rps: number;
  };
  /** Response time metrics */
  responseTime: {
    /** Average response time in milliseconds */
    average: number;
    /** 50th percentile */
    p50: number;
    /** 95th percentile */
    p95: number;
    /** 99th percentile */
    p99: number;
  };
  /** Connection metrics */
  connections: {
    /** Active connections */
    active: number;
    /** Total connections */
    total: number;
    /** Connection errors */
    errors: number;
  };
  /** Resource utilization */
  resources: {
    /** CPU utilization (0-1) */
    cpu: number;
    /** Memory utilization (0-1) */
    memory: number;
    /** Network I/O bytes per second */
    networkIO: number;
  };
  /** Timestamp */
  timestamp: Date;
}

/**
 * Service scaling configuration
 */
export interface ServiceScalingConfig {
  /** Minimum instances */
  minInstances: number;
  /** Maximum instances */
  maxInstances: number;
  /** Target CPU utilization (0-1) */
  targetCPU?: number;
  /** Target memory utilization (0-1) */
  targetMemory?: number;
  /** Target requests per second */
  targetRPS?: number;
  /** Scale up cooldown in seconds */
  scaleUpCooldown: number;
  /** Scale down cooldown in seconds */
  scaleDownCooldown: number;
  /** Scaling policies */
  policies?: ScalingPolicy[];
}

/**
 * Scaling policy
 */
export interface ScalingPolicy {
  /** Policy name */
  name: string;
  /** Metric to monitor */
  metric: 'cpu' | 'memory' | 'rps' | 'connections' | 'custom';
  /** Target value */
  targetValue: number;
  /** Scale up threshold */
  scaleUpThreshold: number;
  /** Scale down threshold */
  scaleDownThreshold: number;
  /** Custom metric query (for custom metrics) */
  customMetricQuery?: string;
}

/**
 * Service mesh integration result
 */
export interface ServiceMeshIntegrationResult {
  /** Whether integration was successful */
  success: boolean;
  /** Service mesh service ID */
  meshServiceId?: string;
  /** Integration message */
  message: string;
  /** Integration metadata */
  metadata?: Record<string, any>;
  /** Error details if failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Main service mesh integration interface
 */
export interface IMCPServiceMesh {
  /**
   * Register an MCP service with the service mesh
   */
  registerService(
    mcpService: MCPServiceInfo,
    meshConfig: ServiceMeshRegistration
  ): Promise<ServiceMeshIntegrationResult>;

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
  updateServiceHealth(
    serviceId: string,
    health: ServiceHealth
  ): Promise<ServiceMeshIntegrationResult>;

  /**
   * Get service metrics from the service mesh
   */
  getServiceMetrics(serviceId: string): Promise<ServiceMeshMetrics>;

  /**
   * Configure service scaling
   */
  configureScaling(
    serviceId: string,
    scalingConfig: ServiceScalingConfig
  ): Promise<ServiceMeshIntegrationResult>;

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
}

/**
 * Scaling event
 */
export interface ScalingEvent {
  /** Event timestamp */
  timestamp: Date;
  /** Event type */
  type: 'scale_up' | 'scale_down';
  /** Previous instance count */
  previousInstances: number;
  /** New instance count */
  newInstances: number;
  /** Reason for scaling */
  reason: string;
  /** Trigger metric */
  triggerMetric?: {
    name: string;
    value: number;
    threshold: number;
  };
}

/**
 * Auto discovery configuration
 */
export interface AutoDiscoveryConfig {
  /** Enable automatic registration */
  autoRegister: boolean;
  /** Enable automatic deregistration */
  autoDeregister: boolean;
  /** Service name prefix */
  serviceNamePrefix?: string;
  /** Default tags to apply */
  defaultTags?: string[];
  /** Default metadata */
  defaultMetadata?: Record<string, any>;
  /** Health check defaults */
  defaultHealthCheck?: Partial<ServiceMeshHealthCheck>;
  /** Load balancing defaults */
  defaultLoadBalancing?: Partial<ServiceMeshLoadBalancing>;
}

/**
 * Service mesh integration status
 */
export interface ServiceMeshIntegrationStatus {
  /** Whether integration is enabled */
  enabled: boolean;
  /** Service mesh type */
  meshType: string;
  /** Connected services count */
  connectedServices: number;
  /** Integration health */
  health: 'healthy' | 'degraded' | 'unhealthy';
  /** Last sync timestamp */
  lastSync: Date;
  /** Integration metrics */
  metrics: {
    /** Total registrations */
    totalRegistrations: number;
    /** Failed registrations */
    failedRegistrations: number;
    /** Active health checks */
    activeHealthChecks: number;
    /** Scaling events in last hour */
    recentScalingEvents: number;
  };
  /** Configuration */
  config: {
    /** Auto discovery enabled */
    autoDiscoveryEnabled: boolean;
    /** Health monitoring enabled */
    healthMonitoringEnabled: boolean;
    /** Scaling enabled */
    scalingEnabled: boolean;
  };
}