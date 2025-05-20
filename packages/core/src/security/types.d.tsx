import { AuthMethod, AuthScope, SecurityLevel } from './types.js';

export declare enum AuthRole {
    USER = "user",
    ADMIN = "admin",
    SYSTEM = "system",
    GUEST = "guest"
}

export interface AuthCredentials {
    id: string;
    type: AuthMethod;
    value: string;
    metadata: {
        createdAt: Date;
        expiresAt?: Date;
        lastUsed?: Date;
        source?: string;
        device?: string;
    };
}
export interface AuthToken {
    id: string;
    userId: string;
    value: string;
    type: 'access' | 'refresh';
    scopes: AuthScope[];
    metadata: {
        createdAt: Date;
        expiresAt: Date;
        lastUsed?: Date;
        source?: string;
        device?: string;
    };
}
export interface AuthSession {
    id: string;
    userId: string;
    token: AuthToken;
    status: 'active' | 'expired' | 'revoked';
    metadata: {
        createdAt: Date;
        expiresAt: Date;
        lastActive?: Date;
        source?: string;
        device?: string;
        ip?: string;
        userAgent?: string;
    };
}
export interface SecurityPolicy {
    id: string;
    name: string;
    description: string;
    level: SecurityLevel;
    rules: SecurityRule[];
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        version: string;
        enabled: boolean;
    };
}
export interface SecurityRule {
    id: string;
    type: string;
    condition: string;
    action: string;
    metadata: {
        description?: string;
        priority: number;
        enabled: boolean;
    };
}
export interface SecurityAudit {
    id: string;
    type: string;
    action: string;
    status: 'success' | 'failure';
    timestamp: Date;
    details: {
        userId?: string;
        resource?: string;
        ip?: string;
        userAgent?: string;
        reason?: string;
        changes?: Record<string, unknown>;
    };
    metadata: {
        severity: SecurityLevel;
        tags?: string[];
    };
}
export interface SecurityViolation {
    id: string;
    type: string;
    description: string;
    severity: SecurityLevel;
    timestamp: Date;
    details: {
        userId?: string;
        resource?: string;
        ip?: string;
        userAgent?: string;
        policy?: string;
        rule?: string;
    };
    status: 'open' | 'investigating' | 'resolved' | 'false_positive';
    metadata: {
        detectedBy: string;
        assignedTo?: string;
        tags?: string[];
    };
}
export interface SecurityConfig {
    auth: {
        enabled: boolean;
        methods: AuthMethod[];
        tokenExpiration: number;
        sessionExpiration: number;
        maxSessions: number;
        passwordPolicy: {
            minLength: number;
            requireNumbers: boolean;
            requireSymbols: boolean;
            requireUppercase: boolean;
            requireLowercase: boolean;
            maxAge: number;
            preventReuse: number;
        };
    };
    encryption: {
        enabled: boolean;
        algorithm: string;
        keySize: number;
        saltRounds: number;
    };
    rateLimit: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
    };
    audit: {
        enabled: boolean;
        retention: number;
        detailedLogging: boolean;
    };
}
