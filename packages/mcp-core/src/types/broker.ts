/**
 * MCP Broker type definitions
 */

import { MCPResource, MCPTool } from '../interfaces/index.js';
import {
  FilterConfig,
  LoadBalancingStrategy,
  Pagination,
  ServiceStatus,
  SortConfig,
} from './common.js';
import { Skill } from './skill.js';

/**
 * MCP Service information interface
 */
export interface MCPServiceInfo {
  /** Unique service identifier */
  id: string;
  /** Service name */
  name: string;
  /** Service version */
  version: string;
  /** Service endpoint URL */
  endpoint: string;
  /** Service skills */
  skills: Skill[];
  /** Service capabilities */
  capabilities: string[];
  /** Available resources */
  resources: MCPResource[];
  /** Available tools */
  tools: MCPTool[];
  /** Service status */
  status: ServiceStatus;
  /** Service metadata */
  metadata: Record<string, any>;
  /** Registration timestamp */
  registeredAt: Date;
  /** Last heartbeat timestamp */
  lastHeartbeat: Date;
  /** Service health score (0-1) */
  healthScore?: number;
  /** Service tags */
  tags?: string[];
}

/**
 * Service query interface for discovery
 */
export interface ServiceQuery {
  /** Service name filter */
  name?: string;
  /** Skill filter */
  skill?: string;
  /** Capability filter */
  capability?: string;
  /** Resource filter */
  resource?: string;
  /** Tool filter */
  tool?: string;
  /** Status filter */
  status?: ServiceStatus;
  /** Tag filters */
  tags?: string[];
  /** Generic filters */
  filters?: FilterConfig[];
  /** Sort configuration */
  sort?: SortConfig[];
  /** Pagination */
  pagination?: Pagination;
}

/**
 * Service health interface
 */
export interface ServiceHealth {
  /** Service identifier */
  serviceId: string;
  /** Health status */
  status: ServiceStatus;
  /** Service uptime in milliseconds */
  uptime: number;
  /** Average response time in milliseconds */
  responseTime: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Last health check timestamp */
  lastCheck: Date;
  /** Health details */
  details?: Record<string, any>;
  /** Health score (0-1) */
  score: number;
}

/**
 * Routing information interface
 */
export interface RoutingInfo {
  /** Target service ID */
  targetService?: string;
  /** Load balancing strategy */
  loadBalancing?: LoadBalancingStrategy;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry policy */
  retryPolicy?: RetryPolicy;
  /** Routing metadata */
  metadata?: Record<string, any>;
}

/**
 * Retry policy interface (re-exported for convenience)
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay in milliseconds */
  baseDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** Jitter factor (0-1) */
  jitter?: number;
}

/**
 * Routing metrics interface
 */
export interface RoutingMetrics {
  /** Total requests routed */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Requests per second */
  requestsPerSecond: number;
  /** Active connections */
  activeConnections: number;
  /** Service distribution */
  serviceDistribution: Record<string, number>;
  /** Error distribution by service */
  errorDistribution: Record<string, number>;
}

/**
 * Broker configuration interface
 */
export interface BrokerConfig {
  /** Broker name */
  name: string;
  /** Broker version */
  version: string;
  /** Service registry configuration */
  registry: RegistryConfig;
  /** Load balancing configuration */
  loadBalancing: LoadBalancingConfig;
  /** Health check configuration */
  healthCheck: HealthCheckConfig;
  /** Broker options */
  options?: BrokerOptions;
}

/**
 * Registry configuration interface
 */
export interface RegistryConfig {
  /** Registry type */
  type: 'memory' | 'redis' | 'etcd' | 'consul';
  /** Registry connection string */
  connectionString?: string;
  /** Service TTL in seconds */
  serviceTTL: number;
  /** Cleanup interval in seconds */
  cleanupInterval: number;
}

/**
 * Load balancing configuration interface
 */
export interface LoadBalancingConfig {
  /** Default strategy */
  defaultStrategy: LoadBalancingStrategy;
  /** Strategy weights for weighted load balancing */
  weights?: Record<string, number>;
  /** Health check integration */
  useHealthCheck: boolean;
  /** Sticky sessions */
  stickySession?: boolean;
}

/**
 * Health check configuration interface
 */
export interface HealthCheckConfig {
  /** Health check interval in seconds */
  interval: number;
  /** Health check timeout in milliseconds */
  timeout: number;
  /** Failure threshold */
  failureThreshold: number;
  /** Recovery threshold */
  recoveryThreshold: number;
  /** Enable health check */
  enabled: boolean;
}

/**
 * Broker options interface
 */
export interface BrokerOptions {
  /** Enable metrics collection */
  enableMetrics?: boolean;
  /** Metrics collection interval in seconds */
  metricsInterval?: number;
  /** Enable service discovery caching */
  enableDiscoveryCache?: boolean;
  /** Discovery cache TTL in seconds */
  discoveryCacheTTL?: number;
  /** Maximum concurrent requests */
  maxConcurrentRequests?: number;
}

/**
 * Advanced service query interface with capability matching
 */
export interface AdvancedServiceQuery extends ServiceQuery {
  /** Required capabilities that services must have */
  requiredCapabilities?: string[];
  /** Service ID to find compatible services with */
  compatibleWith?: string;
  /** Minimum health score (0-1) */
  minHealthScore?: number;
  /** Maximum age in milliseconds */
  maxAge?: number;
  /** Capability matching mode */
  capabilityMatchMode?: 'all' | 'any' | 'exact';
  /** Include services with partial capability matches */
  includePartialMatches?: boolean;
}

/**
 * Service compatibility analysis result
 */
export interface ServiceCompatibilityResult {
  /** Whether services are compatible */
  compatible: boolean;
  /** Common capabilities between services */
  commonCapabilities: string[];
  /** Capabilities missing in first service */
  missingInA: string[];
  /** Capabilities missing in second service */
  missingInB: string[];
  /** Compatibility score (0-1) */
  compatibilityScore: number;
  /** Detailed compatibility analysis */
  analysis?: {
    /** Resource compatibility */
    resourceCompatibility: boolean;
    /** Tool compatibility */
    toolCompatibility: boolean;
    /** Version compatibility */
    versionCompatibility: boolean;
  };
}

/**
 * Service recommendation options
 */
export interface ServiceRecommendationOptions {
  /** Maximum number of recommendations */
  maxRecommendations?: number;
  /** Include compatible services */
  includeCompatible?: boolean;
  /** Include similar services */
  includeSimilar?: boolean;
  /** Weight recommendations by health score */
  weightByHealth?: boolean;
  /** Weight recommendations by usage patterns */
  weightByUsage?: boolean;
  /** Exclude services with specific tags */
  excludeTags?: string[];
  /** Include only services with specific tags */
  includeTags?: string[];
}
