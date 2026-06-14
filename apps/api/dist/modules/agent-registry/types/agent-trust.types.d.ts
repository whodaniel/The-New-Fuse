/**
 * Agent Trust Level Types
 * Defines trust levels and permissions for agents in the Fuse API
 */
/**
 * Trust levels for agents
 * - EPHEMERAL: Default for new agents, limited access
 * - VERIFIED: Email/Web3Auth verified, moderate access
 * - PREMIUM: Active subscription, full feature access
 * - ADMIN: Super admin only, full system access
 */
export declare enum AgentTrustLevel {
    EPHEMERAL = "EPHEMERAL",
    VERIFIED = "VERIFIED",
    PREMIUM = "PREMIUM",
    ADMIN = "ADMIN"
}
/**
 * Permission flags for agent capabilities
 */
export declare enum AgentPermission {
    API_READ = "api:read",
    API_WRITE = "api:write",
    AGENT_CREATE = "agent:create",
    AGENT_READ = "agent:read",
    AGENT_UPDATE = "agent:update",
    AGENT_DELETE = "agent:delete",
    WORKFLOW_CREATE = "workflow:create",
    WORKFLOW_EXECUTE = "workflow:execute",
    WORKFLOW_MANAGE = "workflow:manage",
    TASK_CREATE = "task:create",
    TASK_EXECUTE = "task:execute",
    TASK_MANAGE = "task:manage",
    INTEGRATION_CONNECT = "integration:connect",
    WEBHOOK_MANAGE = "webhook:manage",
    API_KEY_GENERATE = "api_key:generate",
    USER_MANAGE = "user:manage",
    SYSTEM_CONFIG = "system:config",
    BILLING_MANAGE = "billing:manage",
    AUDIT_ACCESS = "audit:access"
}
/**
 * Permission set configuration per trust level
 */
export interface TrustLevelPermissions {
    trustLevel: AgentTrustLevel;
    permissions: AgentPermission[];
    rateLimit: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    };
    features: {
        maxAgents: number;
        maxWorkflows: number;
        maxTasksPerDay: number;
        priority: 'low' | 'medium' | 'high' | 'critical';
        support: 'community' | 'email' | 'priority' | 'dedicated';
    };
}
/**
 * Default permission configuration per trust level
 */
export declare const TRUST_LEVEL_CONFIG: Record<AgentTrustLevel, TrustLevelPermissions>;
/**
 * Helper function to get trust level config
 */
export declare function getTrustLevelConfig(trustLevel: AgentTrustLevel): TrustLevelPermissions;
/**
 * Helper function to check if a trust level has a specific permission
 */
export declare function hasPermission(trustLevel: AgentTrustLevel, permission: AgentPermission): boolean;
/**
 * Helper function to get rate limits for a trust level
 */
export declare function getRateLimits(trustLevel: AgentTrustLevel): TrustLevelPermissions['rateLimit'];
/**
 * Trust level assignment requirements
 */
export interface TrustLevelRequirements {
    emailVerified?: boolean;
    web3AuthVerified?: boolean;
    activeSubscription?: boolean;
    adminApproval?: boolean;
}
/**
 * Requirements for each trust level upgrade
 */
export declare const TRUST_LEVEL_REQUIREMENTS: Record<AgentTrustLevel, TrustLevelRequirements>;
//# sourceMappingURL=agent-trust.types.d.ts.map