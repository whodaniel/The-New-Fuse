/**
 * Resource Manager for MCP resource discovery, access control, and caching
 */

import { 
  MCPResource, 
  ResourceHandler, 
  ResourceContent, 
  ResourcePermissions, 
  AccessControlEntry,
  ResourceCaching 
} from '../interfaces/IMCPResource.js';
import { MCPErrorClass, MCPErrorCode, ErrorCategory, ErrorSeverity } from '../types/error.js';

/**
 * Resource discovery query interface
 */
export interface ResourceQuery {
  /** URI pattern to match */
  uriPattern?: string;
  /** Name pattern to match */
  namePattern?: string;
  /** MIME type filter */
  mimeType?: string;
  /** Metadata filters */
  metadata?: Record<string, any>;
  /** Required permissions */
  requiredPermissions?: string[];
  /** Maximum results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort criteria */
  sortBy?: 'name' | 'uri' | 'lastModified' | 'size';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Access control context for resource operations
 */
export interface AccessContext {
  /** User/service identifier */
  principal: string;
  /** User roles */
  roles: string[];
  /** Additional permissions */
  permissions: string[];
  /** Request metadata */
  metadata?: Record<string, any>;
}

/**
 * Resource cache entry interface
 */
interface CacheEntry {
  content: ResourceContent;
  timestamp: Date;
  ttl: number;
  accessCount: number;
  lastAccessed: Date;
}

/**
 * Resource Manager class for centralized resource management
 */
export class ResourceManager {
  private resources: Map<string, MCPResource> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private accessLog: Array<{
    principal: string;
    resource: string;
    operation: string;
    timestamp: Date;
    success: boolean;
    error?: string;
  }> = [];

  /**
   * Register a resource with the manager
   */
  registerResource(resource: MCPResource): void {
    this.validateResource(resource);
    this.resources.set(resource.uri, resource);
  }

  /**
   * Unregister a resource from the manager
   */
  unregisterResource(uri: string): boolean {
    const removed = this.resources.delete(uri);
    if (removed) {
      // Clear cache entries for this resource
      this.clearResourceCache(uri);
    }
    return removed;
  }

  /**
   * Discover resources based on query criteria
   */
  async discoverResources(
    query: ResourceQuery = {},
    context?: AccessContext
  ): Promise<MCPResource[]> {
    try {
      let results = Array.from(this.resources.values());

      // Apply filters
      if (query.uriPattern) {
        const pattern = this.createRegexPattern(query.uriPattern);
        results = results.filter(r => pattern.test(r.uri));
      }

      if (query.namePattern) {
        const pattern = this.createRegexPattern(query.namePattern);
        results = results.filter(r => pattern.test(r.name));
      }

      if (query.mimeType) {
        results = results.filter(r => r.mimeType === query.mimeType);
      }

      if (query.metadata) {
        results = results.filter(r => this.matchesMetadata(r.metadata, query.metadata!));
      }

      // Apply access control filtering
      if (context) {
        results = results.filter(r => this.checkResourceAccess(r, 'read', context));
      }

      // Apply required permissions filter
      if (query.requiredPermissions) {
        results = results.filter(r => 
          this.hasRequiredPermissions(r, query.requiredPermissions!, context)
        );
      }

      // Sort results
      if (query.sortBy) {
        results = this.sortResources(results, query.sortBy, query.sortOrder || 'asc');
      }

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || results.length;
      results = results.slice(offset, offset + limit);

      return results;
    } catch (error) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_UNAVAILABLE,
        `Resource discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          category: ErrorCategory.RESOURCE,
          severity: ErrorSeverity.MEDIUM,
          retryable: true,
          details: { query, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );
    }
  }

  /**
   * Read resource content with access control and caching
   */
  async readResource(
    uri: string,
    context: AccessContext,
    params?: any
  ): Promise<ResourceContent> {
    const resource = this.resources.get(uri);
    if (!resource) {
      this.logAccess(context.principal, uri, 'read', false, 'Resource not found');
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_NOT_FOUND,
        `Resource not found: ${uri}`,
        {
          category: ErrorCategory.RESOURCE,
          severity: ErrorSeverity.LOW,
          retryable: false,
          details: { uri }
        }
      );
    }

    // Check access permissions
    if (!this.checkResourceAccess(resource, 'read', context)) {
      this.logAccess(context.principal, uri, 'read', false, 'Access denied');
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_ACCESS_DENIED,
        `Access denied for resource: ${uri}`,
        {
          category: ErrorCategory.AUTH,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          details: { uri, principal: context.principal }
        }
      );
    }

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(uri, params, context.principal);
      const cachedContent = this.getCachedContent(cacheKey, resource.caching);
      
      if (cachedContent) {
        this.logAccess(context.principal, uri, 'read', true);
        return cachedContent;
      }

      // Read from handler
      const content = await resource.handler.read(uri, params);
      
      // Cache the content if caching is enabled
      if (resource.caching?.enabled) {
        this.cacheContent(cacheKey, content, resource.caching);
      }

      this.logAccess(context.principal, uri, 'read', true);
      return content;
    } catch (error) {
      this.logAccess(context.principal, uri, 'read', false, 
        error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * List resources with access control
   */
  async listResources(
    pattern?: string,
    context?: AccessContext
  ): Promise<MCPResource[]> {
    const query: ResourceQuery = pattern ? { namePattern: pattern } : {};
    return this.discoverResources(query, context);
  }

  /**
   * Check if a principal has access to a resource for a specific operation
   */
  checkResourceAccess(
    resource: MCPResource,
    operation: string,
    context: AccessContext
  ): boolean {
    const permissions = resource.permissions;
    if (!permissions) {
      return true; // No permissions defined, allow access
    }

    // Check basic operation permission
    switch (operation) {
      case 'read':
        if (!permissions.read) return false;
        break;
      case 'write':
        if (!permissions.write) return false;
        break;
      case 'subscribe':
        if (!permissions.subscribe) return false;
        break;
    }

    // Check required roles
    if (permissions.requiredRoles && permissions.requiredRoles.length > 0) {
      const hasRequiredRole = permissions.requiredRoles.some(role => 
        context.roles.includes(role)
      );
      if (!hasRequiredRole) return false;
    }

    // Check ACL entries
    if (permissions.acl && permissions.acl.length > 0) {
      return this.evaluateACL(permissions.acl, context, operation);
    }

    return true;
  }

  /**
   * Get resource access statistics
   */
  getAccessStatistics(uri?: string): {
    totalAccesses: number;
    successfulAccesses: number;
    failedAccesses: number;
    uniquePrincipals: number;
    lastAccess?: Date;
    mostCommonError?: string;
  } {
    const relevantLogs = uri 
      ? this.accessLog.filter(log => log.resource === uri)
      : this.accessLog;

    const totalAccesses = relevantLogs.length;
    const successfulAccesses = relevantLogs.filter(log => log.success).length;
    const failedAccesses = totalAccesses - successfulAccesses;
    const uniquePrincipals = new Set(relevantLogs.map(log => log.principal)).size;
    const lastAccess = relevantLogs.length > 0 
      ? relevantLogs[relevantLogs.length - 1].timestamp 
      : undefined;

    // Find most common error
    const errors = relevantLogs
      .filter(log => !log.success && log.error)
      .map(log => log.error!);
    const errorCounts = errors.reduce((acc, error) => {
      acc[error] = (acc[error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonError = Object.keys(errorCounts).length > 0
      ? Object.entries(errorCounts).sort(([,a], [,b]) => b - a)[0][0]
      : undefined;

    return {
      totalAccesses,
      successfulAccesses,
      failedAccesses,
      uniquePrincipals,
      lastAccess,
      mostCommonError
    };
  }

  /**
   * Clear cache entries (all or for specific resource)
   */
  clearCache(uri?: string): void {
    if (uri) {
      this.clearResourceCache(uri);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const entries = Array.from(this.cache.values());
    const totalEntries = entries.length;
    const totalSize = entries.reduce((sum, entry) => {
      const contentSize = Buffer.isBuffer(entry.content.content) 
        ? entry.content.content.length 
        : Buffer.byteLength(entry.content.content, 'utf8');
      return sum + contentSize;
    }, 0);

    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = totalAccesses > 0 ? entries.length / totalAccesses : 0;

    const timestamps = entries.map(entry => entry.timestamp);
    const oldestEntry = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : undefined;
    const newestEntry = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : undefined;

    return {
      totalEntries,
      totalSize,
      hitRate,
      oldestEntry,
      newestEntry
    };
  }

  // Private helper methods

  private validateResource(resource: MCPResource): void {
    if (!resource.uri || !resource.name || !resource.handler) {
      throw new MCPErrorClass(
        MCPErrorCode.RESOURCE_INVALID_FORMAT,
        'Resource must have uri, name, and handler',
        {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          details: { resource }
        }
      );
    }
  }

  private createRegexPattern(pattern: string): RegExp {
    // Convert glob-like patterns to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\[([^\]]+)\]/g, '[$1]');
    
    return new RegExp(regexPattern, 'i');
  }

  private matchesMetadata(
    resourceMetadata: Record<string, any> | undefined,
    queryMetadata: Record<string, any>
  ): boolean {
    if (!resourceMetadata) return false;
    
    return Object.entries(queryMetadata).every(([key, value]) => {
      const resourceValue = resourceMetadata[key];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(resourceValue) === JSON.stringify(value);
      }
      return resourceValue === value;
    });
  }

  private hasRequiredPermissions(
    resource: MCPResource,
    requiredPermissions: string[],
    context?: AccessContext
  ): boolean {
    if (!context) return false;
    
    return requiredPermissions.every(permission => 
      context.permissions.includes(permission)
    );
  }

  private sortResources(
    resources: MCPResource[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): MCPResource[] {
    return resources.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'uri':
          comparison = a.uri.localeCompare(b.uri);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  private evaluateACL(
    acl: AccessControlEntry[],
    context: AccessContext,
    operation: string
  ): boolean {
    // Process ACL entries in order
    for (const entry of acl) {
      if (this.matchesPrincipal(entry.principal, context)) {
        if (entry.permissions.includes(operation) || entry.permissions.includes('*')) {
          return entry.type === 'allow';
        }
      }
    }
    
    // Default deny if no matching ACL entry
    return false;
  }

  private matchesPrincipal(principal: string, context: AccessContext): boolean {
    // Direct match
    if (principal === context.principal) return true;
    
    // Role match
    if (principal.startsWith('role:')) {
      const role = principal.substring(5);
      return context.roles.includes(role);
    }
    
    // Wildcard match
    if (principal === '*') return true;
    
    return false;
  }

  private generateCacheKey(uri: string, params?: any, principal?: string): string {
    let baseKey = uri;
    
    // Include principal in cache key for user-specific caching
    if (principal) {
      baseKey = `${principal}:${baseKey}`;
    }
    
    if (!params) return baseKey;
    
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return `${baseKey}:${Buffer.from(paramString).toString('base64')}`;
  }

  private getCachedContent(
    cacheKey: string,
    caching?: ResourceCaching
  ): ResourceContent | null {
    if (!caching?.enabled) return null;
    
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;
    
    // Check TTL
    const now = new Date();
    const ttl = caching.ttl || 300; // Default 5 minutes
    const ageInSeconds = (now.getTime() - entry.timestamp.getTime()) / 1000;
    
    if (ageInSeconds > ttl) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.content;
  }

  private cacheContent(
    cacheKey: string,
    content: ResourceContent,
    caching: ResourceCaching
  ): void {
    const ttl = caching.ttl || 300; // Default 5 minutes
    
    this.cache.set(cacheKey, {
      content,
      timestamp: new Date(),
      ttl,
      accessCount: 1,
      lastAccessed: new Date()
    });
    
    // Simple cache cleanup - remove expired entries periodically
    this.cleanupExpiredCache();
  }

  private clearResourceCache(uri: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      // Handle both old format (uri) and new format (principal:uri or principal:uri:params)
      if (key === uri || key.includes(`:${uri}`) || key.startsWith(`${uri}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private cleanupExpiredCache(): void {
    const now = new Date();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache) {
      const ageInSeconds = (now.getTime() - entry.timestamp.getTime()) / 1000;
      if (ageInSeconds > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private logAccess(
    principal: string,
    resource: string,
    operation: string,
    success: boolean,
    error?: string
  ): void {
    this.accessLog.push({
      principal,
      resource,
      operation,
      timestamp: new Date(),
      success,
      error
    });
    
    // Keep only last 1000 entries to prevent memory issues
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-1000);
    }
  }
}