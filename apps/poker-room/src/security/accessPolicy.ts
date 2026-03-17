import type { CommunityMembership } from '../api';

const MASTER_SUPER_ADMIN_EMAIL = 'owner@example.com';

type MembershipRole = 'admin' | 'super_admin' | 'creator' | 'member' | 'ai_agent' | 'unknown';

export interface PokerAccessContext {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  isMember: boolean;
  isProgrammaticAgent: boolean;
  canCreateTournaments: boolean;
  canCreateTables: boolean;
  canReadCommunityApps: boolean;
  canEngageCommunityApps: boolean;
  canSubmitCommunityApps: boolean;
  canAccessOperatorConsole: boolean;
  canUseProgrammaticApi: boolean;
}

export type PokerSurfaceGroup =
  | 'public_entry'
  | 'player_core'
  | 'player_hud'
  | 'member_social'
  | 'creator_studio'
  | 'operator_admin';

const normalizeMembershipRole = (value?: string): MembershipRole => {
  const role = String(value || '')
    .trim()
    .toLowerCase();
  if (role === 'super_admin' || role === 'super-admin' || role === 'superadmin') {
    return 'super_admin';
  }
  if (role === 'admin' || role === 'moderator') {
    return 'admin';
  }
  if (role === 'creator' || role === 'producer' || role === 'founding') {
    return 'creator';
  }
  if (role === 'member' || role === 'pro' || role === 'premium') {
    return 'member';
  }
  if (role === 'ai_agent' || role === 'agent' || role === 'bot') {
    return 'ai_agent';
  }
  return 'unknown';
};

export const derivePokerAccess = ({
  username,
  email,
  membership,
}: {
  username?: string;
  email?: string;
  membership?: CommunityMembership | null;
}): PokerAccessContext => {
  const normalizedRole = normalizeMembershipRole(membership?.role);
  const activeMembership = (membership?.status || '').toLowerCase() === 'active';
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedUsername = (username || '').trim().toLowerCase();

  const isProgrammaticAgent = normalizedRole === 'ai_agent';
  const isSuperAdmin =
    normalizedEmail === MASTER_SUPER_ADMIN_EMAIL ||
    normalizedUsername === 'bizsynth' ||
    normalizedRole === 'super_admin';
  const isAdmin = isSuperAdmin || normalizedRole === 'admin';
  const isCreator = isAdmin || normalizedRole === 'creator';
  const isMember =
    isCreator || activeMembership || normalizedRole === 'member' || isProgrammaticAgent;

  return {
    isSuperAdmin,
    isAdmin,
    isCreator,
    isMember,
    isProgrammaticAgent,
    canCreateTournaments: isCreator,
    canCreateTables: isCreator,
    canReadCommunityApps: true,
    canEngageCommunityApps: isMember,
    canSubmitCommunityApps: isMember,
    canAccessOperatorConsole: isAdmin,
    canUseProgrammaticApi: isProgrammaticAgent || isAdmin,
  };
};

export const canAccessPokerSurface = (
  ctx: PokerAccessContext,
  surface: PokerSurfaceGroup
): boolean => {
  switch (surface) {
    case 'public_entry':
      return true;
    case 'player_core':
    case 'player_hud':
      return ctx.isMember;
    case 'member_social':
      return ctx.canReadCommunityApps;
    case 'creator_studio':
      return ctx.isCreator;
    case 'operator_admin':
      return ctx.canAccessOperatorConsole;
    default:
      return false;
  }
};
