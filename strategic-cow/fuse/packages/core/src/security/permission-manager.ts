/**
 * TNF Permission Manager
 *
 * This module enforces access control for documents and knowledge based on TNF membership levels.
 * SUPER_ADMIN (Daniel) has full access to everything.
 */

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  AGENCY_OWNER = 'AGENCY_OWNER',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  AGENCY_MANAGER = 'AGENCY_MANAGER',
  AGENT_OPERATOR = 'AGENT_OPERATOR',
}

export enum SubscriptionTier {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface Permission {
  id: string;
  documentPath: string;
  minRole: UserRole;
  minTier?: SubscriptionTier;
  authorizedAgents?: string[]; // IDs of agents granted explicit access
  description?: string;
}

export class PermissionManager {
  private static permissions: Permission[] = [
    {
      id: 'infra-api-gateway',
      documentPath: 'docs/infrastructure/',
      minRole: UserRole.ADMIN,
      minTier: SubscriptionTier.ENTERPRISE,
      description: 'TNF API Gateway details',
    },
    {
      id: 'infra-architecture',
      documentPath: 'docs/architecture/',
      minRole: UserRole.ADMIN,
      minTier: SubscriptionTier.ENTERPRISE,
      description: 'TNF Core Architecture',
    },
    {
      id: 'agent-configs',
      documentPath: '.claude/agents/',
      minRole: UserRole.ADMIN,
      description: 'Agent knowledge bases and configs',
    },
    {
      id: 'personal-PII',
      documentPath: 'docs/personal/',
      minRole: UserRole.SUPER_ADMIN,
      description: 'Personal info and PII',
    },
    {
      id: 'business-logic',
      documentPath: 'docs/business/',
      minRole: UserRole.SUPER_ADMIN,
      description: 'Business models and monetization',
    },
  ];

  /**
   * Check if a role and tier can access a document path
   */
  public static canAccess(
    role: UserRole,
    tier: SubscriptionTier,
    documentPath: string,
    agentId?: string,
  ): boolean {
    // Super Admin always has access
    if (role === UserRole.SUPER_ADMIN) return true;

    const permission = this.permissions.find((p) => documentPath.startsWith(p.documentPath));

    if (!permission) {
      // Default to allowing agents access to generic docs
      return true;
    }

    // Check role-based access
    const roleValues = Object.values(UserRole);
    const userRoleIndex = roleValues.indexOf(role);
    const minRoleIndex = roleValues.indexOf(permission.minRole);

    // Roles are ordered by priority (USER=0, ADMIN=1, SUPER_ADMIN=2...)
    // Wait, UserRole enum order in enums.ts: USER, ADMIN, SUPER_ADMIN...
    // So higher index means higher privilege.
    if (userRoleIndex < minRoleIndex) {
      return false;
    }

    // Check tier-based access
    if (permission.minTier) {
      const tierValues = Object.values(SubscriptionTier);
      const userTierIndex = tierValues.indexOf(tier);
      const minTierIndex = tierValues.indexOf(permission.minTier);

      if (userTierIndex < minTierIndex) {
        return false;
      }
    }

    // Check explicit agent authorization (override)
    if (agentId && permission.authorizedAgents?.includes(agentId)) {
      return true;
    }

    return true;
  }
}
