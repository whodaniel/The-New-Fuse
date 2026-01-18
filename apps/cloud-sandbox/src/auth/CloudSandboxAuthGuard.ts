/**
 * Cloud Sandbox Authentication Guard
 *
 * Secures MCP tool access with multi-tenant RBAC for both AI agents and human users.
 *
 * Security Features:
 * - JWT token validation for agents and users
 * - API key authentication for agents
 * - Role-based access control (RBAC)
 * - Multi-tenant isolation
 * - Capability-based permissions
 * - Audit logging
 */

import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@the-new-fuse/database';

export interface AuthenticatedUser {
  id: string;
  type: 'agent' | 'human';
  role: string;
  tenantId: string;
  capabilities: string[];
  permissions: string[];
  agencyId?: string;
}

export interface AuthenticationResult {
  authenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Cloud Sandbox Authentication Guard
 */
export class CloudSandboxAuthGuard {
  private readonly logger = new Logger(CloudSandboxAuthGuard.name);
  private readonly jwtService: JwtService;
  private readonly db: DatabaseService;

  constructor(jwtService: JwtService, db: DatabaseService) {
    this.jwtService = jwtService;
    this.db = db;
  }

  /**
   * Authenticate incoming WebSocket connection
   *
   * @param headers Connection headers containing auth credentials
   * @returns Authentication result with user context
   */
  async authenticateConnection(headers: Record<string, string>): Promise<AuthenticationResult> {
    try {
      // Try JWT token authentication first
      const token = this.extractBearerToken(headers);
      if (token) {
        return await this.validateJwtToken(token);
      }

      // Try API key authentication (for agents)
      const apiKey = this.extractApiKey(headers);
      if (apiKey) {
        return await this.validateAgentApiKey(apiKey);
      }

      // No valid authentication found
      return {
        authenticated: false,
        error: 'No valid authentication credentials provided',
      };
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Validate JWT token and extract user/agent information
   */
  private async validateJwtToken(token: string): Promise<AuthenticationResult> {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Handle agent tokens
      if (payload.type === 'agent' && payload.agentId) {
        const agent = await this.db.agents.findById(payload.agentId);

        if (!agent) {
          return { authenticated: false, error: 'Agent not found' };
        }

        if (agent.status === 'SUSPENDED' || agent.status === 'ARCHIVED') {
          return { authenticated: false, error: 'Agent is not active' };
        }

        // Get tenant ID from agent's workspace/user
        const tenantId = await this.getAgentTenantId(agent.id);

        return {
          authenticated: true,
          user: {
            id: agent.id,
            type: 'agent',
            role: 'AGENT_OPERATOR',
            tenantId,
            capabilities: (agent.capabilities as string[]) || [],
            permissions: payload.permissions || ['agent:communicate', 'agent:execute'],
            agencyId: agent.userId,
          },
        };
      }

      // Handle human user tokens
      if (payload.sub && payload.username) {
        const user = await this.db.users.findById(payload.sub);

        if (!user) {
          return { authenticated: false, error: 'User not found' };
        }

        if (!user.isActive) {
          return { authenticated: false, error: 'User account is inactive' };
        }

        // Get tenant ID from user's workspace
        const tenantId = await this.getUserTenantId(user.id);

        // Map user permissions based on role
        const permissions = this.getUserPermissions(user.role as string);

        return {
          authenticated: true,
          user: {
            id: user.id,
            type: 'human',
            role: user.role as string,
            tenantId,
            capabilities: [],
            permissions,
          },
        };
      }

      return { authenticated: false, error: 'Invalid token payload' };
    } catch (error) {
      this.logger.debug(`JWT validation failed: ${(error as Error).message}`);
      return { authenticated: false, error: 'Invalid or expired token' };
    }
  }

  /**
   * Validate agent API key
   */
  private async validateAgentApiKey(apiKey: string): Promise<AuthenticationResult> {
    if (!apiKey || apiKey.length < 32) {
      return { authenticated: false, error: 'Invalid API key format' };
    }

    try {
      // Find agent registration by API key
      const registration = await this.db.agents.findRegistrationByToken(apiKey);

      if (!registration) {
        this.logger.warn(`Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
        return { authenticated: false, error: 'Invalid API key' };
      }

      const agent = await this.db.agents.findById(registration.agentId);

      if (!agent) {
        return { authenticated: false, error: 'Agent not found' };
      }

      if (agent.status === 'SUSPENDED' || agent.status === 'ARCHIVED') {
        return { authenticated: false, error: 'Agent is not active' };
      }

      const tenantId = await this.getAgentTenantId(agent.id);

      return {
        authenticated: true,
        user: {
          id: agent.id,
          type: 'agent',
          role: 'AGENT_OPERATOR',
          tenantId,
          capabilities: (agent.capabilities as string[]) || [],
          permissions: ['agent:communicate', 'agent:execute'],
          agencyId: agent.userId,
        },
      };
    } catch (error) {
      this.logger.error(`API key validation error: ${(error as Error).message}`);
      return { authenticated: false, error: 'Authentication service unavailable' };
    }
  }

  /**
   * Extract Bearer token from headers
   */
  private extractBearerToken(headers: Record<string, string>): string | null {
    const authorization = headers.authorization || headers.Authorization;
    if (!authorization) return null;

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : null;
  }

  /**
   * Extract API key from headers
   */
  private extractApiKey(headers: Record<string, string>): string | null {
    return headers['x-agent-api-key'] || headers['x-api-key'] || null;
  }

  /**
   * Get tenant ID for an agent
   */
  private async getAgentTenantId(agentId: string): Promise<string> {
    // First try to find workspace the agent belongs to
    const workspace = await this.db.workspaces.findByAgentId(agentId);
    if (workspace) {
      return workspace.id;
    }

    // Fallback to user's default workspace
    const agent = await this.db.agents.findById(agentId);
    if (agent?.userId) {
      const userWorkspace = await this.db.workspaces.findByUserId(agent.userId);
      if (userWorkspace) {
        return userWorkspace.id;
      }
    }

    // Last resort: use agent ID as tenant
    return `agent:${agentId}`;
  }

  /**
   * Get tenant ID for a user
   */
  private async getUserTenantId(userId: string): Promise<string> {
    const workspace = await this.db.workspaces.findByUserId(userId);
    if (workspace) {
      return workspace.id;
    }

    // Fallback: use user ID as tenant
    return `user:${userId}`;
  }

  /**
   * Map user role to permissions
   */
  private getUserPermissions(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      SUPER_ADMIN: [
        'cloud-sandbox:admin',
        'cloud-sandbox:execute',
        'cloud-sandbox:browser',
        'cloud-sandbox:files',
        'cloud-sandbox:system',
        'cloud-sandbox:monitor',
      ],
      ADMIN: [
        'cloud-sandbox:execute',
        'cloud-sandbox:browser',
        'cloud-sandbox:files',
        'cloud-sandbox:monitor',
      ],
      AGENCY_OWNER: [
        'cloud-sandbox:execute',
        'cloud-sandbox:browser',
        'cloud-sandbox:files',
        'cloud-sandbox:monitor',
      ],
      AGENCY_ADMIN: ['cloud-sandbox:execute', 'cloud-sandbox:browser', 'cloud-sandbox:files'],
      AGENCY_MANAGER: ['cloud-sandbox:execute', 'cloud-sandbox:browser'],
      AGENT_OPERATOR: ['cloud-sandbox:execute', 'cloud-sandbox:browser'],
      USER: ['cloud-sandbox:execute'],
    };

    return permissionMap[role] || ['cloud-sandbox:execute'];
  }
}
