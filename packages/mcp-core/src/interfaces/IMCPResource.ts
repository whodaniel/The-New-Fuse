/**
 * MCP Resource interfaces for managing resources in the MCP protocol
 */

/**
 * Resource handler callback function type
 */
export type ResourceCallback = (resource: ResourceContent) => void;

/**
 * Resource handler interface for implementing resource access logic
 */
export interface ResourceHandler {
  /**
   * Read content from a resource
   * @param uri Resource URI to read
   * @param params Optional parameters for reading
   * @returns Promise resolving to resource content
   */
  read(uri: string, params?: any): Promise<ResourceContent>;

  /**
   * List resources matching a pattern (optional)
   * @param pattern Optional pattern to filter resources
   * @returns Promise resolving to array of matching resources
   */
  list?(pattern?: string): Promise<MCPResource[]>;

  /**
   * Subscribe to resource changes (optional)
   * @param uri Resource URI to subscribe to
   * @param callback Callback function for resource updates
   * @returns Promise resolving when subscription is established
   */
  subscribe?(uri: string, callback: ResourceCallback): Promise<void>;

  /**
   * Unsubscribe from resource changes (optional)
   * @param uri Resource URI to unsubscribe from
   * @returns Promise resolving when unsubscription is complete
   */
  unsubscribe?(uri: string): Promise<void>;
}

/**
 * MCP Resource definition interface
 */
export interface MCPResource {
  /** Unique resource identifier (URI) */
  uri: string;
  /** Human-readable resource name */
  name: string;
  /** Optional resource description */
  description?: string;
  /** MIME type of the resource content */
  mimeType?: string;
  /** Additional metadata about the resource */
  metadata?: Record<string, any>;
  /** Handler for resource operations */
  handler: ResourceHandler;
  /** Resource access permissions */
  permissions?: ResourcePermissions;
  /** Resource caching configuration */
  caching?: ResourceCaching;
}

/**
 * Resource content interface
 */
export interface ResourceContent {
  /** Resource URI */
  uri: string;
  /** MIME type of the content */
  mimeType: string;
  /** Resource content (string or binary) */
  content: string | Buffer;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Content size in bytes */
  size?: number;
  /** Last modified timestamp */
  lastModified?: Date;
  /** Content encoding */
  encoding?: string;
}

/**
 * Resource permissions interface
 */
export interface ResourcePermissions {
  /** Read permission */
  read: boolean;
  /** Write permission (if applicable) */
  write?: boolean;
  /** Subscribe permission */
  subscribe?: boolean;
  /** Required roles for access */
  requiredRoles?: string[];
  /** Access control list */
  acl?: AccessControlEntry[];
}

/**
 * Access control entry interface
 */
export interface AccessControlEntry {
  /** Principal (user, role, or service) */
  principal: string;
  /** Granted permissions */
  permissions: string[];
  /** Permission type */
  type: 'allow' | 'deny';
}

/**
 * Resource caching configuration interface
 */
export interface ResourceCaching {
  /** Enable caching */
  enabled: boolean;
  /** Cache TTL in seconds */
  ttl?: number;
  /** Cache key strategy */
  keyStrategy?: 'uri' | 'content-hash' | 'custom';
  /** Custom cache key function */
  customKeyFn?: (uri: string, params?: any) => string;
}