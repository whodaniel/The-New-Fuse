/**
 * Agent Discovery System Types
 *
 * Defines interfaces for live agent discovery, capability registration,
 * and dynamic querying of agents in the distributed system.
 */

/**
 * Agent Capability Definition
 */
export interface AgentCapability {
  /** Unique capability name (e.g., "code-review", "security-scan") */
  name: string;

  /** Version of the capability implementation */
  version: string;

  /** Description of what this capability does */
  description: string;

  /** Supported languages/frameworks for this capability */
  languages?: string[];
  frameworks?: string[];

  /** Confidence score for this capability (0-1) */
  confidence: number;

  /** Dependencies required for this capability */
  dependencies?: CapabilityDependency[];

  /** Cost/pricing information */
  pricing?: CapabilityPricing;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Capability Dependency
 */
export interface CapabilityDependency {
  /** Name of the required capability */
  capability: string;

  /** Minimum version required */
  minVersion?: string;

  /** Whether this dependency is optional */
  optional?: boolean;
}

/**
 * Capability Pricing
 */
export interface CapabilityPricing {
  /** Cost per invocation */
  perInvocation?: number;

  /** Cost per minute */
  perMinute?: number;

  /** Cost per token (for LLM capabilities) */
  perToken?: number;

  /** Currency (default: USD) */
  currency?: string;

  /** Free tier limits */
  freeTier?: {
    invocations?: number;
    minutes?: number;
    tokens?: number;
  };
}

/**
 * Agent Health Metrics
 */
export interface AgentHealthMetrics {
  /** Overall health status */
  isHealthy: boolean;

  /** Agent uptime in seconds */
  uptime: number;

  /** Task success rate (0-1) */
  successRate: number;

  /** Average response time in milliseconds */
  avgResponseTime: number;

  /** Current CPU usage percentage (0-100) */
  cpuUsage: number;

  /** Current memory usage percentage (0-100) */
  memoryUsage: number;

  /** Number of active tasks */
  activeTasks: number;

  /** Total tasks completed */
  totalTasks: number;

  /** Total tasks failed */
  failedTasks: number;

  /** Last error message (if any) */
  lastError?: string;

  /** Last error timestamp */
  lastErrorTime?: Date;
}

/**
 * Agent Registration Data
 */
export interface AgentRegistration {
  /** Unique agent identifier */
  agentId: string;

  /** Human-readable agent name */
  name: string;

  /** Agent description */
  description?: string;

  /** Agent type/category */
  type?: string;

  /** Agent groups/tags */
  groups?: string[];

  /** List of capabilities this agent provides */
  capabilities: AgentCapability[];

  /** Agent endpoint URL (if applicable) */
  endpoint?: string;

  /** Agent version */
  version: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Agent Heartbeat Data
 */
export interface AgentHeartbeat {
  /** Agent ID sending the heartbeat */
  agentId: string;

  /** Timestamp of the heartbeat */
  timestamp: Date;

  /** Current health metrics */
  metrics: AgentHealthMetrics;

  /** Current agent status */
  status: AgentStatus;
}

/**
 * Agent Status
 */
export enum AgentStatus {
  ONLINE = 'online',
  BUSY = 'busy',
  IDLE = 'idle',
  OFFLINE = 'offline',
  ERROR = 'error',
  STARTING = 'starting',
  STOPPING = 'stopping',
}

/**
 * Discovered Agent Entry
 */
export interface DiscoveredAgent {
  /** Agent registration data */
  registration: AgentRegistration;

  /** Current status */
  status: AgentStatus;

  /** Current load (0-1) */
  load: number;

  /** Health metrics */
  metrics: AgentHealthMetrics;

  /** Last heartbeat timestamp */
  lastHeartbeat: Date;

  /** When the agent was first registered */
  firstSeen: Date;

  /** Discovery score (relevance to query, 0-1) */
  score?: number;
}

/**
 * Discovery Query
 */
export interface DiscoveryQuery {
  /** Capability name or description to search for */
  capability?: string;

  /** Required languages */
  languages?: string[];

  /** Required frameworks */
  frameworks?: string[];

  /** Agent groups to filter by */
  groups?: string[];

  /** Agent types to filter by */
  types?: string[];

  /** Status filter */
  status?: AgentStatus[];

  /** Maximum CPU usage (0-100) */
  maxCpuUsage?: number;

  /** Maximum memory usage (0-100) */
  maxMemoryUsage?: number;

  /** Maximum load (0-1) */
  maxLoad?: number;

  /** Minimum confidence score (0-1) */
  minConfidence?: number;

  /** Minimum success rate (0-1) */
  minSuccessRate?: number;

  /** Maximum cost per invocation */
  maxCost?: number;

  /** Whether to use semantic search */
  semanticSearch?: boolean;

  /** Maximum number of results */
  limit?: number;

  /** Sort by field */
  sortBy?: 'relevance' | 'load' | 'successRate' | 'responseTime' | 'uptime';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Discovery Query Result
 */
export interface DiscoveryQueryResult {
  /** Matching agents */
  agents: DiscoveredAgent[];

  /** Total number of matches (before limit) */
  total: number;

  /** Query execution time in milliseconds */
  queryTime: number;

  /** Load balancing recommendations */
  recommendations?: LoadBalancingRecommendation[];
}

/**
 * Load Balancing Recommendation
 */
export interface LoadBalancingRecommendation {
  /** Recommended agent ID */
  agentId: string;

  /** Recommendation score (0-1) */
  score: number;

  /** Reason for recommendation */
  reason: string;

  /** Estimated wait time in milliseconds */
  estimatedWaitTime?: number;
}

/**
 * Capability Composition
 */
export interface CapabilityComposition {
  /** Name of the composed capability */
  name: string;

  /** Ordered list of agent IDs to chain */
  agentChain: string[];

  /** Capabilities being composed */
  capabilities: string[];

  /** Total estimated cost */
  totalCost?: number;

  /** Total estimated time in milliseconds */
  estimatedTime?: number;
}

/**
 * Agent Discovery Events
 */
export enum DiscoveryEvent {
  AGENT_REGISTERED = 'agent:registered',
  AGENT_UPDATED = 'agent:updated',
  AGENT_DEREGISTERED = 'agent:deregistered',
  AGENT_HEARTBEAT = 'agent:heartbeat',
  AGENT_STATUS_CHANGED = 'agent:status_changed',
  AGENT_HEALTH_CHANGED = 'agent:health_changed',
}

/**
 * Discovery Event Payload
 */
export interface DiscoveryEventPayload {
  event: DiscoveryEvent;
  agentId: string;
  timestamp: Date;
  data: any;
}
