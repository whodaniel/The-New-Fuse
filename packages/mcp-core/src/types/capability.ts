/**
 * MCP Capability type definitions
 */

// Re-export capability interfaces from the interfaces module
export type {
  MCPCapability,
  CapabilityMetadata,
  CapabilityDependency,
  CapabilityStatus,
  CapabilityMetrics,
  CapabilityRegistry
} from '../interfaces/IMCPCapability.js';

/**
 * Capability category enumeration
 */
export enum CapabilityCategory {
  CORE = 'core',
  RESOURCE = 'resource',
  TOOL = 'tool',
  COMMUNICATION = 'communication',
  SECURITY = 'security',
  MONITORING = 'monitoring',
  EXTENSION = 'extension'
}

/**
 * Capability lifecycle state enumeration
 */
export enum CapabilityLifecycleState {
  DRAFT = 'draft',
  PROPOSED = 'proposed',
  ACCEPTED = 'accepted',
  DEPRECATED = 'deprecated',
  RETIRED = 'retired'
}

/**
 * Capability compatibility level enumeration
 */
export enum CapabilityCompatibilityLevel {
  FULL = 'full',
  PARTIAL = 'partial',
  NONE = 'none'
}

/**
 * Capability discovery result interface
 */
export interface CapabilityDiscoveryResult {
  /** Discovered capabilities */
  capabilities: import('../interfaces/IMCPCapability').MCPCapability[];
  /** Total count */
  totalCount: number;
  /** Discovery timestamp */
  discoveredAt: Date;
  /** Discovery source */
  source: string;
  /** Discovery metadata */
  metadata?: Record<string, any>;
}

/**
 * Capability compatibility check result interface
 */
export interface CapabilityCompatibilityResult {
  /** Capability name */
  capabilityName: string;
  /** Compatibility level */
  level: CapabilityCompatibilityLevel;
  /** Compatible version */
  compatibleVersion?: string;
  /** Compatibility issues */
  issues: string[];
  /** Suggested actions */
  suggestions: string[];
}

/**
 * Capability negotiation interface
 */
export interface CapabilityNegotiation {
  /** Negotiation ID */
  id: string;
  /** Client capabilities */
  clientCapabilities: import('../interfaces/IMCPCapability').MCPCapability[];
  /** Server capabilities */
  serverCapabilities: import('../interfaces/IMCPCapability').MCPCapability[];
  /** Negotiated capabilities */
  negotiatedCapabilities: import('../interfaces/IMCPCapability').MCPCapability[];
  /** Negotiation status */
  status: 'pending' | 'completed' | 'failed';
  /** Negotiation timestamp */
  timestamp: Date;
  /** Negotiation metadata */
  metadata?: Record<string, any>;
}

/**
 * Capability announcement interface
 */
export interface CapabilityAnnouncement {
  /** Announcement ID */
  id: string;
  /** Announced capability */
  capability: import('../interfaces/IMCPCapability').MCPCapability;
  /** Announcement type */
  type: 'added' | 'updated' | 'removed' | 'deprecated';
  /** Announcer identifier */
  announcer: string;
  /** Announcement timestamp */
  timestamp: Date;
  /** Announcement message */
  message?: string;
  /** Announcement metadata */
  metadata?: Record<string, any>;
}

/**
 * Capability search criteria interface
 */
export interface CapabilitySearchCriteria {
  /** Capability name pattern */
  name?: string;
  /** Capability category */
  category?: CapabilityCategory;
  /** Capability version */
  version?: string;
  /** Capability methods */
  methods?: string[];
  /** Capability tags */
  tags?: string[];
  /** Lifecycle state */
  lifecycleState?: CapabilityLifecycleState;
  /** Experimental flag */
  experimental?: boolean;
}

/**
 * Capability validation result interface
 */
export interface CapabilityValidationResult {
  /** Whether capability is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Normalized capability */
  normalizedCapability?: import('../interfaces/IMCPCapability').MCPCapability;
}

/**
 * Capability usage tracking interface
 */
export interface CapabilityUsageTracking {
  /** Capability name */
  capabilityName: string;
  /** Usage count */
  usageCount: number;
  /** Unique users */
  uniqueUsers: number;
  /** Usage by method */
  methodUsage: Record<string, number>;
  /** Usage trends */
  trends: CapabilityUsageTrend[];
  /** Last usage timestamp */
  lastUsed?: Date;
}

/**
 * Capability usage trend interface
 */
export interface CapabilityUsageTrend {
  /** Time period */
  period: Date;
  /** Usage count for the period */
  count: number;
  /** Unique users for the period */
  uniqueUsers: number;
}