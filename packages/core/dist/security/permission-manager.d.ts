/**
 * TNF Permission Manager
 *
 * This module enforces access control for documents and knowledge based on TNF membership levels.
 * SUPER_ADMIN (Daniel) has full access to everything.
 */
export declare enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN",
    AGENCY_OWNER = "AGENCY_OWNER",
    AGENCY_ADMIN = "AGENCY_ADMIN",
    AGENCY_MANAGER = "AGENCY_MANAGER",
    AGENT_OPERATOR = "AGENT_OPERATOR"
}
export declare enum SubscriptionTier {
    STARTER = "STARTER",
    PRO = "PRO",
    ENTERPRISE = "ENTERPRISE"
}
export interface Permission {
    id: string;
    documentPath: string;
    minRole: UserRole;
    minTier?: SubscriptionTier;
    authorizedAgents?: string[];
    description?: string;
}
export declare class PermissionManager {
    private static permissions;
    /**
     * Check if a role and tier can access a document path
     */
    static canAccess(role: UserRole, tier: SubscriptionTier, documentPath: string, agentId?: string): boolean;
}
//# sourceMappingURL=permission-manager.d.ts.map