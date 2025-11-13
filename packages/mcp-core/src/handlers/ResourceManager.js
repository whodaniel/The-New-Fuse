/**
 * Resource Manager for MCP resource discovery, access control, and caching
 */
import { MCPErrorClass, MCPErrorCode, ErrorCategory, ErrorSeverity } from '../types/error';
/**
 * Resource Manager class for centralized resource management
 */
export class ResourceManager {
    resources = new Map();
    cache = new Map();
    accessLog = [];
    /**
     * Register a resource with the manager
     */
    registerResource(resource) {
        this.validateResource(resource);
        this.resources.set(resource.uri, resource);
    }
    /**
     * Unregister a resource from the manager
     */
    unregisterResource(uri) {
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
    async discoverResources(query = {}, context) {
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
                results = results.filter(r => this.matchesMetadata(r.metadata, query.metadata));
            }
            // Apply access control filtering
            if (context) {
                results = results.filter(r => this.checkResourceAccess(r, 'read', context));
            }
            // Apply required permissions filter
            if (query.requiredPermissions) {
                results = results.filter(r => this.hasRequiredPermissions(r, query.requiredPermissions, context));
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
        }
        catch (error) {
            throw new MCPErrorClass(MCPErrorCode.RESOURCE_UNAVAILABLE, `Resource discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                category: ErrorCategory.RESOURCE,
                severity: ErrorSeverity.MEDIUM,
                retryable: true,
                details: { query, error: error instanceof Error ? error.message : 'Unknown error' }
            });
        }
    }
    /**
     * Read resource content with access control and caching
     */
    async readResource(uri, context, params) {
        const resource = this.resources.get(uri);
        if (!resource) {
            this.logAccess(context.principal, uri, 'read', false, 'Resource not found');
            throw new MCPErrorClass(MCPErrorCode.RESOURCE_NOT_FOUND, `Resource not found: ${uri}`, {
                category: ErrorCategory.RESOURCE,
                severity: ErrorSeverity.LOW,
                retryable: false,
                details: { uri }
            });
        }
        // Check access permissions
        if (!this.checkResourceAccess(resource, 'read', context)) {
            this.logAccess(context.principal, uri, 'read', false, 'Access denied');
            throw new MCPErrorClass(MCPErrorCode.RESOURCE_ACCESS_DENIED, `Access denied for resource: ${uri}`, {
                category: ErrorCategory.AUTH,
                severity: ErrorSeverity.MEDIUM,
                retryable: false,
                details: { uri, principal: context.principal }
            });
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
        }
        catch (error) {
            this.logAccess(context.principal, uri, 'read', false, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    /**
     * List resources with access control
     */
    async listResources(pattern, context) {
        const query = pattern ? { namePattern: pattern } : {};
        return this.discoverResources(query, context);
    }
    /**
     * Check if a principal has access to a resource for a specific operation
     */
    checkResourceAccess(resource, operation, context) {
        const permissions = resource.permissions;
        if (!permissions) {
            return true; // No permissions defined, allow access
        }
        // Check basic operation permission
        switch (operation) {
            case 'read':
                if (!permissions.read)
                    return false;
                break;
            case 'write':
                if (!permissions.write)
                    return false;
                break;
            case 'subscribe':
                if (!permissions.subscribe)
                    return false;
                break;
        }
        // Check required roles
        if (permissions.requiredRoles && permissions.requiredRoles.length > 0) {
            const hasRequiredRole = permissions.requiredRoles.some(role => context.roles.includes(role));
            if (!hasRequiredRole)
                return false;
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
    getAccessStatistics(uri) {
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
            .map(log => log.error);
        const errorCounts = errors.reduce((acc, error) => {
            acc[error] = (acc[error] || 0) + 1;
            return acc;
        }, {});
        const mostCommonError = Object.keys(errorCounts).length > 0
            ? Object.entries(errorCounts).sort(([, a], [, b]) => b - a)[0][0]
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
    clearCache(uri) {
        if (uri) {
            this.clearResourceCache(uri);
        }
        else {
            this.cache.clear();
        }
    }
    /**
     * Get cache statistics
     */
    getCacheStatistics() {
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
    validateResource(resource) {
        if (!resource.uri || !resource.name || !resource.handler) {
            throw new MCPErrorClass(MCPErrorCode.RESOURCE_INVALID_FORMAT, 'Resource must have uri, name, and handler', {
                category: ErrorCategory.VALIDATION,
                severity: ErrorSeverity.MEDIUM,
                retryable: false,
                details: { resource }
            });
        }
    }
    createRegexPattern(pattern) {
        // Convert glob-like patterns to regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')
            .replace(/\[([^\]]+)\]/g, '[$1]');
        return new RegExp(regexPattern, 'i');
    }
    matchesMetadata(resourceMetadata, queryMetadata) {
        if (!resourceMetadata)
            return false;
        return Object.entries(queryMetadata).every(([key, value]) => {
            const resourceValue = resourceMetadata[key];
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(resourceValue) === JSON.stringify(value);
            }
            return resourceValue === value;
        });
    }
    hasRequiredPermissions(resource, requiredPermissions, context) {
        if (!context)
            return false;
        return requiredPermissions.every(permission => context.permissions.includes(permission));
    }
    sortResources(resources, sortBy, sortOrder) {
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
    evaluateACL(acl, context, operation) {
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
    matchesPrincipal(principal, context) {
        // Direct match
        if (principal === context.principal)
            return true;
        // Role match
        if (principal.startsWith('role:')) {
            const role = principal.substring(5);
            return context.roles.includes(role);
        }
        // Wildcard match
        if (principal === '*')
            return true;
        return false;
    }
    generateCacheKey(uri, params, principal) {
        let baseKey = uri;
        // Include principal in cache key for user-specific caching
        if (principal) {
            baseKey = `${principal}:${baseKey}`;
        }
        if (!params)
            return baseKey;
        const paramString = JSON.stringify(params, Object.keys(params).sort());
        return `${baseKey}:${Buffer.from(paramString).toString('base64')}`;
    }
    getCachedContent(cacheKey, caching) {
        if (!caching?.enabled)
            return null;
        const entry = this.cache.get(cacheKey);
        if (!entry)
            return null;
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
    cacheContent(cacheKey, content, caching) {
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
    clearResourceCache(uri) {
        const keysToDelete = [];
        for (const [key] of this.cache) {
            // Handle both old format (uri) and new format (principal:uri or principal:uri:params)
            if (key === uri || key.includes(`:${uri}`) || key.startsWith(`${uri}:`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }
    cleanupExpiredCache() {
        const now = new Date();
        const keysToDelete = [];
        for (const [key, entry] of this.cache) {
            const ageInSeconds = (now.getTime() - entry.timestamp.getTime()) / 1000;
            if (ageInSeconds > entry.ttl) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }
    logAccess(principal, resource, operation, success, error) {
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
//# sourceMappingURL=ResourceManager.js.map