import type { User } from '@/AuthContext';

const FACTORS_KEY = 'tnf.userFactors.v1';

export interface UserSessionFactors {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  roles?: string[];
  tenantId?: string;
  agencyId?: string;
  /** Free-form operator goals / notes the user wants agents to remember. */
  goals?: string[];
  /** Optional named profile within the user (e.g. "founder", "dev"). */
  activeProfile?: string;
  /** Domains of interest for personalization. */
  domains?: string[];
  bootstrappedAt?: string;
  updatedAt: string;
}

export function readUserSessionFactors(): UserSessionFactors | null {
  try {
    const raw = localStorage.getItem(FACTORS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSessionFactors;
  } catch {
    return null;
  }
}

/**
 * Merge signed-in auth identity into local personalization factors.
 * Called on login / bootstrap so AI Assist and flywheels have a user spine immediately.
 */
export function bootstrapUserSessionFactors(
  user: User | null,
  extras?: Partial<UserSessionFactors>
): UserSessionFactors | null {
  if (!user?.id) return readUserSessionFactors();

  const existing = readUserSessionFactors();
  const next: UserSessionFactors = {
    ...existing,
    userId: user.id,
    email: user.email,
    name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    role: user.role,
    roles: user.roles,
    tenantId: user.tenantId,
    agencyId: user.agencyId,
    goals: extras?.goals ?? existing?.goals ?? [],
    activeProfile: extras?.activeProfile ?? existing?.activeProfile,
    domains: extras?.domains ?? existing?.domains ?? [],
    bootstrappedAt: existing?.bootstrappedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(FACTORS_KEY, JSON.stringify(next));
  return next;
}

export function updateUserSessionFactors(patch: Partial<UserSessionFactors>): UserSessionFactors {
  const existing = readUserSessionFactors() || {
    updatedAt: new Date().toISOString(),
  };
  const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  localStorage.setItem(FACTORS_KEY, JSON.stringify(next));
  return next;
}
