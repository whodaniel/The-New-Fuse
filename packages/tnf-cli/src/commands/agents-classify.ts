/**
 * packages/tnf-cli/src/commands/agents-classify.ts
 * Phase 6/7 (audit 2026-06-14): ingest persona .md files into role+fulfillment.
 *
 * Walks `.agent/agents/*.md` and `.claude/agents/*.md`, parses YAML frontmatter,
 * derives role + fulfillment + qualities, and writes a JSON snapshot to
 * `.tnf/agent-registry-snapshot.json`. The snapshot is the canonical registry
 * view for downstream consumers (broker, dashboards, the seeder script).
 *
 * Idempotent: re-running overwrites the snapshot and reports deltas.
 *
 * Usage from tnf CLI:
 *   tnf agents classify                          # default paths, default snapshot
 *   tnf agents classify --paths a.md b.md        # explicit files
 *   tnf agents classify --snapshot <file>        # explicit output path
 *   tnf agents classify --dry-run                # don't write; print preview
 */
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

type ParsedFrontmatter = Record<string, unknown> & { name?: string };

type Classification = {
  sourcePath: string;
  sourceKind: '.agent/agents' | '.claude/agents' | 'explicit';
  name: string;
  description: string;
  // Phase 8 (audit 2026-06-14): aligned with canonical runtime vocabulary.
  //   - daccRole is the DACC-v1 hierarchy position (director/orchestrator/broker/worker/participant).
  //   - workerAction is the action primitive (formerly `role`).
  //   - type remains a legacy product/platform enum value.
  daccRole: 'director' | 'orchestrator' | 'broker' | 'worker' | 'participant';
  workerAction:
    | 'cli_coder'
    | 'cli_research'
    | 'cli_qa'
    | 'code_generation'
    | 'code_review'
    | 'orchestrator'
    | 'task'
    | 'unknown';
  type:
    | 'CLI_CODER'
    | 'CLI_KILO'
    | 'CLI_OPENCODE'
    | 'CLI_PI'
    | 'API_CLAUDE_CODE'
    | 'GITHUB_JULES'
    | 'TNF_CORE'
    | 'BASIC';
  capabilities: string[];
  provider: string;
  fulfillment: {
    vendor?: string;
    model?: string;
    transport: 'stdio' | 'http' | 'websocket' | 'browser-extension' | 'ide' | 'cli' | 'unknown';
    protocol_version?: string;
    prompt_doc_uri: string;
    tools?: string[];
    raw?: Record<string, unknown>;
  };
  traits: {
    observability: 'native' | 'mirrored' | 'opaque';
    subAgent_capable: boolean;
    orchestrates_agents: boolean;
    persona_source: 'self' | 'tnf' | 'platform' | 'fixed';
    autonomy_level: 'supervised' | 'semiautonomous' | 'autonomous';
    description?: string;
    // Phase 8: surface the DACC-v1 classification inside traits too for
    // fast GIN-index lookups (matches the `traits @> '{"daccRole":"orchestrator"}'`
    // query shape).
    daccRole?: 'director' | 'orchestrator' | 'broker' | 'worker' | 'participant';
  };
  // Back-compat alias for `traits` consumed by anything written against the
  // Phase 1-7 snapshot shape. Same value as `traits`.
  // @deprecated use `traits` instead.
  qualities?: {
    observability?: 'native' | 'mirrored' | 'opaque';
    subAgent_capable?: boolean;
    orchestrates_agents?: boolean;
    persona_source?: 'self' | 'tnf' | 'platform' | 'fixed';
    autonomy_level?: 'supervised' | 'semiautonomous' | 'autonomous';
    description?: string;
    daccRole?: 'director' | 'orchestrator' | 'broker' | 'worker' | 'participant';
  };
  // Back-compat alias for `workerAction` consumed by anything written
  // against the Phase 1-7 snapshot shape. Same value as `workerAction`.
  // @deprecated use `workerAction` instead.
  role?:
    | 'cli_coder'
    | 'cli_research'
    | 'cli_qa'
    | 'code_generation'
    | 'code_review'
    | 'orchestrator'
    | 'task'
    | 'unknown';
};

// ---------------------------------------------------------------------------
// Tiny YAML-frontmatter parser. Handles the 5 shapes I've seen in this repo.
// We avoid pulling in `js-yaml` to keep this command dependency-free.
// Supported per key:
//   key: value
//   key: "value with spaces"
//   key: 'value with spaces'
//   key: [a, b, c]
//   key:
//     - a
//     - b
// ---------------------------------------------------------------------------
function parseFrontmatter(content: string): ParsedFrontmatter {
  if (!content.startsWith('---')) return {};
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx < 0) return {};
  const block = content.slice(3, endIdx).replace(/^\n/, '');
  const lines = block.split(/\r?\n/);
  const out: ParsedFrontmatter = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1];
    let rest = m[2];
    // inline list [a, b, c]
    if (rest.trim().startsWith('[') && rest.trim().endsWith(']')) {
      const inner = rest.trim().slice(1, -1);
      out[key] = inner
        .split(',')
        .map((s) => unquote(s.trim()))
        .filter(Boolean);
      i += 1;
      continue;
    }
    // inline key: "value" or 'value' (rest may be empty)
    if (rest.trim() === '') {
      // could be a list under the key
      const items: string[] = [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i];
        const im = next.match(/^\s+-\s+(.*)$/);
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

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Role heuristics: map name + description + agentType + domain → role enum.
// Conservative: prefer 'unknown' over a wrong guess.
// ---------------------------------------------------------------------------
function deriveRole(meta: ParsedFrontmatter): Classification['workerAction'] {
  const name = String(meta.name || '').toLowerCase();
  const desc = String(meta.description || '').toLowerCase();
  const domain = Array.isArray(meta.domain) ? meta.domain.map((d) => String(d).toLowerCase()) : [];
  const agentType = String(meta.agentType || meta.agent_type || '').toLowerCase();

  // Domain hints first
  if (domain.some((d) => d.includes('orchestrat') || d.includes('system-architecture'))) {
    return 'orchestrator';
  }
  if (domain.some((d) => d.includes('analysis') || d.includes('visualization'))) {
    return 'unknown'; // could be analysis but not in our enum yet
  }
  // Description hints
  if (desc.includes('orchestrat') || desc.includes('coordinate')) return 'orchestrator';
  if (desc.includes('review') && desc.includes('code')) return 'code_review';
  if (desc.startsWith('must be used to provide advanced search')) return 'task';
  if (desc.includes('monitors') || desc.includes('sentinel')) return 'task';

  // Name patterns
  if (name.includes('orchestrator')) return 'orchestrator';
  if (name.includes('coordinator')) return 'orchestrator';
  if (name.includes('sec') || name.includes('security')) return 'task';
  if (name.includes('test') || name.includes('qa')) return 'cli_qa';
  if (name.includes('review')) return 'code_review';
  if (name.includes('research')) return 'cli_research';
  if (agentType === 'external') return 'cli_coder';
  return 'unknown';
}

function deriveType(name: string, meta: ParsedFrontmatter): Classification['type'] {
  const n = name.toLowerCase();
  if (n.includes('claude-code')) return 'API_CLAUDE_CODE';
  if (n.includes('kilo')) return 'CLI_KILO';
  if (n.includes('opencode')) return 'CLI_OPENCODE';
  if (n.includes('pi')) return 'CLI_PI';
  if (n.includes('jules')) return 'GITHUB_JULES';
  if (n.includes('tnf') || n.includes('hermes')) return 'TNF_CORE';
  return 'BASIC';
}

function deriveProvider(meta: ParsedFrontmatter): string {
  const agentType = String(meta.agentType || meta.agent_type || '').toLowerCase();
  return agentType || 'tnf-persona';
}

function deriveTools(meta: ParsedFrontmatter): string[] {
  const tools = Array.isArray(meta.tools) ? (meta.tools as string[]) : [];
  // Lower-case + normalize ALL_CAPS names like "Bash" -> "bash"
  return tools.map((t) => String(t).toLowerCase()).filter(Boolean);
}

function deriveCapabilities(meta: ParsedFrontmatter): string[] {
  const caps = Array.isArray(meta.capabilities)
    ? (meta.capabilities as string[]).map((c) => String(c).toLowerCase())
    : [];
  const skills = Array.isArray(meta.skills)
    ? (meta.skills as string[]).map((c) => String(c).toLowerCase())
    : [];
  return Array.from(new Set([...caps, ...skills]));
}

function deriveObservability(meta: ParsedFrontmatter, sourceKind: Classification['sourceKind']) {
  // Personas we discovered from .agent/agents/ are mirrored (TNF observes them
  // via heartbeat, not via vendor-native observability).
  if (sourceKind === '.agent/agents' || sourceKind === '.claude/agents') return 'mirrored';
  return 'native';
}

function derivePersonaSource(meta: ParsedFrontmatter): Classification['traits']['persona_source'] {
  const agentType = String(meta.agentType || meta.agent_type || '').toLowerCase();
  if (agentType === 'external') return 'platform';
  if (agentType === 'internal') return 'tnf';
  return 'self';
}

// Phase 8: DACC-v1 hierarchy position. Most personas in .agent/agents/ and
// .claude/agents/ are 'worker'-class agents per DACC-v1; 'orchestrator',
// 'broker', 'director' are explicit promotions, never inferred.
function deriveDaccRole(name: string, meta: ParsedFrontmatter): Classification['daccRole'] {
  const n = String(name || '').toLowerCase();
  if (n.includes('orchestrator') || n.includes('master-clock')) return 'orchestrator';
  if (n.includes('broker')) return 'broker';
  if (n.includes('director')) return 'director';
  if (n.includes('participant')) return 'participant';
  return 'worker';
}

export function classifyOne(
  filePath: string,
  sourceKind: Classification['sourceKind']
): Classification {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const meta = parseFrontmatter(raw);
  const name = String(meta.name || path.basename(filePath, '.md'));
  const description = String(meta.description || '');
  const workerAction = deriveRole(meta);
  const type = deriveType(name, meta);

  return {
    sourcePath: filePath,
    sourceKind,
    name,
    description,
    // Phase 8 canonical fields:
    daccRole: deriveDaccRole(name, meta),
    workerAction,
    // Legacy `role` field kept for back-compat with any consumer reading the
    // old snapshot shape. Same value as workerAction.
    // @deprecated use `workerAction` instead.
    role: workerAction,
    type,
    capabilities: deriveCapabilities(meta),
    provider: deriveProvider(meta),
    fulfillment: {
      // vendor is best-effort; "self" personas get the file basename
      vendor:
        type === 'CLI_KILO'
          ? 'kilo'
          : type === 'CLI_OPENCODE'
            ? 'opencode'
            : type === 'API_CLAUDE_CODE'
              ? 'anthropic'
              : type === 'GITHUB_JULES'
                ? 'google'
                : type === 'TNF_CORE'
                  ? 'tnf'
                  : String(meta.agentType || meta.agent_type || 'tnf-persona'),
      model: typeof meta.model === 'string' ? meta.model : undefined,
      transport:
        type === 'CLI_KILO' ||
        type === 'CLI_OPENCODE' ||
        type === 'CLI_PI' ||
        type === 'API_CLAUDE_CODE'
          ? 'cli'
          : type === 'TNF_CORE'
            ? 'websocket'
            : 'unknown',
      protocol_version: typeof meta.version === 'string' ? meta.version : undefined,
      prompt_doc_uri: `persona://${filePath}`,
      tools: deriveTools(meta),
      raw: {
        agentType: meta.agentType || meta.agent_type,
        domain: meta.domain,
        category: meta.category,
        ...(meta.color ? { color: meta.color } : {}),
      },
    },
    // Phase 8 canonical field:
    traits: {
      observability: deriveObservability(meta, sourceKind),
      subAgent_capable: false,
      orchestrates_agents: workerAction === 'orchestrator',
      persona_source: derivePersonaSource(meta),
      autonomy_level: 'semiautonomous',
      description: description.slice(0, 280),
      daccRole: deriveDaccRole(name, meta), // also surface inside traits for fast lookup
    },
    // @deprecated use `traits` instead.
    qualities: {} as Classification['traits'],
  };
}

function walkPersonaDir(dir: string, sourceKind: '.agent/agents' | '.claude/agents'): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

export function runAgentsClassify(options: {
  repoRoot: string;
  paths?: string[];
  snapshot?: string;
  dryRun?: boolean;
}) {
  const repoRoot = options.repoRoot;
  const defaultPaths = [
    ...walkPersonaDir(path.join(repoRoot, '.agent/agents'), '.agent/agents'),
    ...walkPersonaDir(path.join(repoRoot, '.claude/agents'), '.claude/agents'),
  ];
  const explicit = options.paths ?? [];
  const resolved =
    explicit.length > 0
      ? explicit.map((p) => ({
          file: path.isAbsolute(p) ? p : path.join(repoRoot, p),
          sourceKind: 'explicit' as const,
        }))
      : defaultPaths.map((file) => ({
          file,
          sourceKind: file.includes('/.agent/agents/')
            ? ('.agent/agents' as const)
            : ('.claude/agents' as const),
        }));

  let classified: Classification[] = [];
  const errors: { file: string; error: string }[] = [];
  for (const { file, sourceKind } of resolved) {
    try {
      classified.push(classifyOne(file, sourceKind));
    } catch (err: any) {
      errors.push({ file, error: String(err?.message || err) });
    }
  }

  // Idempotency: read prior snapshot if present, then compute counts.
  const snapshotPath = options.snapshot
    ? path.isAbsolute(options.snapshot)
      ? options.snapshot
      : path.join(repoRoot, options.snapshot)
    : path.join(repoRoot, '.tnf', 'agent-registry-snapshot.json');

  let priorNames = new Set<string>();
  if (fs.existsSync(snapshotPath)) {
    try {
      const prior = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
      if (Array.isArray(prior?.agents)) {
        priorNames = new Set(prior.agents.map((a: any) => String(a.name)));
      }
    } catch {
      // ignore; we're about to overwrite anyway
    }
  }
  const newNames = new Set(classified.map((c) => c.name));
  let inserted = 0;
  let updated = 0;
  for (const c of classified) {
    if (priorNames.has(c.name)) updated += 1;
    else inserted += 1;
  }

  const summary = {
    spec: 'tnf/agent-registry-snapshot/0.1',
    generatedAt: new Date().toISOString(),
    sourceAudit: 'docs/protocols/reports/AGENT_CLASSIFICATION_AUDIT_2026-06-14.md',
    counts: {
      filesScanned: classified.length + errors.length,
      classified: classified.length,
      errors: errors.length,
      inserted,
      updated,
      unchanged: priorNames.size - updated,
    },
    agents: classified,
  };

  if (options.dryRun) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    return { dryRun: true, summary };
  }

  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, JSON.stringify(summary, null, 2));
  process.stdout.write(
    `[tnf agents classify] scanned=${classified.length + errors.length} classified=${classified.length} ` +
      `inserted=${inserted} updated=${updated} errors=${errors.length} snapshot=${snapshotPath}\n`
  );
  if (errors.length > 0) {
    process.stdout.write(`[tnf agents classify] warnings (${errors.length}):\n`);
    for (const e of errors) process.stdout.write(`  - ${e.file}: ${e.error}\n`);
  }
  return { summary };
}

export function registerAgentsClassifyCommand(program: Command, repoRoot: string): void {
  const agents = program.commands.find((c) => c.name() === 'agents');
  if (!agents) {
    // Fallback: attach to root. We'll never hit this in production cli.ts.
    program
      .command('agents:classify')
      .description('Alias: see `tnf agents classify`')
      .option('--paths <paths...>', 'Persona files to classify (absolute or repo-relative)')
      .option('--snapshot <path>', 'Output JSON snapshot path', '.tnf/agent-registry-snapshot.json')
      .option('--dry-run', 'Print the snapshot to stdout and do not write')
      .action((options: { paths?: string[]; snapshot?: string; dryRun?: boolean }) => {
        runAgentsClassify({ repoRoot, ...options });
      });
    return;
  }
  agents
    .command('classify')
    .description('Parse persona .md files and snapshot role+fulfillment into the registry.')
    .option('--paths <paths...>', 'Persona files to classify (absolute or repo-relative)')
    .option('--snapshot <path>', 'Output JSON snapshot path', '.tnf/agent-registry-snapshot.json')
    .option('--dry-run', 'Print the snapshot to stdout and do not write')
    .action((options: { paths?: string[]; snapshot?: string; dryRun?: boolean }) => {
      try {
        runAgentsClassify({ repoRoot, ...options });
      } catch (err: any) {
        process.stderr.write(`[tnf agents classify] error: ${err?.message || err}\n`);
        process.exit(1);
      }
    });
}
