"use strict";
/**
 * Agent Trust Level Types
 * Defines trust levels and permissions for agents in the Fuse API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRUST_LEVEL_REQUIREMENTS = exports.TRUST_LEVEL_CONFIG = exports.AgentPermission = exports.AgentTrustLevel = void 0;
exports.getTrustLevelConfig = getTrustLevelConfig;
exports.hasPermission = hasPermission;
exports.getRateLimits = getRateLimits;
/**
 * Trust levels for agents
 * - EPHEMERAL: Default for new agents, limited access
 * - VERIFIED: Email/Web3Auth verified, moderate access
 * - PREMIUM: Active subscription, full feature access
 * - ADMIN: Super admin only, full system access
 */
var AgentTrustLevel;
(function (AgentTrustLevel) {
    AgentTrustLevel["EPHEMERAL"] = "EPHEMERAL";
    AgentTrustLevel["VERIFIED"] = "VERIFIED";
    AgentTrustLevel["PREMIUM"] = "PREMIUM";
    AgentTrustLevel["ADMIN"] = "ADMIN";
})(AgentTrustLevel || (exports.AgentTrustLevel = AgentTrustLevel = {}));
/**
 * Permission flags for agent capabilities
 */
var AgentPermission;
(function (AgentPermission) {
    // Basic API access
    AgentPermission["API_READ"] = "api:read";
    AgentPermission["API_WRITE"] = "api:write";
    // Agent operations
    AgentPermission["AGENT_CREATE"] = "agent:create";
    AgentPermission["AGENT_READ"] = "agent:read";
    AgentPermission["AGENT_UPDATE"] = "agent:update";
    AgentPermission["AGENT_DELETE"] = "agent:delete";
    // Workflow operations
    AgentPermission["WORKFLOW_CREATE"] = "workflow:create";
    AgentPermission["WORKFLOW_EXECUTE"] = "workflow:execute";
    AgentPermission["WORKFLOW_MANAGE"] = "workflow:manage";
    // Task operations
    AgentPermission["TASK_CREATE"] = "task:create";
    AgentPermission["TASK_EXECUTE"] = "task:execute";
    AgentPermission["TASK_MANAGE"] = "task:manage";
    // Advanced features
    AgentPermission["INTEGRATION_CONNECT"] = "integration:connect";
    AgentPermission["WEBHOOK_MANAGE"] = "webhook:manage";
    AgentPermission["API_KEY_GENERATE"] = "api_key:generate";
    // Admin only
    AgentPermission["USER_MANAGE"] = "user:manage";
    AgentPermission["SYSTEM_CONFIG"] = "system:config";
    AgentPermission["BILLING_MANAGE"] = "billing:manage";
    AgentPermission["AUDIT_ACCESS"] = "audit:access";
})(AgentPermission || (exports.AgentPermission = AgentPermission = {}));
/**
 * Default permission configuration per trust level
 */
exports.TRUST_LEVEL_CONFIG = {
    [AgentTrustLevel.EPHEMERAL]: {
        trustLevel: AgentTrustLevel.EPHEMERAL,
        permissions: [
            AgentPermission.API_READ,
            AgentPermission.AGENT_READ,
            AgentPermission.TASK_CREATE,
            AgentPermission.TASK_EXECUTE,
        ],
        rateLimit: {
            requestsPerMinute: 10,
            requestsPerHour: 100,
            requestsPerDay: 500,
        },
        features: {
            maxAgents: 1,
            maxWorkflows: 0,
            maxTasksPerDay: 10,
            priority: 'low',
            support: 'community',
        },
    },
    [AgentTrustLevel.VERIFIED]: {
        trustLevel: AgentTrustLevel.VERIFIED,
        permissions: [
            AgentPermission.API_READ,
            AgentPermission.API_WRITE,
            AgentPermission.AGENT_CREATE,
            AgentPermission.AGENT_READ,
            AgentPermission.AGENT_UPDATE,
            AgentPermission.WORKFLOW_CREATE,
            AgentPermission.WORKFLOW_EXECUTE,
            AgentPermission.TASK_CREATE,
            AgentPermission.TASK_EXECUTE,
            AgentPermission.INTEGRATION_CONNECT,
        ],
        rateLimit: {
            requestsPerMinute: 100,
            requestsPerHour: 1000,
            requestsPerDay: 10000,
        },
        features: {
            maxAgents: 5,
            maxWorkflows: 10,
            maxTasksPerDay: 500,
            priority: 'medium',
            support: 'email',
        },
    },
    [AgentTrustLevel.PREMIUM]: {
        trustLevel: AgentTrustLevel.PREMIUM,
        permissions: [
            AgentPermission.API_READ,
            AgentPermission.API_WRITE,
            AgentPermission.AGENT_CREATE,
            AgentPermission.AGENT_READ,
            AgentPermission.AGENT_UPDATE,
            AgentPermission.AGENT_DELETE,
            AgentPermission.WORKFLOW_CREATE,
            AgentPermission.WORKFLOW_EXECUTE,
            AgentPermission.WORKFLOW_MANAGE,
            AgentPermission.TASK_CREATE,
            AgentPermission.TASK_EXECUTE,
            AgentPermission.TASK_MANAGE,
            AgentPermission.INTEGRATION_CONNECT,
            AgentPermission.WEBHOOK_MANAGE,
            AgentPermission.API_KEY_GENERATE,
        ],
        rateLimit: {
            requestsPerMinute: 1000,
            requestsPerHour: 10000,
            requestsPerDay: 100000,
        },
        features: {
            maxAgents: 50,
            maxWorkflows: 100,
            maxTasksPerDay: 10000,
            priority: 'high',
            support: 'priority',
        },
    },
    [AgentTrustLevel.ADMIN]: {
        trustLevel: AgentTrustLevel.ADMIN,
        permissions: Object.values(AgentPermission), // All permissions
        rateLimit: {
            requestsPerMinute: -1, // Unlimited
            requestsPerHour: -1,
            requestsPerDay: -1,
        },
        features: {
            maxAgents: -1, // Unlimited
            maxWorkflows: -1,
            maxTasksPerDay: -1,
            priority: 'critical',
            support: 'dedicated',
        },
    },
};
/**
 * Helper function to get trust level config
 */
function getTrustLevelConfig(trustLevel) {
    return exports.TRUST_LEVEL_CONFIG[trustLevel];
}
/**
 * Helper function to check if a trust level has a specific permission
 */
function hasPermission(trustLevel, permission) {
    const config = exports.TRUST_LEVEL_CONFIG[trustLevel];
    return config.permissions.includes(permission);
}
/**
 * Helper function to get rate limits for a trust level
 */
function getRateLimits(trustLevel) {
    return exports.TRUST_LEVEL_CONFIG[trustLevel].rateLimit;
}
/**
 * Requirements for each trust level upgrade
 */
exports.TRUST_LEVEL_REQUIREMENTS = {
    [AgentTrustLevel.EPHEMERAL]: {
    // No requirements - default level
    },
    [AgentTrustLevel.VERIFIED]: {
        emailVerified: true,
        web3AuthVerified: false,
    },
    [AgentTrustLevel.PREMIUM]: {
        emailVerified: true,
        activeSubscription: true,
    },
    [AgentTrustLevel.ADMIN]: {
        emailVerified: true,
        adminApproval: true,
    },
};
//# sourceMappingURL=agent-trust.types.js.map