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
export enum AgentTrustLevel {
  EPHEMERAL = 'EPHEMERAL',
  VERIFIED = 'VERIFIED',
  PREMIUM = 'PREMIUM',
  ADMIN = 'ADMIN',
}

/**
 * Permission flags for agent capabilities
 */
export enum AgentPermission {
  // Basic API access
  API_READ = 'api:read',
  API_WRITE = 'api:write',
  
  // Agent operations
  AGENT_CREATE = 'agent:create',
  AGENT_READ = 'agent:read',
  AGENT_UPDATE = 'agent:update',
  AGENT_DELETE = 'agent:delete',
  
  // Workflow operations
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_EXECUTE = 'workflow:execute',
  WORKFLOW_MANAGE = 'workflow:manage',
  
  // Task operations
  TASK_CREATE = 'task:create',
  TASK_EXECUTE = 'task:execute',
  TASK_MANAGE = 'task:manage',
  
  // Advanced features
  INTEGRATION_CONNECT = 'integration:connect',
  WEBHOOK_MANAGE = 'webhook:manage',
  API_KEY_GENERATE = 'api_key:generate',
  
  // Admin only
  USER_MANAGE = 'user:manage',
  SYSTEM_CONFIG = 'system:config',
  BILLING_MANAGE = 'billing:manage',
  AUDIT_ACCESS = 'audit:access',
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
export const TRUST_LEVEL_CONFIG: Record<AgentTrustLevel, TrustLevelPermissions> = {
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
export function getTrustLevelConfig(trustLevel: AgentTrustLevel): TrustLevelPermissions {
  return TRUST_LEVEL_CONFIG[trustLevel];
}

/**
 * Helper function to check if a trust level has a specific permission
 */
export function hasPermission(trustLevel: AgentTrustLevel, permission: AgentPermission): boolean {
  const config = TRUST_LEVEL_CONFIG[trustLevel];
  return config.permissions.includes(permission);
}

/**
 * Helper function to get rate limits for a trust level
 */
export function getRateLimits(trustLevel: AgentTrustLevel): TrustLevelPermissions['rateLimit'] {
  return TRUST_LEVEL_CONFIG[trustLevel].rateLimit;
}

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
export const TRUST_LEVEL_REQUIREMENTS: Record<AgentTrustLevel, TrustLevelRequirements> = {
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
