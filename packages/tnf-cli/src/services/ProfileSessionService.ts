/**
 * Profile-session gate for local TNF CLI multi-user profiles.
 * Distinct from provider AuthService (LLM/OAuth credentials).
 *
 * identity/profile ≠ authentication ≠ capability ≠ authority
 * `tnf profile login` authenticates only; mutation needs authority separately.
 */
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { AuthService } from './AuthService.js';
import { resolveActiveProfileName } from './AgentStateLedgerService.js';
import { ProfileSession, ProfileWhoAmI } from './agent-state-types.js';

const DEFAULT_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface ProfileSessionServiceOptions {
  tnfHome?: string;
  sessionTtlMs?: number;
  now?: () => Date;
  cloudEndpointDefault?: string;
}

export class ProfileSessionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ProfileSessionError';
  }
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function hashPassphrase(passphrase: string, salt: Buffer): string {
  return scryptSync(passphrase, salt, 32).toString('hex');
}

export class ProfileSessionService {
  private tnfHome: string;
  private sessionTtlMs: number;
  private now: () => Date;
  private cloudEndpointDefault: string;

  constructor(options: ProfileSessionServiceOptions = {}) {
    this.tnfHome = options.tnfHome || process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
    this.sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
    this.now = options.now || (() => new Date());
    this.cloudEndpointDefault =
      options.cloudEndpointDefault ||
      process.env.TNF_CLOUD_ENDPOINT ||
      'https://app.thenewfuse.com';
  }

  profilesDir(): string {
    return path.join(this.tnfHome, 'profiles');
  }

  profileDir(profile: string): string {
    return path.join(this.profilesDir(), profile);
  }

  profileJsonPath(profile: string): string {
    return path.join(this.profilesDir(), `${profile}.json`);
  }

  sessionPath(profile: string): string {
    return path.join(this.profileDir(profile), 'session.json');
  }

  secretsPath(profile: string): string {
    return path.join(this.profileDir(profile), 'auth-secret.json');
  }

  listProfiles(): string[] {
    const dir = this.profilesDir();
    if (!fs.existsSync(dir)) return [];
    const names = new Set<string>();
    for (const entry of fs.readdirSync(dir)) {
      if (entry.endsWith('.json') && entry !== 'active.json' && entry !== 'user-profile-schema.json') {
        names.add(entry.replace(/\.json$/, ''));
      }
      const full = path.join(dir, entry);
      try {
        if (fs.statSync(full).isDirectory()) names.add(entry);
      } catch {
        // ignore
      }
    }
    return [...names].sort();
  }

  getActiveProfileName(): string {
    return resolveActiveProfileName(this.tnfHome);
  }

  setActiveProfile(profile: string): void {
    ensureDir(this.profilesDir());
    fs.writeFileSync(path.join(this.profilesDir(), 'default'), `${profile}\n`, { mode: 0o600 });
    const profilePath = this.profileJsonPath(profile);
    if (fs.existsSync(profilePath)) {
      fs.copyFileSync(profilePath, path.join(this.profilesDir(), 'active.json'));
    }
  }

  readProfile(profile: string): Record<string, unknown> | null {
    return readJson<Record<string, unknown>>(this.profileJsonPath(profile));
  }

  readSession(profile?: string): ProfileSession | null {
    const name = profile || this.getActiveProfileName();
    const session = readJson<ProfileSession>(this.sessionPath(name));
    if (!session) return null;
    const expires = Date.parse(session.expiresAt);
    if (!Number.isFinite(expires) || expires <= this.now().getTime()) return null;
    return session;
  }

  isAuthenticated(profile?: string): boolean {
    return !!this.readSession(profile);
  }

  requireActiveSession(profile?: string): ProfileSession {
    const name = profile || this.getActiveProfileName();
    const session = this.readSession(name);
    if (!session) {
      throw new ProfileSessionError(
        'UNAUTHENTICATED',
        `No active session for profile '${name}'. Run: tnf profile login`
      );
    }
    return session;
  }

  /**
   * Authentication proves identity. Mutation still needs authority from
   * ~/.tnf/authority. Login alone never grants mutation authority.
   */
  requireMutationAuthority(options: {
    profile?: string;
    agentId?: string;
    allowedRoles?: string[];
    action?: string;
  } = {}): {
    session: ProfileSession;
    authorityRole: string | null;
    rolesPath: string;
  } {
    const session = this.requireActiveSession(options.profile);
    const rolesPath = path.join(this.tnfHome, 'authority', 'roles.json');
    const rolesDoc = readJson<{ agents?: Record<string, { role?: string }> }>(rolesPath);
    const agentId = options.agentId || process.env.TNF_AGENT_ID || '';
    const authorityRole =
      agentId && rolesDoc?.agents?.[agentId]?.role ? String(rolesDoc.agents[agentId].role) : null;

    const isAgentContext = Boolean(process.env.TNF_AGENT_ID || process.env.AGENT_ID);
    if (isAgentContext) {
      const allowed = (options.allowedRoles || ['sub-director', 'director', 'operator']).map((r) =>
        r.toLowerCase()
      );
      if (!authorityRole || !allowed.includes(authorityRole.toLowerCase())) {
        throw new ProfileSessionError(
          'UNAUTHORIZED',
          `Authenticated profile '${session.profile}' lacks authority for ${
            options.action || 'mutation'
          } (role=${authorityRole || 'none'}). Authentication ≠ authorization.`
        );
      }
    } else if (!fs.existsSync(rolesPath) && !fs.existsSync(path.join(this.tnfHome, 'authority'))) {
      throw new ProfileSessionError(
        'UNAUTHORIZED',
        `Authenticated but authority root missing at ${path.join(this.tnfHome, 'authority')}. ` +
          'Profile login does not grant mutation authority.'
      );
    }

    return { session, authorityRole, rolesPath };
  }

  login(options: {
    profile?: string;
    passphrase?: string;
    identityMode?: ProfileSession['identityMode'];
    cloud?: boolean;
    cloudEndpoint?: string;
  } = {}): ProfileSession {
    const profile = options.profile || this.getActiveProfileName();
    ensureDir(this.profileDir(profile));

    if (!fs.existsSync(this.profileJsonPath(profile))) {
      const stub = {
        profileName: profile,
        callsign: profile,
        identityMode: options.identityMode || 'local',
        createdAt: this.now().toISOString(),
        updatedAt: this.now().toISOString(),
        services: {},
      };
      fs.writeFileSync(this.profileJsonPath(profile), `${JSON.stringify(stub, null, 2)}\n`, {
        mode: 0o600,
      });
    }

    const secretsFile = this.secretsPath(profile);
    let secrets = readJson<{ salt: string; hash: string }>(secretsFile);
    const passphrase = options.passphrase || process.env.TNF_PROFILE_PASSPHRASE || '';

    if (!secrets) {
      const salt = randomBytes(16);
      const hash = passphrase
        ? hashPassphrase(passphrase, salt)
        : createHash('sha256')
            .update(`local:${profile}:${randomBytes(8).toString('hex')}`)
            .digest('hex');
      secrets = { salt: salt.toString('hex'), hash };
      fs.writeFileSync(secretsFile, `${JSON.stringify(secrets, null, 2)}\n`, { mode: 0o600 });
    } else if (passphrase) {
      const salt = Buffer.from(secrets.salt, 'hex');
      const candidate = Buffer.from(hashPassphrase(passphrase, salt), 'hex');
      const expected = Buffer.from(secrets.hash, 'hex');
      if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
        throw new ProfileSessionError('INVALID_CREDENTIALS', 'Invalid profile passphrase');
      }
    }

    const profileDoc = this.readProfile(profile) || {};
    const identityMode =
      options.identityMode ||
      (String(profileDoc.identityMode || 'local') as ProfileSession['identityMode']);
    const cloudEndpoint =
      options.cloudEndpoint || String(profileDoc.cloudEndpoint || this.cloudEndpointDefault);
    const cloudLinked = Boolean(options.cloud) && identityMode === 'cloud';

    const authenticatedAt = this.now();
    const session: ProfileSession = {
      profile,
      sessionId: randomBytes(16).toString('hex'),
      authenticatedAt: authenticatedAt.toISOString(),
      expiresAt: new Date(authenticatedAt.getTime() + this.sessionTtlMs).toISOString(),
      identityMode,
      cloudEndpoint: cloudLinked || identityMode === 'cloud' ? cloudEndpoint : undefined,
      cloudLinked,
    };

    fs.writeFileSync(this.sessionPath(profile), `${JSON.stringify(session, null, 2)}\n`, {
      mode: 0o600,
    });
    this.setActiveProfile(profile);
    return session;
  }

  logout(profile?: string): boolean {
    const name = profile || this.getActiveProfileName();
    const sessionFile = this.sessionPath(name);
    if (!fs.existsSync(sessionFile)) return false;
    fs.unlinkSync(sessionFile);
    return true;
  }

  whoami(): ProfileWhoAmI {
    const profile = this.getActiveProfileName();
    const session = this.readSession(profile);
    const profileDoc = this.readProfile(profile);
    const rolesPath = path.join(this.tnfHome, 'authority', 'roles.json');
    const rolesDoc = readJson<{ agents?: Record<string, { role?: string }> }>(rolesPath);
    const agentRoles: Record<string, string> = {};
    if (rolesDoc?.agents) {
      for (const [id, row] of Object.entries(rolesDoc.agents)) {
        if (row?.role) agentRoles[id] = String(row.role);
      }
    }
    let elevationPendingCount = 0;
    try {
      const pendingDir = path.join(this.tnfHome, 'authority', 'pending');
      if (fs.existsSync(pendingDir)) {
        elevationPendingCount = fs.readdirSync(pendingDir).filter((n) => n.endsWith('.json')).length;
      }
    } catch {
      // ignore
    }

    let providerAuthConfigured: string[] = [];
    try {
      providerAuthConfigured = new AuthService()
        .listProviders()
        .filter((p) => p.configured || p.authenticated)
        .map((p) => p.name);
    } catch {
      providerAuthConfigured = [];
    }

    return {
      identity: {
        profile,
        identityMode: session?.identityMode || (profileDoc?.identityMode as string) || null,
        profileDocPresent: !!profileDoc,
      },
      authentication: {
        authenticated: !!session,
        session,
      },
      capability: {
        note: 'Provider credentials (tnf auth) and agent tools are capabilities, not TNF authority.',
        providerAuthConfigured,
      },
      authority: {
        note: 'Mutation authority comes from ~/.tnf/authority (roles/elevation), not profile login.',
        rolesPath,
        rolesPresent: fs.existsSync(rolesPath),
        agentRoles,
        elevationPendingCount,
      },
      disclaimer:
        'identity/profile ≠ authentication ≠ capability ≠ authority. tnf profile login authenticates only.',
    };
  }

  switchProfile(profile: string, options: { requireLogin?: boolean } = {}): ProfileSession | null {
    if (!this.listProfiles().includes(profile) && !fs.existsSync(this.profileJsonPath(profile))) {
      throw new ProfileSessionError('UNKNOWN_PROFILE', `Unknown profile '${profile}'`);
    }
    this.setActiveProfile(profile);
    const session = this.readSession(profile);
    if (options.requireLogin !== false && !session) {
      throw new ProfileSessionError(
        'UNAUTHENTICATED',
        `Switched to '${profile}' but no active session. Run: tnf profile login --profile ${profile}`
      );
    }
    return session;
  }
}
