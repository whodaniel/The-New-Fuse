/**
 * Authentication Manager for MCP connections
 *
 * Provides comprehensive authentication and authorization services
 * for MCP connections, including token management, credential validation,
 * and security policy enforcement.
 */
import { EventEmitter } from 'events';
import { MCPErrorClass, MCPErrorCode } from '../types/error';
/**
 * Authentication Manager implementation
 */
export class AuthenticationManager extends EventEmitter {
    config;
    tokens = new Map();
    failedAttempts = new Map();
    lockedAccounts = new Map();
    policies = [];
    auditEvents = [];
    constructor(config = {}) {
        super();
        this.config = {
            tokenExpirationTime: 3600, // 1 hour
            refreshTokenExpirationTime: 86400 * 7, // 7 days
            maxFailedAttempts: 5,
            lockoutDuration: 900, // 15 minutes
            enableAuditLogging: true,
            ...config
        };
        // Start token cleanup interval
        setInterval(() => this.cleanupExpiredTokens(), 60000); // Every minute
    }
    /**
     * Authenticate connection using provided credentials
     */
    async authenticateConnection(credentials) {
        try {
            const initialIdentifier = credentials.username || credentials.clientId || 'unknown';
            // Check for account lockout
            if (this.isAccountLocked(initialIdentifier)) {
                const error = 'Account is locked due to too many failed attempts';
                this.auditEvent({
                    type: 'access_denied',
                    userId: credentials.username,
                    success: false,
                    error,
                    timestamp: new Date()
                });
                throw new MCPErrorClass(MCPErrorCode.AUTHENTICATION_FAILED, error);
            }
            let authResult;
            switch (credentials.type) {
                case 'bearer':
                    authResult = await this.authenticateBearer(credentials);
                    break;
                case 'basic':
                    authResult = await this.authenticateBasic(credentials);
                    break;
                case 'oauth':
                    authResult = await this.authenticateOAuth(credentials);
                    break;
                case 'api_key':
                    authResult = await this.authenticateApiKey(credentials);
                    break;
                default:
                    throw new MCPErrorClass(MCPErrorCode.AUTHENTICATION_FAILED, `Unsupported authentication type: ${credentials.type}`);
            }
            if (authResult.success) {
                // Reset failed attempts on successful authentication
                const authIdentifier = authResult.userId || initialIdentifier;
                this.resetFailedAttempts(authIdentifier);
                this.auditEvent({
                    type: 'login',
                    userId: authResult.userId,
                    success: true,
                    timestamp: new Date()
                });
            }
            else {
                // Track failed attempt only for non-bearer auth where user is known
                if (credentials.type !== 'bearer') {
                    this.trackFailedAttempt(initialIdentifier);
                }
                this.auditEvent({
                    type: 'access_denied',
                    userId: credentials.username,
                    success: false,
                    error: authResult.error,
                    timestamp: new Date()
                });
            }
            return authResult;
        }
        catch (error) {
            const authError = error;
            this.auditEvent({
                type: 'access_denied',
                userId: credentials.username,
                success: false,
                error: authError.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Authorize request based on authentication context and policies
     */
    async authorizeRequest(context, resource, operation) {
        try {
            // Find applicable policies
            const applicablePolicies = this.policies.filter(policy => this.isPolicyApplicable(policy, resource, operation));
            // If no policies apply, default to allow (can be configured)
            if (applicablePolicies.length === 0) {
                return true;
            }
            // Evaluate all applicable policies
            for (const policy of applicablePolicies) {
                const authorized = await this.evaluatePolicy(policy, context);
                if (!authorized) {
                    this.auditEvent({
                        type: 'policy_violation',
                        userId: context.userId,
                        resource,
                        operation,
                        success: false,
                        error: `Policy violation: ${policy.name}`,
                        timestamp: new Date()
                    });
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            this.auditEvent({
                type: 'access_denied',
                userId: context.userId,
                resource,
                operation,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            return false;
        }
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken) {
        try {
            const tokenInfo = this.tokens.get(refreshToken);
            if (!tokenInfo || tokenInfo.type !== 'refresh') {
                throw new MCPErrorClass(MCPErrorCode.TOKEN_INVALID, 'Invalid refresh token');
            }
            if (tokenInfo.expiresAt < new Date()) {
                this.tokens.delete(refreshToken);
                throw new MCPErrorClass(MCPErrorCode.TOKEN_EXPIRED, 'Refresh token expired');
            }
            // Generate new access token
            const newAccessToken = this.generateToken();
            const newTokenInfo = {
                token: newAccessToken,
                type: 'access',
                userId: tokenInfo.userId,
                expiresAt: new Date(Date.now() + this.config.tokenExpirationTime * 1000),
                scopes: tokenInfo.scopes,
                metadata: tokenInfo.metadata
            };
            this.tokens.set(newAccessToken, newTokenInfo);
            this.auditEvent({
                type: 'token_refresh',
                userId: tokenInfo.userId,
                success: true,
                timestamp: new Date()
            });
            return {
                success: true,
                userId: tokenInfo.userId,
                accessToken: newAccessToken,
                expiresAt: newTokenInfo.expiresAt
            };
        }
        catch (error) {
            const authError = error;
            this.auditEvent({
                type: 'token_refresh',
                success: false,
                error: authError.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Revoke token
     */
    async revokeToken(token) {
        const tokenInfo = this.tokens.get(token);
        if (tokenInfo) {
            this.tokens.delete(token);
            this.auditEvent({
                type: 'logout',
                userId: tokenInfo.userId,
                success: true,
                timestamp: new Date()
            });
        }
    }
    /**
     * Add authentication policy
     */
    addPolicy(policy) {
        this.policies.push(policy);
    }
    /**
     * Remove authentication policy
     */
    removePolicy(policyName) {
        this.policies = this.policies.filter(p => p.name !== policyName);
    }
    /**
     * Get authentication statistics
     */
    getAuthStatistics() {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentEvents = this.auditEvents.filter(event => event.timestamp >= last24Hours);
        const successfulLogins = recentEvents.filter(event => event.type === 'login' && event.success).length;
        const failedLogins = recentEvents.filter(event => event.type === 'access_denied').length;
        return {
            activeTokens: this.tokens.size,
            lockedAccounts: this.lockedAccounts.size,
            successfulLogins24h: successfulLogins,
            failedLogins24h: failedLogins,
            totalAuditEvents: this.auditEvents.length,
            policies: this.policies.length,
            tokenTypes: this.getTokenTypeDistribution()
        };
    }
    /**
     * Get audit events
     */
    getAuditEvents(limit) {
        const events = [...this.auditEvents].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return limit ? events.slice(0, limit) : events;
    }
    /**
     * Authenticate using Bearer token
     */
    async authenticateBearer(credentials) {
        if (!credentials.token) {
            return { success: false, error: 'Bearer token is required' };
        }
        const tokenInfo = this.tokens.get(credentials.token);
        if (!tokenInfo) {
            return { success: false, error: 'Invalid bearer token' };
        }
        if (tokenInfo.expiresAt < new Date()) {
            this.tokens.delete(credentials.token);
            return { success: false, error: 'Bearer token expired' };
        }
        return {
            success: true,
            userId: tokenInfo.userId,
            accessToken: credentials.token,
            expiresAt: tokenInfo.expiresAt
        };
    }
    /**
     * Authenticate using Basic authentication
     */
    async authenticateBasic(credentials) {
        if (!credentials.username || !credentials.password) {
            return { success: false, error: 'Username and password are required' };
        }
        // In a real implementation, this would validate against a user database
        // For now, we'll create a simple validation
        const isValid = await this.validateUserCredentials(credentials.username, credentials.password);
        if (!isValid) {
            return { success: false, error: 'Invalid username or password' };
        }
        // Generate tokens for successful authentication
        const accessToken = this.generateToken();
        const refreshToken = this.generateToken();
        const accessTokenInfo = {
            token: accessToken,
            type: 'access',
            userId: credentials.username,
            expiresAt: new Date(Date.now() + this.config.tokenExpirationTime * 1000),
            scopes: ['read', 'write'] // Default scopes
        };
        const refreshTokenInfo = {
            token: refreshToken,
            type: 'refresh',
            userId: credentials.username,
            expiresAt: new Date(Date.now() + this.config.refreshTokenExpirationTime * 1000),
            scopes: ['refresh']
        };
        this.tokens.set(accessToken, accessTokenInfo);
        this.tokens.set(refreshToken, refreshTokenInfo);
        return {
            success: true,
            userId: credentials.username,
            roles: ['user'], // Default role
            permissions: ['read', 'write'], // Default permissions
            accessToken,
            refreshToken,
            expiresAt: accessTokenInfo.expiresAt
        };
    }
    /**
     * Authenticate using OAuth
     */
    async authenticateOAuth(credentials) {
        if (!credentials.token) {
            return { success: false, error: 'OAuth token is required' };
        }
        // In a real implementation, this would validate the OAuth token
        // with the OAuth provider
        const tokenInfo = await this.validateOAuthToken(credentials.token);
        if (!tokenInfo) {
            return { success: false, error: 'Invalid OAuth token' };
        }
        return {
            success: true,
            userId: tokenInfo.userId,
            roles: tokenInfo.roles || ['user'],
            permissions: tokenInfo.permissions || ['read'],
            accessToken: credentials.token,
            expiresAt: tokenInfo.expiresAt
        };
    }
    /**
     * Authenticate using API key
     */
    async authenticateApiKey(credentials) {
        if (!credentials.apiKey) {
            return { success: false, error: 'API key is required' };
        }
        const tokenInfo = this.tokens.get(credentials.apiKey);
        if (!tokenInfo || tokenInfo.type !== 'api_key') {
            return { success: false, error: 'Invalid API key' };
        }
        // API keys typically don't expire, but check if configured
        if (tokenInfo.expiresAt && tokenInfo.expiresAt < new Date()) {
            this.tokens.delete(credentials.apiKey);
            return { success: false, error: 'API key expired' };
        }
        return {
            success: true,
            userId: tokenInfo.userId,
            accessToken: credentials.apiKey
        };
    }
    /**
     * Validate user credentials (placeholder implementation)
     */
    async validateUserCredentials(username, password) {
        // In a real implementation, this would check against a user database
        // For testing purposes, we'll accept any non-empty credentials
        return username.length > 0 && password.length > 0;
    }
    /**
     * Validate OAuth token (placeholder implementation)
     */
    async validateOAuthToken(token) {
        // In a real implementation, this would validate with the OAuth provider
        // For testing purposes, we'll return mock data for valid-looking tokens
        if (token.startsWith('oauth_')) {
            return {
                userId: 'oauth_user',
                roles: ['user'],
                permissions: ['read', 'write'],
                expiresAt: new Date(Date.now() + 3600000) // 1 hour
            };
        }
        return null;
    }
    /**
     * Check if policy is applicable to resource and operation
     */
    isPolicyApplicable(policy, resource, operation) {
        if (policy.resourcePatterns && resource) {
            const matches = policy.resourcePatterns.some(pattern => new RegExp(pattern).test(resource));
            if (!matches)
                return false;
        }
        if (policy.operations && operation) {
            if (!policy.operations.includes(operation))
                return false;
        }
        return true;
    }
    /**
     * Evaluate authentication policy
     */
    async evaluatePolicy(policy, context) {
        // Check required roles
        if (policy.requiredRoles && policy.requiredRoles.length > 0) {
            const hasRequiredRole = policy.requiredRoles.some(role => context.roles.includes(role));
            if (!hasRequiredRole)
                return false;
        }
        // Check required permissions
        if (policy.requiredPermissions && policy.requiredPermissions.length > 0) {
            const hasRequiredPermission = policy.requiredPermissions.some(permission => context.permissions.includes(permission));
            if (!hasRequiredPermission)
                return false;
        }
        // Run custom evaluation function if provided
        if (policy.evaluate) {
            return await policy.evaluate(context);
        }
        return true;
    }
    /**
     * Track failed authentication attempt
     */
    trackFailedAttempt(identifier) {
        const attempts = this.failedAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
        attempts.count++;
        attempts.lastAttempt = new Date();
        this.failedAttempts.set(identifier, attempts);
        // Lock account if max attempts exceeded
        if (attempts.count >= this.config.maxFailedAttempts) {
            const lockUntil = new Date(Date.now() + this.config.lockoutDuration * 1000);
            this.lockedAccounts.set(identifier, lockUntil);
            this.emit('accountLocked', identifier, lockUntil);
        }
    }
    /**
     * Reset failed authentication attempts
     */
    resetFailedAttempts(identifier) {
        this.failedAttempts.delete(identifier);
        this.lockedAccounts.delete(identifier);
    }
    /**
     * Check if account is locked
     */
    isAccountLocked(identifier) {
        const lockUntil = this.lockedAccounts.get(identifier);
        if (!lockUntil)
            return false;
        if (lockUntil < new Date()) {
            // Lock expired, remove it
            this.lockedAccounts.delete(identifier);
            this.failedAttempts.delete(identifier);
            return false;
        }
        return true;
    }
    /**
     * Generate random token
     */
    generateToken() {
        return `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Clean up expired tokens
     */
    cleanupExpiredTokens() {
        const now = new Date();
        const expiredTokens = [];
        for (const [token, tokenInfo] of this.tokens) {
            if (tokenInfo.expiresAt && tokenInfo.expiresAt < now) {
                expiredTokens.push(token);
            }
        }
        for (const token of expiredTokens) {
            this.tokens.delete(token);
        }
        if (expiredTokens.length > 0) {
            this.emit('tokensExpired', expiredTokens.length);
        }
    }
    /**
     * Get token type distribution
     */
    getTokenTypeDistribution() {
        const distribution = {
            access: 0,
            refresh: 0,
            api_key: 0
        };
        for (const tokenInfo of this.tokens.values()) {
            distribution[tokenInfo.type]++;
        }
        return distribution;
    }
    /**
     * Record audit event
     */
    auditEvent(event) {
        if (!this.config.enableAuditLogging)
            return;
        this.auditEvents.push(event);
        // Keep only last 10000 events to prevent memory issues
        if (this.auditEvents.length > 10000) {
            this.auditEvents = this.auditEvents.slice(-5000);
        }
        this.emit('auditEvent', event);
    }
}
//# sourceMappingURL=AuthenticationManager.js.map