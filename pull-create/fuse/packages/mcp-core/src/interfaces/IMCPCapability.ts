/**
 * MCP Capability interfaces for managing capabilities in the MCP protocol
 */

/**
 * MCP Capability definition interface
 */
export interface MCPCapability {
  /** Unique capability name */
  name: string;
  /** Capability version */
  version: string;
  /** Human-readable capability description */
  description: string;
  /** Supported methods for this capability */
  methods: string[];
  /** Supported notifications (optional) */
  notifications?: string[];
  /** Whether this is an experimental capability */
  experimental?: boolean;
  /** Capability metadata */
  metadata?: CapabilityMetadata;
  /** Capability dependencies */
  dependencies?: CapabilityDependency[];
}

/**
 * Capability metadata interface
 */
export interface CapabilityMetadata {
  /** Capability author */
  author?: string;
  /** Capability documentation URL */
  documentation?: string;
  /** Capability license */
  license?: string;
  /** Capability tags */
  tags?: string[];
  /** Minimum required MCP version */
  minMCPVersion?: string;
  /** Maximum supported MCP version */
  maxMCPVersion?: string;
}

/**
 * Capability dependency interface
 */
export interface CapabilityDependency {
  /** Name of the required capability */
  name: string;
  /** Required version or version range */
  version: string;
  /** Whether this dependency is optional */
  optional?: boolean;
  /** Reason for the dependency */
  reason?: string;
}

/**
 * Capability status interface
 */
export interface CapabilityStatus {
  /** Capability name */
  name: string;
  /** Current status */
  status: 'available' | 'unavailable' | 'deprecated' | 'experimental';
  /** Status message */
  message?: string;
  /** Last status check timestamp */
  lastCheck: Date;
  /** Performance metrics */
  metrics?: CapabilityMetrics;
}

/**
 * Capability metrics interface
 */
export interface CapabilityMetrics {
  /** Number of times capability was used */
  usageCount: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Last usage timestamp */
  lastUsed?: Date;
  /** Error count */
  errorCount: number;
}

/**
 * Capability registry interface
 */
export interface CapabilityRegistry {
  /**
   * Register a capability
   * @param capability The capability to register
   */
  register(capability: MCPCapability): Promise<void>;

  /**
   * Unregister a capability
   * @param name The name of the capability to unregister
   */
  unregister(name: string): Promise<void>;

  /**
   * Get a capability by name
   * @param name The capability name
   * @returns The capability if found, null otherwise
   */
  get(name: string): Promise<MCPCapability | null>;

  /**
   * List all registered capabilities
   * @returns Array of all registered capabilities
   */
  list(): Promise<MCPCapability[]>;

  /**
   * Check if a capability is available
   * @param name The capability name
   * @returns True if capability is available, false otherwise
   */
  isAvailable(name: string): Promise<boolean>;

  /**
   * Get capability status
   * @param name The capability name
   * @returns Capability status information
   */
  getStatus(name: string): Promise<CapabilityStatus>;

  /**
   * Update capability metrics
   * @param name The capability name
   * @param metrics Updated metrics
   */
  updateMetrics(name: string, metrics: Partial<CapabilityMetrics>): Promise<void>;
}