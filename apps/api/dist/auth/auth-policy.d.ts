export type AuthorizationLevel = 'public' | 'user' | 'admin' | 'system';
export type AuthPrincipal = {
    id?: string;
    email?: string | null;
    role?: string | null;
    roles?: unknown;
    permissions?: unknown;
};
export type InvitePolicy = {
    enabled: boolean;
    codes: Set<string>;
};
type ConfigReader = {
    get?: (key: string) => string | undefined;
};
export declare function normalizeRole(value: string): string;
export declare function resolveRoleClaims(principal: Pick<AuthPrincipal, 'role' | 'roles'>): string[];
export declare function resolvePermissionClaims(principal: Pick<AuthPrincipal, 'permissions' | 'role' | 'roles'>, resolvedRoles: string[]): string[];
export declare function isMasterSuperAdminEmail(email: string | null | undefined): boolean;
export declare function hasPermission(principal: AuthPrincipal, permission: string): boolean;
export declare function isPrivilegedUser(principal: AuthPrincipal): boolean;
export declare function hasAuthorizationLevel(principal: AuthPrincipal | null | undefined, requiredLevel: AuthorizationLevel): boolean;
export declare function resolveInvitePolicy(config?: ConfigReader): InvitePolicy;
export declare function isInviteCodeAccepted(inviteCode: string | undefined, policy: InvitePolicy): boolean;
export {};
//# sourceMappingURL=auth-policy.d.ts.map