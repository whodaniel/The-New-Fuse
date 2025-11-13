/**
 * Authentication Manager for MCP connections
 *
 * Provides comprehensive authentication and authorization services
 * for MCP connections, including token management, credential validation,
 * and security policy enforcement.
 */
import { EventEmitter } from 'events';
import { AuthConfig } from '../interfaces/IMCPConnection';
/**
 * Authentication result interface
 */
export interface AuthResult {
    /** Authentication success status */
    success: boolean;
    /** User ID if authenticated */
    userId?: string;
    /** User roles */
    roles?: string[];
    /** User permissions */
    permissions?: string[];
    /** Access token */
    accessToken?: string;
    /** Refresh token */
    refreshToken?: string;
    /** Token expiration time */
    expiresAt?: Date;
    /** Error message if authentication failed */
    error?: string;
}
/**
 * Authentication context interface
 */
export interface AuthContext {
    /** User ID */
    userId: string;
    /** User roles */
    roles: string[];
    /** User permissions */
    permissions: string[];
    /** Service ID (for service-to-service auth) */
    serviceId?: string;
    /** Resource URI being accessed */
    resourceUri?: string;
    /** Operation being performed */
    operation?: string;
    /** Client IP address */
    clientIp?: string;
    /** User agent */
    userAgent?: string;
}
/**
 * Token information interface
 */
export interface TokenInfo {
    /** Token value */
    token: string;
    /** Token type */
    type: 'access' | 'refresh' | 'api_key';
    /** User ID */
    userId: string;
    /** Token expiration */
    expiresAt: Date;
    /** Token scopes */
    scopes: string[];
    /** Token metadata */
    metadata?: Record<string, any>;
}
/**
 * Authentication policy interface
 */
export interface AuthPolicy {
    /** Policy name */
    name: string;
    /** Required roles */
    requiredRoles?: string[];
    /** Required permissions */
    requiredPermissions?: string[];
    /** Resource patterns this policy applies to */
    resourcePatterns?: string[];
    /** Operations this policy applies to */
    operations?: string[];
    /** Policy evaluation function */
    evaluate?: (context: AuthContext) => Promise<boolean>;
}
/**
 * Authentication configuration interface
 */
export interface AuthManagerConfig {
    /** Token expiration time in seconds */
    tokenExpirationTime: number;
    /** Refresh token expiration time in seconds */
    refreshTokenExpirationTime: number;
    /** Maximum failed authentication attempts */
    maxFailedAttempts: number;
    /** Account lockout duration in seconds */
    lockoutDuration: number;
    /** Enable audit logging */
    enableAuditLogging: boolean;
    /** JWT secret for token signing */
    jwtSecret?: string;
    /** External authentication provider */
    externalProvider?: {
        type: 'oauth' | 'saml' | 'ldap';
        endpoint: string;
        clientId: string;
        clientSecret: string;
    };
}
/**
 * Authentication audit event interface
 */
export interface AuthAuditEvent {
    /** Event type */
    type: 'login' | 'logout' | 'token_refresh' | 'access_denied' | 'policy_violation' | 'access_granted' | 'resource_access' | 'tool_execution' | 'security_violation' | 'system_admin';
    /** User ID */
    userId?: string;
    /** Service ID */
    serviceId?: string;
    /** Resource accessed */
    resource?: string;
    /** Operation attempted */
    operation?: string;
    /** Success status */
    success: boolean;
    /** Error message if failed */
    error?: string;
    /** Client IP address */
    clientIp?: string;
    /** User agent */
    userAgent?: string;
    /** Timestamp */
    timestamp: Date;
    /** Additional metadata */
    metadata?: Record<string, any>;
}
/**
 * Authentication Manager implementation
 */
export declare class AuthenticationManager extends EventEmitter {
    private config;
    private tokens;
    private failedAttempts;
    private lockedAccounts;
    private policies;
    private auditEvents;
    constructor(config?: Partial<AuthManagerConfig>);
    /**
     * Authenticate connection using provided credentials
     */
    authenticateConnection(credentials: AuthConfig): Promise<AuthResult>;
    /**
     * Authorize request based on authentication context and policies
     */
    authorizeRequest(context: AuthContext, resource?: string, operation?: string): Promise<boolean>;
    /**
     * Refresh access token using refresh token
     */
    refreshToken(refreshToken: string): Promise<AuthResult>;
    /**
     * Revoke token
     */
    revokeToken(token: string): Promise<void>;
    /**
     * Add authentication policy
     */
    addPolicy(policy: AuthPolicy): void;
    /**
     * Remove authentication policy
     */
    removePolicy(policyName: string): void;
    /**
     * Get authentication statistics
     */
    getAuthStatistics(): {
        activeTokens: number;
        lockedAccounts: number;
        successfulLogins24h: number;
        failedLogins24h: number;
        totalAuditEvents: number;
        policies: number;
        tokenTypes: Record<string, number>;
    };
    /**
     * Get audit events
     */
    getAuditEvents(limit?: number): AuthAuditEvent[];
    /**
     * Authenticate using Bearer token
     */
    private authenticateBearer;
    /**
     * Authenticate using Basic authentication
     */
    private authenticateBasic;
    /**
     * Authenticate using OAuth
     */
    private authenticateOAuth;
    /**
     * Authenticate using API key
     */
    private authenticateApiKey;
    /**
     * Validate user credentials (placeholder implementation)
     */
    private validateUserCredentials;
    /**
     * Validate OAuth token (placeholder implementation)
     */
    private validateOAuthToken;
    /**
     * Check if policy is applicable to resource and operation
     */
    private isPolicyApplicable;
    /**
     * Evaluate authentication policy
     */
    private evaluatePolicy;
    /**
     * Track failed authentication attempt
     */
    private trackFailedAttempt;
    /**
     * Reset failed authentication attempts
     */
    private resetFailedAttempts;
    /**
     * Check if account is locked
     */
    private isAccountLocked;
    /**
     * Generate random token
     */
    private generateToken;
    /**
     * Clean up expired tokens
     */
    private cleanupExpiredTokens;
    /**
     * Get token type distribution
     */
    private getTokenTypeDistribution;
    /**
     * Record audit event
     */
    private auditEvent;
}
//# sourceMappingURL=AuthenticationManager.d.ts.map