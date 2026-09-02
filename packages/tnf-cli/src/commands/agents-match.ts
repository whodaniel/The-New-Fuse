/**
 * packages/tnf-cli/src/commands/agents-match.ts
 *
 * `tnf agents match` — the capability broker (Tier 1 protocol increment).
 *
 * Joins STATIC capability (spec frontmatter in .agent/agents/, optionally
 * .claude/agents/) with LIVE state (tnf:agent-registry rows: status, load,
 * heartbeat age) to answer the question dispatch used to guess at:
 *
 *     "who can do X, right now, with spare capacity?"
 *
 * Scoring is token-based and transparent: each requested capability token is
 * matched against traits (weight 3), category/dacc_role (2), name (2) and
 * description (1), normalized to 0..1. Live state filters and displays but
 * does not change the base score. Optional routing telemetry (Tier 2) applies
 * a transparent weight multiplier to produce an adjusted rank.
 *
 * Dependency-free on purpose: reuses the tiny frontmatter parser shape from
 * agents-classify.ts rather than pulling js-yaml into the CLI.
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const LEXICAL_FORGIVENESS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'lexical-forgiveness.json'
);

function loadLexicalForgiveness(): { aliases?: Record<string, string[]> } {
  try {
    return JSON.parse(fs.readFileSync(LEXICAL_FORGIVENESS_PATH, 'utf8'));
  } catch {
    return { aliases: {} };
  }
}

interface ParsedSpec {
  id: string;
  filePath: string;
  name: string;
  description: string;
  category: string;
  daccRole: string;
  traits: string[];
  vendor: string;
  model: string;
  fulfillmentPlaceholder: boolean;
}

interface LiveState {
  registered: boolean;
  agentId?: string;
  status?: string;
  isOnline?: boolean;
  currentLoad?: number;
  maxLoad?: number;
  lastSeenAgeSec?: number;
  busy: boolean;
  capacityDeclared: boolean;
}

interface TelemetryEntry {
  agentId: string;
  capability?: string;
  success: boolean;
}

interface CandidateRow {
  spec: ParsedSpec;
  score: number;
  weight: number;
  adjusted: number;
  matched: string[];
  live: LiveState;
}

const VERIFICATION_PATTERN =
  /\b(verif(?:y|ication)|qa|audit|inspect|validate|smoke[- ]?test|test[- ]?pass)\b/i;

const TELEMETRY_FILE = 'data/telemetry/routing-telemetry.jsonl';

// ---------------------------------------------------------------------------
// Tiny YAML-frontmatter parser (same 5 shapes as agents-classify.ts):
//   key: value / "quoted" / [a, b, c] / key:\n  - item lists.
// Nested maps (`fulfillment:` with indented children) degrade to a list of
// "childkey: value" strings, which parseFulfillment handles explicitly.
// ---------------------------------------------------------------------------
function parseFrontmatter(content: string): Record<string, any> {
  if (!content.startsWith('---')) return {};
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx < 0) return {};
  const block = content.slice(3, endIdx).replace(/^\n/, '');
  const lines = block.split(/\r?\n/);
  const out: Record<string, any> = {};
  let i = 0;
  const unquote = (v: string) =>
    (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))
      ? v.slice(1, -1)
      : v;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1];
    let rest = m[2];
    if (rest.trim().startsWith('[') && rest.trim().endsWith(']')) {
      const inner = rest.trim().slice(1, -1);
      out[key] = inner
        .split(',')
        .map((s) => unquote(s.trim()))
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (rest.trim() === '') {
      const items: string[] = [];
      i += 1;
      while (i < lines.length) {
        const im = lines[i].match(/^\s+-\s+(.*)$/);
        if (!im) break;
        items.push(unquote(im[1].trim()));
        i += 1;
      }
      if (items.length > 0) out[key] = items;
      continue;
    }
    out[key] = unquote(rest.trim());
    i += 1;
  }
  return out;
}

function parseFulfillment(fm: Record<string, any>): { vendor: string; model: string } {
  const raw = fm.fulfillment;
  let outVendor = '';
  let outModel = '';
  const items: string[] = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === 'string'
      ? [raw]
      : [];
  for (const item of items) {
    const kv = item.match(/^([A-Za-z_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const k = kv[1].toLowerCase();
    const v = kv[2].trim();
    if (k === 'vendor') outVendor = v;
    if (k === 'model') outModel = v;
  }
  return { vendor: outVendor, model: outModel };
}

const PLACEHOLDER_PATTERN = /\[to be determined|\bdetermined from\b|tbd\b/i;

function parseSpecFile(filePath: string): ParsedSpec | null {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  const fm = parseFrontmatter(content);
  const id = path.basename(filePath, '.md');
  const traitsRaw = fm.traits;
  const traits: string[] = Array.isArray(traitsRaw)
    ? traitsRaw.map(String)
    : typeof traitsRaw === 'string'
      ? traitsRaw.split(/[,\s]+/).filter(Boolean)
      : [];
  const { vendor, model } = parseFulfillment(fm);
  const fulfillmentPlaceholder =
    (!vendor && !model) || PLACEHOLDER_PATTERN.test(vendor) || PLACEHOLDER_PATTERN.test(model);
  return {
    id,
    filePath,
    name: String(fm.name || id),
    description: String(fm.description || ''),
    category: String(fm.category || ''),
    daccRole: String(fm.dacc_role || ''),
    traits,
    vendor,
    model,
    fulfillmentPlaceholder,
  };
}

function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9+_-]+/)
    .filter((t) => t.length > 1);
}

function expandWantedCapabilities(raw: string): string[] {
  const rawWanted = String(raw || '')
    .split(/[\s,]+/)
    .flatMap((tok) => tok.split(/[-_/]+/))
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 1);

  const wanted: string[] = [];
  const seen = new Set<string>();
  for (const token of rawWanted) {
    if (!seen.has(token)) {
      seen.add(token);
      wanted.push(token);
    }
    const aliases = loadLexicalForgiveness().aliases?.[token];
    if (!aliases) continue;
    for (const alias of aliases) {
      if (!seen.has(alias)) {
        seen.add(alias);
        wanted.push(alias);
      }
    }
  }
  return wanted;
}

/**
 * Transparent score: each requested token matched against traits (3),
 * category/dacc_role (2), name (2), description (1); normalized against the
 * perfect score. Partial matches (substring) count at half weight.
 */
function scoreSpec(spec: ParsedSpec, wanted: string[]): { score: number; matched: string[] } {
  const nameTokens = new Set(tokenize(`${spec.id} ${spec.name}`));
  const descTokens = new Set(tokenize(spec.description));
  const traitTokens = new Set(spec.traits.flatMap(tokenize));
  const catTokens = new Set(tokenize(`${spec.category} ${spec.daccRole}`));

  let raw = 0;
  const matched: string[] = [];
  const perfect = wanted.length * 3;
  for (const w of wanted) {
    let best = 0;
    for (const t of traitTokens) {
      if (t === w) best = Math.max(best, 3);
      else if (t.includes(w) || w.includes(t)) best = Math.max(best, 1.5);
    }
    for (const t of catTokens) {
      if (t === w) best = Math.max(best, 2);
      else if (t.includes(w) || w.includes(t)) best = Math.max(best, 1);
    }
    for (const t of nameTokens) {
      if (t === w) best = Math.max(best, 2);
      else if (t.includes(w) || w.includes(t)) best = Math.max(best, 1);
    }
    if (best === 0 && descTokens.has(w)) best = 1;
    if (best > 0) matched.push(w);
    raw += best;
  }
  return { score: perfect > 0 ? raw / perfect : 0, matched };
}

function hasVerificationCapability(spec: ParsedSpec): boolean {
  const haystack = [spec.id, spec.name, spec.description, ...spec.traits].join(' ');
  return VERIFICATION_PATTERN.test(haystack);
}

function loadRoutingTelemetry(repoRoot: string): TelemetryEntry[] {
  const filePath = path.join(repoRoot, TELEMETRY_FILE);
  if (!fs.existsSync(filePath)) return [];
  const entries: TelemetryEntry[] = [];
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const row = JSON.parse(trimmed) as Record<string, unknown>;
      const agentId = String(row.agentId ?? row.agent_id ?? row.id ?? '').toLowerCase();
      if (!agentId) continue;
      entries.push({
        agentId,
        capability: row.capability ? String(row.capability).toLowerCase() : undefined,
        success: row.success !== false && row.outcome !== 'fail',
      });
    } catch {
      // skip malformed lines
    }
  }
  return entries;
}

/**
 * Telemetry weight: neutral 1.0 when no samples; otherwise 0.5 + 0.5 * successRate.
 * Capability-specific rows are preferred when any exist for the requested tokens.
 */
function telemetryWeight(specId: string, wanted: string[], telemetry: TelemetryEntry[]): number {
  const idLower = specId.toLowerCase();
  let rows = telemetry.filter((e) => e.agentId === idLower);
  if (rows.length === 0) {
    rows = telemetry.filter((e) => idLower.includes(e.agentId) || e.agentId.includes(idLower));
  }
  if (rows.length === 0) return 1;

  const wantedSet = new Set(wanted);
  const scoped = rows.filter((e) => !e.capability || wantedSet.has(e.capability));
  const sample = scoped.length > 0 ? scoped : rows;
  const successes = sample.filter((e) => e.success).length;
  const rate = successes / sample.length;
  return 0.5 + 0.5 * rate;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function ageSeconds(lastSeen?: string): number | undefined {
  if (!lastSeen) return undefined;
  const ms = Date.parse(lastSeen);
  return Number.isFinite(ms) ? Math.max(0, Math.round((Date.now() - ms) / 1000)) : undefined;
}

function toLiveState(row: any): LiveState {
  const status = String(row?.status ?? '').toLowerCase();
  const currentLoad = typeof row?.currentLoad === 'number' ? row.currentLoad : undefined;
  const maxLoad = typeof row?.maxLoad === 'number' ? row.maxLoad : undefined;
  const atLoadCap =
    currentLoad !== undefined && maxLoad !== undefined && maxLoad > 0 && currentLoad >= maxLoad;
  return {
    registered: true,
    agentId: row?.agentId ?? row?.id,
    status,
    isOnline: Boolean(row?.isOnline),
    currentLoad,
    maxLoad,
    lastSeenAgeSec: ageSeconds(row?.lastSeen),
    busy: status === 'busy' || atLoadCap,
    capacityDeclared: Boolean(status) || currentLoad !== undefined || maxLoad !== undefined,
  };
}

function formatStatus(live: LiveState): string {
  if (!live.registered) return 'not-reg';
  if (!live.isOnline) return 'offline';
  if (live.busy) return 'busy';
  if (live.maxLoad !== undefined) {
    return `online[${live.currentLoad ?? 0}/${live.maxLoad}]`;
  }
  return live.status ? `online:${live.status}` : 'online';
}

function printTable(candidates: CandidateRow[]): void {
  const headers = ['ID', 'SCORE', 'WEIGHT', 'ADJUSTED', 'STATUS', 'CAPABILITIES'];
  const idWidth = Math.max(headers[0].length, ...candidates.map((c) => c.spec.id.length), 24);
  const capWidth = Math.max(
    headers[5].length,
    ...candidates.map((c) => c.matched.join(', ').length),
    20
  );

  console.log(
    `${headers[0].padEnd(idWidth)}  ${headers[1].padStart(5)}  ${headers[2].padStart(6)}  ${headers[3].padStart(8)}  ${headers[4].padEnd(12)}  ${headers[5]}`
  );
  for (const c of candidates) {
    const caps = c.matched.join(', ');
    const capsOut = caps.length > capWidth ? `${caps.slice(0, capWidth - 3)}...` : caps;
    console.log(
      `${c.spec.id.padEnd(idWidth)}  ${round3(c.score).toFixed(3).padStart(5)}  ${round3(c.weight).toFixed(3).padStart(6)}  ${round3(c.adjusted).toFixed(3).padStart(8)}  ${formatStatus(c.live).padEnd(12)}  ${capsOut}`
    );
  }
}

export function registerAgentsMatchCommand(agentsGroup: Command, repoRoot: string): void {
  agentsGroup
    .command('match')
    .description(
      'Capability broker: rank agent specs by requested capabilities, joined with live registry state'
    )
    .option('-c, --capabilities <list>', 'Comma-separated capability tokens to match')
    .option(
      '--require-capacity',
      'Only candidates that are live and not busy (declared capacity respected)'
    )
    .option(
      '--require-verification',
      'Only candidates whose spec declares verification/QA capability'
    )
    .option('--include-offline', 'Keep registered-but-offline candidates (default: dropped)')
    .option('--no-telemetry', 'Skip routing-telemetry weight adjustment (base score only)')
    .option('--platform <platform>', 'Restrict to candidates whose live row matches this platform')
    .option('--limit <n>', 'Max candidates to show', '10')
    .option('--json', 'Emit machine-readable JSON')
    .action(
      async (options: {
        capabilities?: string;
        requireCapacity?: boolean;
        requireVerification?: boolean;
        includeOffline?: boolean;
        telemetry?: boolean;
        platform?: string;
        limit?: string;
        json?: boolean;
      }) => {
        const wanted = expandWantedCapabilities(options.capabilities || '');
        if (wanted.length === 0) {
          console.error(
            'No capabilities requested. Usage: tnf agents match --capabilities "code-analysis,review"'
          );
          process.exitCode = 2;
          return;
        }

        const useTelemetry = options.telemetry !== false;
        const telemetry = useTelemetry ? loadRoutingTelemetry(repoRoot) : [];

        // 1. Static capability: spec frontmatter.
        const dirs = [
          path.join(repoRoot, '.agent', 'agents'),
          path.join(repoRoot, '.claude', 'agents'),
        ];
        const specs: ParsedSpec[] = [];
        const seenIds = new Set<string>();
        for (const dir of dirs) {
          if (!fs.existsSync(dir)) continue;
          for (const entry of fs.readdirSync(dir)) {
            if (!entry.endsWith('.md')) continue;
            const spec = parseSpecFile(path.join(dir, entry));
            if (spec && !seenIds.has(spec.id)) {
              seenIds.add(spec.id);
              specs.push(spec);
            }
          }
        }

        // 2. Live state: the registry roster. One-shot client — same hygiene
        // as `tnf send`: deregister so the roster stays ghost-free.
        const { RedisAgentClient } = await import('../RedisAgentClient.js');
        const client = new RedisAgentClient();
        let roster: any[] = [];
        try {
          await client.initialize();
          roster = await client.listAgents();
        } catch (err: any) {
          if (!options.json) {
            console.error(`⚠ Redis unavailable (${err.message}) — ranking on static specs only.`);
          }
        } finally {
          await client.cleanup();
          await client.deregister();
        }

        const joinRow = (spec: ParsedSpec): LiveState => {
          const idLower = spec.id.toLowerCase();
          const nameLower = spec.name.toLowerCase();
          const row = roster.find((r) => {
            const rid = String(r?.agentId ?? r?.id ?? '').toLowerCase();
            const rname = String(r?.name ?? '').toLowerCase();
            if (!rid && !rname) return false;
            return (
              rid === idLower ||
              rid.includes(idLower) ||
              idLower.includes(rid.split('_')[1] || '\u0000') ||
              rname === nameLower ||
              rname.includes(idLower)
            );
          });
          return row
            ? toLiveState(row)
            : { registered: false, busy: false, capacityDeclared: false };
        };

        let candidates: CandidateRow[] = specs.map((spec) => {
          const { score, matched } = scoreSpec(spec, wanted);
          const weight = useTelemetry ? telemetryWeight(spec.id, wanted, telemetry) : 1;
          return {
            spec,
            score,
            weight,
            adjusted: score * weight,
            matched,
            live: joinRow(spec),
          };
        });

        // 3. Filters.
        candidates = candidates.filter((c) => c.score > 0);
        if (options.requireVerification) {
          candidates = candidates.filter((c) => hasVerificationCapability(c.spec));
        }
        if (options.platform) {
          candidates = candidates.filter(
            (c) => !c.live.registered || String(c.live.status ?? '') === String(options.platform)
          );
        }
        if (options.requireCapacity) {
          candidates = candidates.filter(
            (c) => c.live.registered && c.live.isOnline && !c.live.busy
          );
        } else if (!options.includeOffline) {
          candidates = candidates.filter((c) => !c.live.registered || c.live.isOnline);
        }
        candidates.sort(
          (a, b) =>
            b.adjusted - a.adjusted ||
            b.score - a.score ||
            Number(b.live.isOnline) - Number(a.live.isOnline)
        );
        candidates = candidates.slice(0, Math.max(1, parseInt(options.limit || '10', 10) || 10));

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                requested: wanted,
                rosterSize: roster.length,
                telemetrySamples: telemetry.length,
                count: candidates.length,
                candidates: candidates.map((c) => ({
                  id: c.spec.id,
                  name: c.spec.name,
                  score: round3(c.score),
                  weight: round3(c.weight),
                  adjusted: round3(c.adjusted),
                  matched: c.matched,
                  category: c.spec.category,
                  dacc_role: c.spec.daccRole,
                  traits: c.spec.traits,
                  verificationCapable: hasVerificationCapability(c.spec),
                  fulfillment: {
                    vendor: c.spec.vendor || null,
                    model: c.spec.model || null,
                    placeholder: c.spec.fulfillmentPlaceholder,
                  },
                  live: {
                    registered: c.live.registered,
                    agentId: c.live.agentId ?? null,
                    online: c.live.isOnline ?? false,
                    status: c.live.status ?? null,
                    currentLoad: c.live.currentLoad ?? null,
                    maxLoad: c.live.maxLoad ?? null,
                    lastSeenAgeSec: c.live.lastSeenAgeSec ?? null,
                  },
                  spec: path.relative(repoRoot, c.spec.filePath),
                })),
              },
              null,
              2
            )
          );
          return;
        }

        if (candidates.length === 0) {
          console.log(`No agent specs match capabilities: ${wanted.join(', ')}`);
          return;
        }

        const filters: string[] = [];
        if (options.requireCapacity) filters.push('live + spare capacity');
        if (options.requireVerification) filters.push('verification-capable');
        if (!useTelemetry) filters.push('telemetry off');

        console.log(
          `Agents matching "${wanted.join(', ')}"` +
            (filters.length > 0 ? ` (${filters.join(', ')})` : '') +
            ` — ${candidates.length} candidate(s), roster ${roster.length}` +
            (useTelemetry ? `, telemetry ${telemetry.length} sample(s)` : '') +
            ':\n'
        );
        printTable(candidates);
      }
    );
}
