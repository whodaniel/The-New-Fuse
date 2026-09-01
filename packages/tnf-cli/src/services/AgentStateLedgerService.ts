/**
 * Bounded observation history of onboarded agent states (projection cache).
 *
 * NOT authoritative: open tasks stay in handoff-current; roles stay in
 * ~/.tnf/authority/roles.json; narrative ledger stays in AGENT_STATUS_LEDGER.md.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { AgentQuotaService } from './AgentQuotaService.js';
import {
  AGENT_STATE_HISTORY_CAP,
  AGENT_STATE_HISTORY_JSONL_LINES,
  AGENT_STATE_HISTORY_RETENTION_DAYS,
  AGENT_STATE_SPEC,
  AgentStateEntry,
  AgentStateSnapshot,
} from './agent-state-types.js';

export interface AgentStateLedgerOptions {
  tnfHome?: string;
  profile?: string;
  historyCap?: number;
  retentionDays?: number;
  jsonlLines?: number;
  quotaService?: AgentQuotaService;
  now?: () => Date;
}

export interface WriteSnapshotInput {
  agents: AgentStateEntry[];
  writer?: string;
  includeQuotas?: boolean;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function resolveActiveProfileName(tnfHome: string, env: NodeJS.ProcessEnv = process.env): string {
  if (env.TNF_PROFILE && env.TNF_PROFILE.trim()) return env.TNF_PROFILE.trim();

  const defaultPointer = path.join(tnfHome, 'profiles', 'default');
  try {
    const value = fs.readFileSync(defaultPointer, 'utf8').trim();
    if (value) return value;
  } catch {
    // continue
  }

  const activePath = path.join(tnfHome, 'profiles', 'active.json');
  const active = readJsonFile<Record<string, unknown>>(activePath);
  if (active) {
    const callsign = String(active.callsign || active.profileName || active.profile || '').trim();
    if (callsign) return callsign;
  }

  return env.USER || env.USERNAME || 'default';
}

export class AgentStateLedgerService {
  private tnfHome: string;
  private profile: string;
  private historyCap: number;
  private retentionDays: number;
  private jsonlLines: number;
  private quotaService: AgentQuotaService;
  private now: () => Date;

  constructor(options: AgentStateLedgerOptions = {}) {
    this.tnfHome = options.tnfHome || process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
    this.profile = options.profile || resolveActiveProfileName(this.tnfHome);
    this.historyCap = options.historyCap ?? AGENT_STATE_HISTORY_CAP;
    this.retentionDays = options.retentionDays ?? AGENT_STATE_HISTORY_RETENTION_DAYS;
    this.jsonlLines = options.jsonlLines ?? AGENT_STATE_HISTORY_JSONL_LINES;
    this.quotaService = options.quotaService || new AgentQuotaService({ tnfHome: this.tnfHome });
    this.now = options.now || (() => new Date());
  }

  get profileName(): string {
    return this.profile;
  }

  rootDir(): string {
    return path.join(this.tnfHome, 'agent-state', this.profile);
  }

  latestPath(): string {
    return path.join(this.rootDir(), 'latest.json');
  }

  historyDir(): string {
    return path.join(this.rootDir(), 'history');
  }

  historyJsonlPath(): string {
    return path.join(this.rootDir(), 'history.jsonl');
  }

  readLatest(): AgentStateSnapshot | null {
    return readJsonFile<AgentStateSnapshot>(this.latestPath());
  }

  listHistory(limit = 20): string[] {
    const dir = this.historyDir();
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .map((name) => {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        return { name, full, mtime: st.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, Math.max(0, limit))
      .map((row) => row.full);
  }

  readHistory(limit = 20): AgentStateSnapshot[] {
    return this.listHistory(limit)
      .map((file) => readJsonFile<AgentStateSnapshot>(file))
      .filter((row): row is AgentStateSnapshot => !!row);
  }

  /**
   * Prune history by count and age. Never deletes latest.json.
   * Returns counts for sweep reports.
   */
  pruneHistory(): { before: number; after: number; removed: number; truncatedJsonl: boolean } {
    const dir = this.historyDir();
    ensureDir(dir);
    const files = fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .map((name) => {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        return { full, mtime: st.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);

    const before = files.length;
    const cutoff = this.now().getTime() - this.retentionDays * 86400_000;
    const keep: typeof files = [];
    let removed = 0;

    for (const file of files) {
      const overCap = keep.length >= this.historyCap;
      const tooOld = file.mtime < cutoff;
      if (overCap || tooOld) {
        try {
          fs.unlinkSync(file.full);
          removed += 1;
        } catch {
          // ignore
        }
      } else {
        keep.push(file);
      }
    }

    let truncatedJsonl = false;
    const jsonlPath = this.historyJsonlPath();
    if (fs.existsSync(jsonlPath)) {
      try {
        const lines = fs.readFileSync(jsonlPath, 'utf8').split('\n').filter(Boolean);
        if (lines.length > this.jsonlLines) {
          const kept = lines.slice(lines.length - this.jsonlLines);
          fs.writeFileSync(jsonlPath, `${kept.join('\n')}\n`, { mode: 0o600 });
          truncatedJsonl = true;
        }
      } catch {
        // ignore
      }
    }

    return { before, after: keep.length, removed, truncatedJsonl };
  }

  writeSnapshot(input: WriteSnapshotInput): AgentStateSnapshot {
    const generatedAt = this.now().toISOString();
    let agents = input.agents.map((agent) => ({ ...agent }));

    if (input.includeQuotas !== false) {
      agents = this.quotaService.attachAuthorityRoles(agents).map((agent) => {
        const quota = this.quotaService.markFreshness(this.quotaService.refreshForAgent(agent));
        return { ...agent, quota };
      });
    } else {
      agents = this.quotaService.attachAuthorityRoles(agents);
    }

    const quotaFreshCount = agents.filter(
      (a) => a.quota && !a.quota.degraded && a.quota.confidence !== 'unknown'
    ).length;
    const quotaDegradedCount = agents.filter((a) => a.quota?.degraded).length;
    const quotaUnknownCount = agents.filter((a) => a.quota?.confidence === 'unknown').length;

    const snapshot: AgentStateSnapshot = {
      spec: AGENT_STATE_SPEC,
      kind: 'observation-history',
      authority: 'not-authoritative',
      canonicalPointers: {
        roles: path.join(this.tnfHome, 'authority', 'roles.json'),
        handoffCurrent: path.join(this.tnfHome, 'handoff-current.json'),
        statusLedgerDoc: 'docs/protocols/AGENT_STATUS_LEDGER.md',
      },
      profile: this.profile,
      generatedAt,
      agents,
      receipts: {
        writer: input.writer || 'AgentStateLedgerService',
        agentCount: agents.length,
        quotaFreshCount,
        quotaDegradedCount,
        quotaUnknownCount,
      },
    };

    const root = this.rootDir();
    const historyDir = this.historyDir();
    ensureDir(root);
    ensureDir(historyDir);

    const latest = this.latestPath();
    fs.writeFileSync(latest, `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });

    const stamp = generatedAt.replace(/[:.]/g, '-');
    const historyFile = path.join(historyDir, `${stamp}.json`);
    fs.writeFileSync(historyFile, `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });

    const jsonlPath = this.historyJsonlPath();
    const summary = {
      at: generatedAt,
      profile: this.profile,
      agentCount: agents.length,
      writer: snapshot.receipts.writer,
      historyFile: path.basename(historyFile),
      kind: snapshot.kind,
      authority: snapshot.authority,
    };
    fs.appendFileSync(jsonlPath, `${JSON.stringify(summary)}\n`, { mode: 0o600 });

    this.pruneHistory();
    return snapshot;
  }

  /**
   * If latest.json is missing after retention/truncation, rebuild from newest
   * history snapshot. Does not invent authority or open tasks.
   */
  recoverLatestFromHistory(): AgentStateSnapshot | null {
    const existing = this.readLatest();
    if (existing) return existing;
    const history = this.readHistory(1);
    if (!history.length) return null;
    const recovered = history[0];
    ensureDir(this.rootDir());
    fs.writeFileSync(this.latestPath(), `${JSON.stringify(recovered, null, 2)}\n`, { mode: 0o600 });
    return recovered;
  }
}
