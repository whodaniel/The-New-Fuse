/**
 * Resource Manager for MCP resource discovery, access control, and caching
 */
import { MCPResource, ResourceContent } from '../interfaces/IMCPResource';
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
 * Resource Manager class for centralized resource management
 */
export declare class ResourceManager {
    private resources;
    private cache;
    private accessLog;
    /**
     * Register a resource with the manager
     */
    registerResource(resource: MCPResource): void;
    /**
     * Unregister a resource from the manager
     */
    unregisterResource(uri: string): boolean;
    /**
     * Discover resources based on query criteria
     */
    discoverResources(query?: ResourceQuery, context?: AccessContext): Promise<MCPResource[]>;
    /**
     * Read resource content with access control and caching
     */
    readResource(uri: string, context: AccessContext, params?: any): Promise<ResourceContent>;
    /**
     * List resources with access control
     */
    listResources(pattern?: string, context?: AccessContext): Promise<MCPResource[]>;
    /**
     * Check if a principal has access to a resource for a specific operation
     */
    checkResourceAccess(resource: MCPResource, operation: string, context: AccessContext): boolean;
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
    };
    /**
     * Clear cache entries (all or for specific resource)
     */
    clearCache(uri?: string): void;
    /**
     * Get cache statistics
     */
    getCacheStatistics(): {
        totalEntries: number;
        totalSize: number;
        hitRate: number;
        oldestEntry?: Date;
        newestEntry?: Date;
    };
    private validateResource;
    private createRegexPattern;
    private matchesMetadata;
    private hasRequiredPermissions;
    private sortResources;
    private evaluateACL;
    private matchesPrincipal;
    private generateCacheKey;
    private getCachedContent;
    private cacheContent;
    private clearResourceCache;
    private cleanupExpiredCache;
    private logAccess;
}
//# sourceMappingURL=ResourceManager.d.ts.map