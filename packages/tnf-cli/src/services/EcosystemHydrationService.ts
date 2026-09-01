/**
 * Ecosystem orientation (cheap boot) vs task-scoped hydration (lazy/heavy).
 * Boot must not load the whole TNF universe.
 */
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { AuthService } from './AuthService.js';
import { AgentQuotaService } from './AgentQuotaService.js';
import { AgentStateLedgerService } from './AgentStateLedgerService.js';
import { ProfileSessionService } from './ProfileSessionService.js';
import {
  AGENT_STATE_SPEC,
  AgentStateEntry,
  EcosystemOrientSnapshot,
  EcosystemSnapshot,
} from './agent-state-types.js';

const requireFromHere = createRequire(import.meta.url);

export interface EcosystemHydrationOptions {
  tnfHome?: string;
  profile?: string;
  repoRoot?: string;
  profileSessions?: ProfileSessionService;
  ledger?: AgentStateLedgerService;
  quotas?: AgentQuotaService;
  auth?: AuthService;
  now?: () => Date;
  requireAuth?: boolean;
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function listJsonFiles(dir: string): unknown[] {
  if (!fs.existsSync(dir)) return [];
  const out: unknown[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    try {
      if (fs.statSync(full).isFile() && name.endsWith('.json')) {
        const data = readJson(full);
        if (data != null) out.push(data);
      }
    } catch {
      // ignore
    }
  }
  return out;
}

function resolveUserContextRoot(tnfHome: string, profile: string, repoRoot?: string): string {
  if (repoRoot) {
    try {
      const resolverPath = path.join(repoRoot, 'scripts/user-context/resolve-storage.cjs');
      const resolver = requireFromHere(resolverPath) as {
        resolveUserContextStorage?: (opts: Record<string, unknown>) => {
          providers?: { local?: { root?: string } };
        };
      };
      if (typeof resolver.resolveUserContextStorage === 'function') {
        const homeDir = os.homedir();
        const resolved = resolver.resolveUserContextStorage({
          homeDir,
          repoRoot,
          profileName: profile,
          env: { ...process.env, TNF_PROFILE: profile, HOME: homeDir },
        });
        const root = resolved?.providers?.local?.root;
        if (typeof root === 'string' && root) return root;
      }
    } catch {
      // fall through
    }
  }
  return path.join(tnfHome, 'user-context', 'data', profile);
}

export class EcosystemHydrationService {
  private tnfHome: string;
  private profile: string;
  private repoRoot?: string;
  private sessions: ProfileSessionService;
  private ledger: AgentStateLedgerService;
  private quotas: AgentQuotaService;
  private auth: AuthService;
  private now: () => Date;
  private requireAuth: boolean;

  constructor(options: EcosystemHydrationOptions = {}) {
    this.tnfHome = options.tnfHome || process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
    this.sessions = options.profileSessions || new ProfileSessionService({ tnfHome: this.tnfHome });
    this.profile = options.profile || this.sessions.getActiveProfileName();
    this.repoRoot = options.repoRoot;
    this.ledger =
      options.ledger ||
      new AgentStateLedgerService({ tnfHome: this.tnfHome, profile: this.profile });
    this.quotas =
      options.quotas || new AgentQuotaService({ tnfHome: this.tnfHome, repoRoot: this.repoRoot });
    this.auth = options.auth || new AuthService();
    this.now = options.now || (() => new Date());
    this.requireAuth = options.requireAuth !== false;
  }

  /**
   * Cheap boot orientation — enlisted providers, health anchors, authority refs,
   * quota freshness summary, communication surfaces. No full source/project load.
   */
  orient(): EcosystemOrientSnapshot {
    const session = this.sessions.readSession(this.profile);
    const authenticated = !!session;
    if (this.requireAuth && !authenticated) {
      throw new Error(
        `Authentication required for ecosystem orientation (profile '${this.profile}'). Run: tnf profile login`
      );
    }

    const receipts: EcosystemOrientSnapshot['receipts'] = [];
    let enlistedProviders: EcosystemOrientSnapshot['enlistedProviders'] = [];
    try {
      enlistedProviders = this.auth.listProviders().map((p) => ({
        name: p.name,
        authenticated: p.authenticated,
        configured: p.configured,
      }));
      receipts.push({
        slice: 'providers',
        status: enlistedProviders.length ? 'ok' : 'empty',
        detail: `${enlistedProviders.filter((p) => p.authenticated).length} authenticated`,
      });
    } catch (err) {
      receipts.push({
        slice: 'providers',
        status: 'degraded',
        detail: err instanceof Error ? err.message : String(err),
      });
    }

    const handoffPresent = fs.existsSync(path.join(this.tnfHome, 'handoff-current.json'));
    const latest = this.ledger.readLatest() || this.ledger.recoverLatestFromHistory();
    const agentStateLatestPresent = !!latest;
    const rolesPath = path.join(this.tnfHome, 'authority', 'roles.json');
    const rolesPresent = fs.existsSync(rolesPath);
    const rolesDoc = readJson<{ agents?: Record<string, unknown> }>(rolesPath);
    const agentRoleCount = rolesDoc?.agents ? Object.keys(rolesDoc.agents).length : 0;

    receipts.push({
      slice: 'runtimeHealth',
      status: handoffPresent || agentStateLatestPresent || rolesPresent ? 'ok' : 'degraded',
      detail: `handoff=${handoffPresent} agentState=${agentStateLatestPresent} roles=${rolesPresent}`,
    });

    const quotas = (latest?.agents || [])
      .map((a) => a.quota)
      .filter(Boolean) as NonNullable<AgentStateEntry['quota']>[];
    const quotaFreshnessSummary = {
      fresh: quotas.filter((q) => q && !q.degraded && q.confidence !== 'unknown').length,
      degraded: quotas.filter((q) => q?.degraded).length,
      unknown: quotas.filter((q) => q?.confidence === 'unknown').length,
      total: quotas.length,
    };
    receipts.push({
      slice: 'quotas',
      status: quotaFreshnessSummary.total ? 'ok' : 'empty',
      detail: `fresh=${quotaFreshnessSummary.fresh} unknown=${quotaFreshnessSummary.unknown}`,
    });

    const communicationSurfaces = [
      { name: 'TNF Local Control', url: 'tnf://local', kind: 'control-surface' },
    ];
    if (session?.cloudEndpoint) {
      communicationSurfaces.push({
        name: 'TNF Cloud',
        url: session.cloudEndpoint,
        kind: 'control-surface',
      });
    } else {
      receipts.push({
        slice: 'hosted',
        status: 'missing',
        detail: 'private hosted control plane absent — OSS runtime degrades cleanly',
      });
    }

    const orientation: EcosystemOrientSnapshot = {
      spec: AGENT_STATE_SPEC,
      kind: 'boot-orientation',
      profile: this.profile,
      generatedAt: this.now().toISOString(),
      authenticated,
      enlistedProviders,
      runtimeHealth: { handoffPresent, agentStateLatestPresent, rolesPresent },
      authorityRefs: { rolesPath, agentRoleCount },
      quotaFreshnessSummary,
      communicationSurfaces,
      receipts,
    };

    const mirrorDir = path.join(this.tnfHome, 'agent-state', this.profile);
    fs.mkdirSync(mirrorDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(
      path.join(mirrorDir, 'orient-latest.json'),
      `${JSON.stringify(orientation, null, 2)}\n`,
      { mode: 0o600 }
    );
    return orientation;
  }

  /**
   * Task-scoped hydration — pulls working collections lazily after orientation.
   * Fail-soft when sources/projects unavailable.
   */
  hydrate(): EcosystemSnapshot {
    const orientation = this.orient();
    const session = this.sessions.readSession(this.profile);
    const profileDoc = this.sessions.readProfile(this.profile);
    const receipts: EcosystemSnapshot['receipts'] = [...orientation.receipts];

    let agents: AgentStateEntry[] = [];
    const latest = this.ledger.readLatest() || this.ledger.recoverLatestFromHistory();
    if (latest?.agents?.length) {
      agents = latest.agents;
      receipts.push({
        slice: 'agents',
        status: 'ok',
        detail: `${agents.length} from observation ledger (not authoritative)`,
      });
    } else {
      receipts.push({ slice: 'agents', status: 'empty', detail: 'no observation snapshot' });
    }

    const quotas = agents.length
      ? this.quotas.refreshForAgents(agents).map((q) => this.quotas.markFreshness(q))
      : [];
    agents = agents.map((agent) => ({
      ...agent,
      quota: quotas.find((q) => q.agentId === agent.agentId) || agent.quota || null,
    }));

    const handoff = readJson<Record<string, unknown>>(path.join(this.tnfHome, 'handoff-current.json'));
    const tasks: unknown[] = [];
    if (handoff) {
      if (Array.isArray(handoff.IMMEDIATE_TASKS)) tasks.push(...handoff.IMMEDIATE_TASKS);
      if (Array.isArray(handoff.next_actions)) tasks.push(...handoff.next_actions);
    }
    tasks.push(...listJsonFiles(path.join(this.tnfHome, 'tasks')));
    receipts.push({
      slice: 'tasks',
      status: tasks.length ? 'ok' : 'empty',
      detail: `${tasks.length} from canonical handoff/tasks surfaces`,
    });

    const userRoot = resolveUserContextRoot(this.tnfHome, this.profile, this.repoRoot);
    let sources: unknown[] = [];
    let projects: unknown[] = [];
    try {
      sources = listJsonFiles(path.join(userRoot, 'sources'));
      projects = listJsonFiles(path.join(userRoot, 'working')).filter((row) => {
        if (!row || typeof row !== 'object') return false;
        const r = row as Record<string, unknown>;
        return r.kind === 'project' || r.type === 'project' || !!r.projectId || !!r.repo;
      });
      receipts.push({
        slice: 'sources',
        status: sources.length ? 'ok' : 'empty',
        detail: `${sources.length} at ${path.join(userRoot, 'sources')}`,
      });
    } catch (err) {
      receipts.push({
        slice: 'sources',
        status: 'degraded',
        detail: `ecosystem source unavailable: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    const platforms: unknown[] = orientation.enlistedProviders.map((p) => ({
      kind: 'provider',
      ...p,
    }));
    if (profileDoc?.services && typeof profileDoc.services === 'object') {
      for (const [name, enabled] of Object.entries(profileDoc.services as Record<string, unknown>)) {
        platforms.push({ kind: 'service', name, enabled: Boolean(enabled) });
      }
    }

    const websites = [...orientation.communicationSurfaces];

    const snapshot: EcosystemSnapshot = {
      spec: AGENT_STATE_SPEC,
      kind: 'task-scoped-hydration',
      profile: this.profile,
      generatedAt: this.now().toISOString(),
      authenticated: orientation.authenticated,
      orientation,
      slices: {
        profile: profileDoc,
        session,
        agents,
        quotas,
        tasks,
        projects,
        sources,
        platforms,
        websites,
      },
      receipts,
    };

    const workingDir = path.join(userRoot, 'working');
    fs.mkdirSync(workingDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(
      path.join(workingDir, 'ecosystem-latest.json'),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      { mode: 0o600 }
    );
    const mirrorDir = path.join(this.tnfHome, 'agent-state', this.profile);
    fs.mkdirSync(mirrorDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(
      path.join(mirrorDir, 'ecosystem-latest.json'),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      { mode: 0o600 }
    );
    return snapshot;
  }

  readLatest(): EcosystemSnapshot | null {
    const userRoot = resolveUserContextRoot(this.tnfHome, this.profile, this.repoRoot);
    return (
      readJson<EcosystemSnapshot>(path.join(userRoot, 'working', 'ecosystem-latest.json')) ||
      readJson<EcosystemSnapshot>(
        path.join(this.tnfHome, 'agent-state', this.profile, 'ecosystem-latest.json')
      )
    );
  }
}
