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

const DEFAULT_USER_ROLE = 'user';
const ROLE_SYSTEM = 'system';
const ROLE_ADMIN = 'admin';
const ROLE_SUPER_ADMIN = 'super_admin';

const ADMIN_PERMISSION = 'admin:access';
const SYSTEM_PERMISSION = 'system:access';
const HANDOFF_PUBLISH_PERMISSION = 'handoff:publish';
const HANDOFF_READ_ANY_PERMISSION = 'handoff:read:any';
const HANDOFF_ACK_ANY_PERMISSION = 'handoff:ack:any';
const DEFAULT_MASTER_SUPER_ADMIN_EMAIL = 'owner@example.com';

const INVITE_ONLY_KEYS = [
  'AUTH_INVITE_ONLY',
  'INVITE_ONLY',
  'INVITATION_ONLY',
  'REGISTRATION_INVITE_ONLY',
  'AUTH_REGISTRATION_INVITE_ONLY',
];

const INVITE_CODE_KEYS = [
  'AUTH_INVITE_CODES',
  'INVITE_CODES',
  'INVITATION_CODES',
  'REGISTRATION_INVITE_CODES',
  'PUBLIC_ROLLOUT_INVITE_CODES',
  'INVITE_CODE',
  'INVITATION_CODE',
  'REGISTRATION_INVITE_CODE',
];

export function normalizeRole(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (!normalized) {
    return '';
  }

  if (normalized === 'superadmin') {
    return ROLE_SUPER_ADMIN;
  }

  return normalized;
}

function normalizePermission(value: string): string {
  return value.trim().toLowerCase();
}

function collectRawRoles(principal: Pick<AuthPrincipal, 'role' | 'roles'>): string[] {
  const rawRoles = new Set<string>();
  const rolesCandidate = principal.roles;

  if (Array.isArray(rolesCandidate)) {
    for (const role of rolesCandidate) {
      if (typeof role === 'string' && role.trim().length > 0) {
        rawRoles.add(role.trim());
      }
    }
  }

  if (
    rawRoles.size === 0 &&
    typeof principal.role === 'string' &&
    principal.role.trim().length > 0
  ) {
    rawRoles.add(principal.role.trim());
  }

  return [...rawRoles];
}

export function resolveRoleClaims(principal: Pick<AuthPrincipal, 'role' | 'roles'>): string[] {
  const rawRoles = collectRawRoles(principal);
  const expandedRoles = new Set<string>();

  for (const role of rawRoles) {
    const normalized = normalizeRole(role);
    if (!normalized) {
      continue;
    }

    expandedRoles.add(normalized);
    if (normalized === ROLE_SUPER_ADMIN) {
      expandedRoles.add(ROLE_ADMIN);
      expandedRoles.add(ROLE_SYSTEM);
    }
  }

  if (rawRoles.length === 0 && expandedRoles.size === 0) {
    expandedRoles.add(DEFAULT_USER_ROLE);
  }

  return [...rawRoles, ...expandedRoles];
}

export function resolvePermissionClaims(
  principal: Pick<AuthPrincipal, 'permissions' | 'role' | 'roles'>,
  resolvedRoles: string[]
): string[] {
  const permissions = new Set<string>();
  const rawPermissions = principal.permissions;

  if (Array.isArray(rawPermissions)) {
    for (const permission of rawPermissions) {
      if (typeof permission === 'string' && permission.trim().length > 0) {
        permissions.add(permission.trim());
      }
    }
  }

  const normalizedRoles = new Set(
    resolvedRoles.map((role) => normalizeRole(role)).filter((role) => role.length > 0)
  );
  const hasSystem = normalizedRoles.has(ROLE_SYSTEM);
  const hasAdmin = normalizedRoles.has(ROLE_ADMIN) || hasSystem;

  if (hasSystem) {
    permissions.add(SYSTEM_PERMISSION);
  }

  if (hasAdmin) {
    permissions.add(ADMIN_PERMISSION);
    permissions.add(HANDOFF_PUBLISH_PERMISSION);
    permissions.add(HANDOFF_READ_ANY_PERMISSION);
    permissions.add(HANDOFF_ACK_ANY_PERMISSION);
  }

  return [...permissions];
}

function normalizedRoleSet(principal: AuthPrincipal): Set<string> {
  const roleSet = new Set<string>();
  for (const role of resolveRoleClaims(principal)) {
    const normalized = normalizeRole(role);
    if (normalized) {
      roleSet.add(normalized);
    }
  }
  if (isMasterSuperAdminEmail(principal.email)) {
    roleSet.add(ROLE_SUPER_ADMIN);
    roleSet.add(ROLE_ADMIN);
    roleSet.add(ROLE_SYSTEM);
  }
  return roleSet;
}

function masterSuperAdminEmails(): string[] {
  return (
    process.env.MASTER_SUPER_ADMIN_EMAILS ||
    process.env.HOSTMARIA_OWNER_EMAILS ||
    DEFAULT_MASTER_SUPER_ADMIN_EMAIL
  )
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export function isMasterSuperAdminEmail(email: string | null | undefined): boolean {
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalizedEmail) {
    return false;
  }
  return masterSuperAdminEmails().includes(normalizedEmail);
}

function normalizedPermissionSet(principal: AuthPrincipal): Set<string> {
  const permissionSet = new Set<string>();
  const rawPermissions = principal.permissions;
  if (!Array.isArray(rawPermissions)) {
    return permissionSet;
  }
  for (const permission of rawPermissions) {
    if (typeof permission === 'string' && permission.trim().length > 0) {
      permissionSet.add(normalizePermission(permission));
    }
  }
  return permissionSet;
}

export function hasPermission(principal: AuthPrincipal, permission: string): boolean {
  if (!permission.trim()) {
    return false;
  }
  const permissions = normalizedPermissionSet(principal);
  return permissions.has(normalizePermission(permission));
}

export function isPrivilegedUser(principal: AuthPrincipal): boolean {
  const roles = normalizedRoleSet(principal);
  if (roles.has(ROLE_SYSTEM) || roles.has(ROLE_ADMIN) || roles.has(ROLE_SUPER_ADMIN)) {
    return true;
  }
  return hasPermission(principal, SYSTEM_PERMISSION) || hasPermission(principal, ADMIN_PERMISSION);
}

export function hasAuthorizationLevel(
  principal: AuthPrincipal | null | undefined,
  requiredLevel: AuthorizationLevel
): boolean {
  if (requiredLevel === 'public') {
    return true;
  }

  if (!principal) {
    return false;
  }

  if (requiredLevel === 'user') {
    return true;
  }

  if (requiredLevel === 'system') {
    const roles = normalizedRoleSet(principal);
    return roles.has(ROLE_SYSTEM) || hasPermission(principal, SYSTEM_PERMISSION);
  }

  if (requiredLevel === 'admin') {
    const roles = normalizedRoleSet(principal);
    return (
      roles.has(ROLE_SYSTEM) ||
      roles.has(ROLE_ADMIN) ||
      roles.has(ROLE_SUPER_ADMIN) ||
      hasPermission(principal, SYSTEM_PERMISSION) ||
      hasPermission(principal, ADMIN_PERMISSION)
    );
  }

  return false;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function parseCodes(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item: any) => item.trim())
          .filter((item: any) => item.length > 0);
      }
    } catch {
      // Fallback to delimiter parsing below.
    }
  }

  return trimmed
    .split(/[,\n;]+/)
    .map((code) => code.trim())
    .filter((code) => code.length > 0);
}

function readConfigValue(config: ConfigReader | undefined, key: string): string | undefined {
  const fromConfig = config?.get?.(key);
  if (typeof fromConfig === 'string') {
    return fromConfig;
  }

  const fromEnv = process.env[key];
  return typeof fromEnv === 'string' ? fromEnv : undefined;
}

export function resolveInvitePolicy(config?: ConfigReader): InvitePolicy {
  const enabled = INVITE_ONLY_KEYS.some((key: any) => parseBoolean(readConfigValue(config, key)));
  const codes = new Set<string>();

  for (const key of INVITE_CODE_KEYS) {
    const raw = readConfigValue(config, key);
    for (const code of parseCodes(raw)) {
      codes.add(code);
    }
  }

  return { enabled, codes };
}

export function isInviteCodeAccepted(
  inviteCode: string | undefined,
  policy: InvitePolicy
): boolean {
  if (!policy.enabled) {
    return true;
  }

  if (!inviteCode) {
    return false;
  }

  const normalized = inviteCode.trim();
  if (!normalized) {
    return false;
  }

  return policy.codes.has(normalized);
}
