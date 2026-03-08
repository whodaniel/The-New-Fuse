import type { User } from '../types/auth';

const MASTER_SUPER_ADMIN_EMAILS = (
  import.meta.env.VITE_MASTER_SUPER_ADMIN_EMAILS || 'owner@example.com'
)
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

type AccessRole = 'guest' | 'member' | 'creator' | 'admin' | 'super_admin' | 'ai_agent';

export interface AccessContext {
  roles: AccessRole[];
  isMember: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const normalizeRole = (value: string): AccessRole | null => {
  const role = value.trim().toLowerCase();
  if (role === 'super_admin' || role === 'super-admin' || role === 'superadmin') {
    return 'super_admin';
  }
  if (role === 'admin' || role === 'administrator') {
    return 'admin';
  }
  if (role === 'creator' || role === 'producer') {
    return 'creator';
  }
  if (role === 'member' || role === 'pro' || role === 'premium') {
    return 'member';
  }
  if (role === 'ai_agent' || role === 'agent') {
    return 'ai_agent';
  }
  if (role === 'guest') {
    return 'guest';
  }
  return null;
};

export const deriveAccessContext = (user: User | null | undefined): AccessContext => {
  if (!user) {
    return {
      roles: ['guest'],
      isMember: false,
      isAdmin: false,
      isSuperAdmin: false,
    };
  }

  const roles = new Set<AccessRole>();
  const email = (user.email || '').toLowerCase().trim();
  const candidateRoles = [user.role || '', ...(user.roles || [])];

  for (const value of candidateRoles) {
    const normalized = normalizeRole(String(value || ''));
    if (normalized) roles.add(normalized);
  }

  const isSuperAdmin = MASTER_SUPER_ADMIN_EMAILS.includes(email) || roles.has('super_admin');
  if (isSuperAdmin) {
    roles.add('super_admin');
    roles.add('admin');
  }

  const hasMembershipSignal =
    (user.membershipStatus || '').toLowerCase() === 'active' ||
    !!user.subscriptionTier ||
    roles.has('member') ||
    roles.has('creator') ||
    roles.has('admin') ||
    roles.has('super_admin');

  if (hasMembershipSignal) {
    roles.add('member');
  }

  if (roles.size === 0) {
    roles.add('guest');
  }

  const isAdmin = roles.has('admin') || roles.has('super_admin');

  return {
    roles: Array.from(roles),
    isMember: roles.has('member'),
    isAdmin,
    isSuperAdmin,
  };
};

export const canViewInternalEconomics = (ctx: AccessContext): boolean =>
  ctx.isAdmin || ctx.roles.includes('ai_agent');

export const canOpenAdminConsole = (ctx: AccessContext): boolean => ctx.isSuperAdmin;

export const canAccessGenesisProtocol = (ctx: AccessContext): boolean =>
  ctx.isAdmin || ctx.roles.includes('ai_agent');

export const canSubmitArcadeApps = (ctx: AccessContext): boolean =>
  ctx.isMember && (ctx.roles.includes('creator') || ctx.isAdmin || ctx.roles.includes('ai_agent'));
