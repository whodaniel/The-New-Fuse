/**
 * Resolve the authenticated TNF account that owns personal/persona data.
 * Local ~/.tnf files are a cache; ownerAccountId is the cloud identity key.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface TnfAccountBinding {
  /** Canonical account email / id used on app.thenewfuse.com */
  tnfAccountId: string;
  /** Stable UUID for API owner fields (profile_id when available) */
  ownerUserId: string;
  profile: string;
  cloudEndpoint: string;
  identityMode: 'local' | 'cloud';
  cloudLinked: boolean;
  boundAt: string;
  source: 'profile' | 'env' | 'explicit';
}

const TNF_HOME = () => process.env.TNF_HOME || path.join(os.homedir(), '.tnf');

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Active profile name from profiles/active.json or default.
 */
export function resolveActiveProfileName(tnfHome = TNF_HOME()): string {
  const active = readJson<{ callsign?: string; profile_id?: string }>(
    path.join(tnfHome, 'profiles', 'active.json')
  );
  if (active?.callsign) return String(active.callsign);
  const env = process.env.TNF_ACTIVE_PROFILE || process.env.TNF_AGENT_PROFILE;
  if (env) return env;
  return 'default';
}

/**
 * Resolve binding for personal data ownership.
 * Precedence: TNF_ACCOUNT_ID env → active profile tnf_account_id → session cloudUserEmail.
 */
export function resolveAccountBinding(options?: {
  tnfHome?: string;
  explicitAccountId?: string;
}): TnfAccountBinding {
  const tnfHome = options?.tnfHome || TNF_HOME();
  const profile = resolveActiveProfileName(tnfHome);
  const profileDoc =
    readJson<Record<string, unknown>>(path.join(tnfHome, 'profiles', `${profile}.json`)) ||
    readJson<Record<string, unknown>>(path.join(tnfHome, 'profiles', 'active.json')) ||
    {};
  const session =
    readJson<Record<string, unknown>>(path.join(tnfHome, 'profiles', profile, 'session.json')) ||
    {};

  const fromEnv = (process.env.TNF_ACCOUNT_ID || process.env.TNF_CLOUD_ACCOUNT_EMAIL || '').trim();
  const fromProfile = String(
    profileDoc.tnf_account_id || profileDoc.accountEmail || profileDoc.tnfAccountId || ''
  ).trim();
  const fromSession = String(session.cloudUserEmail || '').trim();

  let tnfAccountId = (options?.explicitAccountId || fromEnv || fromProfile || fromSession).trim();
  // Guard against accidentally stored prompt text
  if (tnfAccountId && !looksLikeEmail(tnfAccountId) && !tnfAccountId.includes('@')) {
    if (looksLikeEmail(fromProfile)) tnfAccountId = fromProfile;
    else if (looksLikeEmail(fromEnv)) tnfAccountId = fromEnv;
  }
  if (!looksLikeEmail(tnfAccountId)) {
    // last resort: known active profile account
    const active = readJson<{ tnf_account_id?: string }>(
      path.join(tnfHome, 'profiles', 'active.json')
    );
    if (active?.tnf_account_id && looksLikeEmail(active.tnf_account_id)) {
      tnfAccountId = active.tnf_account_id;
    }
  }

  if (!tnfAccountId || !looksLikeEmail(tnfAccountId)) {
    throw new Error(
      'No TNF account email bound. Set profiles/active.json tnf_account_id (e.g. you@thenewfuse.com) or TNF_ACCOUNT_ID.'
    );
  }

  const ownerUserId = String(
    process.env.TNF_OWNER_USER_ID ||
      profileDoc.profile_id ||
      profileDoc.profileId ||
      (readJson<{ profile_id?: string }>(path.join(tnfHome, 'profiles', 'active.json'))
        ?.profile_id ??
        '')
  ).trim();

  if (!ownerUserId) {
    throw new Error(
      'No ownerUserId (profile_id) on active profile. Refusing to attach personal data without a stable user id.'
    );
  }

  const cloudEndpoint = String(
    session.cloudEndpoint ||
      profileDoc.cloudEndpoint ||
      process.env.TNF_CLOUD_ENDPOINT ||
      'https://app.thenewfuse.com'
  );
  const identityMode =
    String(session.identityMode || profileDoc.identityMode || 'local') === 'cloud'
      ? 'cloud'
      : 'local';

  return {
    tnfAccountId,
    ownerUserId,
    profile,
    cloudEndpoint,
    identityMode,
    cloudLinked: Boolean(session.cloudLinked) || identityMode === 'cloud',
    boundAt: new Date().toISOString(),
    source: options?.explicitAccountId ? 'explicit' : fromEnv ? 'env' : 'profile',
  };
}

export function persistAccountBinding(binding: TnfAccountBinding, tnfHome = TNF_HOME()): string {
  const p = path.join(tnfHome, 'account-binding.json');
  fs.mkdirSync(tnfHome, { recursive: true, mode: 0o700 });
  fs.writeFileSync(p, `${JSON.stringify(binding, null, 2)}\n`, { mode: 0o600 });
  return p;
}

export function readPersistedAccountBinding(tnfHome = TNF_HOME()): TnfAccountBinding | null {
  return readJson<TnfAccountBinding>(path.join(tnfHome, 'account-binding.json'));
}

/**
 * Root for account-scoped personal/credential data:
 *   <tnfHome>/accounts/<ownerUserId>/
 *
 * Personal and secret data is owned by the authenticated TNF account, not by
 * the machine home directory, so per-account surfaces nest under this root.
 * Fail closed: throws when no authenticated account (tnfAccountId +
 * ownerUserId) can be resolved — use for WRITE paths. For READ paths prefer
 * tryAccountScopedPath() plus a legacy flat-path fallback so unbound machines
 * keep working.
 */
export function accountScopedRoot(tnfHome = TNF_HOME()): string {
  const binding = resolveAccountBinding({ tnfHome });
  return path.join(tnfHome, 'accounts', binding.ownerUserId);
}

/** Fail-closed path under the authenticated account root. */
export function accountScopedPath(...segments: string[]): string {
  return path.join(accountScopedRoot(), ...segments);
}

/**
 * Best-effort account-scoped path for READ paths. Returns null when no
 * account binding is resolvable so callers can fall back to legacy flat
 * paths instead of throwing at startup.
 */
export function tryAccountScopedPath(...segments: string[]): string | null {
  try {
    return path.join(accountScopedRoot(), ...segments);
  } catch {
    return null;
  }
}
