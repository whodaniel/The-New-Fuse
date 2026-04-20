/**
 * MCP Resource type definitions
 */

// Re-export resource interfaces from the interfaces module
export type {
  ResourceHandler,
  MCPResource,
  ResourceContent,
  ResourcePermissions,
AccessControlEntry,
  ResourceCaching,
  ResourceCallback
} from '../interfaces/IMCPResource.js';

/**
 * Resource type enumeration
 */
export enum ResourceType {
  FILE = 'file',
  DATABASE = 'database',
  API = 'api',
  MEMORY = 'memory',
  STREAM = 'stream',
  CUSTOM = 'custom'
}

/**
 * Resource access mode enumeration
 */
export enum ResourceAccessMode {
  READ_ONLY = 'read_only',
  WRITE_ONLY = 'write_only',
  READ_WRITE = 'read_write',
  APPEND_ONLY = 'append_only'
}

/**
 * Resource status enumeration
 */
export enum ResourceStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  LOCKED = 'locked',
  ERROR = 'error'
}

/**
 * Resource discovery result interface
 */
export interface ResourceDiscoveryResult {
  /** Discovered resources */
  resources: import('../interfaces/IMCPResource').MCPResource[];
  /** Total count */
  totalCount: number;
  /** Discovery timestamp */
  discoveredAt: Date;
  /** Discovery metadata */
  metadata?: Record<string, any>;
}

/**
 * Resource access log entry interface
 */
export interface ResourceAccessLog {
  /** Log entry ID */
  id: string;
  /** Resource URI */
  resourceUri: string;
  /** Access type */
  accessType: 'read' | 'write' | 'subscribe' | 'unsubscribe';
  /** User/service that accessed the resource */
  accessor: string;
  /** Access timestamp */
  timestamp: Date;
  /** Access result */
  result: 'success' | 'failure' | 'denied';
  /** Error message if any */
  error?: string;
  /** Access metadata */
  metadata?: Record<string, any>;
}

/**
 * Resource metrics interface
 */
export interface ResourceMetrics {
  /** Resource URI */
  resourceUri: string;
  /** Total access count */
  totalAccesses: number;
  /** Read access count */
  readAccesses: number;
  /** Write access count */
  writeAccesses: number;
  /** Subscribe count */
  subscriptions: number;
  /** Average access time in milliseconds */
  averageAccessTime: number;
  /** Cache hit rate (0-1) */
  cacheHitRate?: number;
  /** Last access timestamp */
  lastAccess?: Date;
  /** Error count */
  errorCount: number;
}

/**
 * Resource subscription interface
 */
export interface ResourceSubscription {
  /** Subscription ID */
  id: string;
  /** Resource URI */
  resourceUri: string;
  /** Subscriber identifier */
  subscriber: string;
  /** Subscription callback */
  callback: import('../interfaces/IMCPResource').ResourceCallback;
  /** Subscription timestamp */
  subscribedAt: Date;
  /** Subscription filters */
  filters?: ResourceSubscriptionFilter[];
  /** Subscription metadata */
  metadata?: Record<string, any>;
}

/**
 * Resource subscription filter interface
 */
export interface ResourceSubscriptionFilter {
  /** Filter type */
  type: 'content' | 'metadata' | 'size' | 'modified';
  /** Filter operator */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'matches';
  /** Filter value */
  value: any;
}

/**
 * Resource configuration interface
 */
export interface ResourceConfig {
  /** Resource type */
  type: ResourceType;
  /** Access mode */
  accessMode: ResourceAccessMode;
  /** Enable versioning */
  versioning?: boolean;
  /** Enable compression */
  compression?: boolean;
  /** Enable encryption */
  encryption?: boolean;
  /** Backup configuration */
  backup?: ResourceBackupConfig;
  /** Validation configuration */
  validation?: ResourceValidationConfig;
}

/**
 * Resource backup configuration interface
 */
export interface ResourceBackupConfig {
  /** Enable backup */
  enabled: boolean;
  /** Backup interval in seconds */
  interval?: number;
  /** Backup retention count */
  retentionCount?: number;
  /** Backup location */
  location?: string;
}

/**
 * Resource validation configuration interface
 */
export interface ResourceValidationConfig {
  /** Enable validation */
  enabled: boolean;
  /** Validation schema */
  schema?: any;
  /** Custom validation function */
  customValidator?: (content: any) => boolean;
}