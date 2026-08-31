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
 * description (1), normalized to 0..1. Live state never changes the score —
 * it is a filter (--require-capacity / --include-offline) and a displayed
 * column, so the ranking stays explainable.
 *
 * Dependency-free on purpose: reuses the tiny frontmatter parser shape from
 * agents-classify.ts rather than pulling js-yaml into the CLI.
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

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
  const vendor = '';
  const model = '';
  let outVendor = vendor;
  let outModel = model;
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
    .option('--include-offline', 'Keep registered-but-offline candidates (default: dropped)')
    .option('--platform <platform>', 'Restrict to candidates whose live row matches this platform')
    .option('--limit <n>', 'Max candidates to show', '10')
    .option('--json', 'Emit machine-readable JSON')
    .action(
      async (options: {
        capabilities?: string;
        requireCapacity?: boolean;
        includeOffline?: boolean;
        platform?: string;
        limit?: string;
        json?: boolean;
      }) => {
        const wanted = String(options.capabilities || '')
          .split(/[\s,]+/)
          .flatMap((tok) => tok.split(/[-_/]+/))
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 1);
        if (wanted.length === 0) {
          console.error(
            'No capabilities requested. Usage: tnf agents match --capabilities "code-analysis,review"'
          );
          process.exitCode = 2;
          return;
        }

        // 1. Static capability: spec frontmatter.
        const dirs = [
          path.join(repoRoot, '.agent', 'agents'),
          path.join(repoRoot, '.claude', 'agents'),
        ];
        const specs: ParsedSpec[] = [];
        // The same spec is often mirrored into both directories (Agent
        // Resource Fabric dedupe domain) — keep the first occurrence so
        // candidates are unique by id.
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

        // Join: spec id ↔ registry row via id/name containment heuristics.
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

        let candidates = specs.map((spec) => {
          const { score, matched } = scoreSpec(spec, wanted);
          return { spec, score, matched, live: joinRow(spec) };
        });

        // 3. Filters.
        candidates = candidates.filter((c) => c.score > 0);
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
          // Default: candidates with a live row that is offline are dropped;
          // never-registered specs stay (the static directory is still useful).
          candidates = candidates.filter((c) => !c.live.registered || c.live.isOnline);
        }
        candidates.sort(
          (a, b) => b.score - a.score || Number(b.live.isOnline) - Number(a.live.isOnline)
        );
        candidates = candidates.slice(0, Math.max(1, parseInt(options.limit || '10', 10) || 10));

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                requested: wanted,
                rosterSize: roster.length,
                count: candidates.length,
                candidates: candidates.map((c) => ({
                  id: c.spec.id,
                  name: c.spec.name,
                  score: Math.round(c.score * 1000) / 1000,
                  matched: c.matched,
                  category: c.spec.category,
                  dacc_role: c.spec.daccRole,
                  traits: c.spec.traits,
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
        console.log(
          `Agents matching "${wanted.join(', ')}"` +
            (options.requireCapacity ? ' (live + spare capacity)' : '') +
            ` — ${candidates.length} candidate(s), roster ${roster.length}:\n`
        );
        for (const c of candidates) {
          const liveStr = !c.live.registered
            ? 'not registered'
            : c.live.isOnline
              ? `online ${c.live.status || ''}` +
                (c.live.maxLoad !== undefined
                  ? ` [${c.live.currentLoad ?? 0}/${c.live.maxLoad}]`
                  : '') +
                (c.live.lastSeenAgeSec !== undefined ? ` (${c.live.lastSeenAgeSec}s ago)` : '')
              : `offline (${c.live.lastSeenAgeSec ?? '?'}s ago)`;
          const ful = c.spec.fulfillmentPlaceholder
            ? 'fulfillment: TBD'
            : `fulfillment: ${c.spec.vendor || '?'}/${c.spec.model || '?'}`;
          console.log(`  ${(Math.round(c.score * 1000) / 1000).toFixed(3)}  ${c.spec.id}`);
          console.log(`        ${liveStr} · ${ful}`);
          if (c.spec.traits.length > 0) {
            console.log(`        traits: ${c.spec.traits.slice(0, 8).join(', ')}`);
          }
          console.log(`        matched: ${c.matched.join(', ')}`);
        }
      }
    );
}
