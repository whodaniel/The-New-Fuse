/**
 * packages/tnf-cli/src/commands/models.ts
 *
 * `tnf catalog` — inspect & switch the active LLM model from the canonical
 * free-NVIDIA catalog.
 *
 *   tnf catalog list                         List all free NVIDIA models
 *   tnf catalog list --provider <id>         Limit to one provider
 *   tnf catalog list --category <cat>        Filter (chat|reasoning|vision|embedding|code|safety|asr|tts|...)
 *   tnf catalog list --search <query>        Substring filter
 *   tnf catalog list --verified-only         Hide listed/microservice entries
 *   tnf catalog list --json                  Machine-readable
 *
 *   tnf catalog show <id>                    Show metadata for one model
 *   tnf catalog set <id> [--provider nvidia] Make this the active model
 *
 *   tnf catalog categories                   List distinct categories + counts
 *   tnf catalog refresh                      Re-fetch /v1/models live from provider
 *
 * The catalog source is data/providers/catalog.json (provider list) +
 * data/providers/nvidia-models.json (full free NVIDIA NIM catalog).
 * Hardcoded lists that used to live here were removed — see
 * llm-provider-detector.ts and available-models.controller.ts for the
 * parallel refactors.
 *
 * Note: the kilo-parity `tnf models` command is owned by cli.ts (uses
 * ModelsService for cost / context-window data). This command is the
 * hermes-parity counterpart with the full NVIDIA NIM surface.
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { registerOrNest } from './_registry.js';

interface CatalogProvider {
  id: string;
  name?: string;
  envKey?: string | null;
  baseUrl?: string;
  tier?: number;
  enabled?: boolean;
  defaultModel?: string;
  models?: string[];
}

interface NvModel {
  id: string;
  vendor?: string;
  family?: string;
  category?: string;
  endpoints?: string[];
  liveStatus?: string;
  free?: boolean;
  source?: string;
  buildSlug?: string;
  description?: string;
}

interface NvRegistry {
  count?: number;
  models?: NvModel[];
  warning?: string;
}

function repoRoot(): string {
  // tnf-cli is run from the repo root in practice, but fall back to walking up.
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, 'data/providers/catalog.json'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function resolveRepoFile(rel: string): string | null {
  const override = process.env.TNF_PROVIDER_CATALOG_PATH;
  if (rel === 'catalog.json' && override) {
    if (fs.existsSync(override)) return override;
  }
  const root = repoRoot();
  const candidates = [path.join(root, 'data/providers', rel), path.join(root, 'data', rel)];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return null;
}

function loadCatalog(): { providers: CatalogProvider[]; warning?: string } {
  const p = resolveRepoFile('catalog.json');
  if (!p) return { providers: [], warning: 'data/providers/catalog.json not found' };
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { providers: Array.isArray(raw?.providers) ? raw.providers : [] };
  } catch (err) {
    return { providers: [], warning: `${p} unreadable: ${(err as Error).message}` };
  }
}

function loadNvidiaRegistry(): { models: NvModel[]; warning?: string } {
  const p = resolveRepoFile('nvidia-models.json');
  if (!p) return { models: [], warning: 'data/providers/nvidia-models.json not found' };
  try {
    const raw: NvRegistry = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { models: Array.isArray(raw.models) ? raw.models : [] };
  } catch (err) {
    return { models: [], warning: `${p} unreadable: ${(err as Error).message}` };
  }
}

function setActiveModel(modelId: string, providerId: string): { wrote: string; path: string } {
  const lines: string[] = [];
  if (process.env.TNF_LLM_MODEL)
    lines.push(`# existing TNF_LLM_MODEL=${process.env.TNF_LLM_MODEL}`);
  if (process.env.TNF_LLM_BASE_URL)
    lines.push(`# existing TNF_LLM_BASE_URL=${process.env.TNF_LLM_BASE_URL}`);
  lines.push(`TNF_LLM_MODEL=${modelId}`);
  if (providerId === 'nvidia') {
    lines.push('TNF_LLM_BASE_URL=https://integrate.api.nvidia.com/v1');
  }
  const target = path.join(repoRoot(), '.env.models');
  fs.writeFileSync(target, lines.join('\n') + '\n', 'utf8');
  return { wrote: lines.join('\n'), path: target };
}

/* ────────────────────────────── list ────────────────────────────── */

interface ListOpts {
  provider?: string;
  category?: string;
  search?: string;
  verifiedOnly?: boolean;
  json?: boolean;
}

function listModels(opts: ListOpts): void {
  const cat = loadCatalog();
  const nv = loadNvidiaRegistry();

  // Build a metadata lookup so catalog models can be annotated.
  const nvMeta = new Map<string, NvModel>();
  for (const m of nv.models) nvMeta.set(m.id, m);

  // Provider filter
  let providers = cat.providers.filter((p) => p.enabled !== false);
  if (opts.provider) providers = providers.filter((p) => p.id === opts.provider);

  const rows: Array<{
    provider: string;
    model: string;
    category?: string;
    vendor?: string;
    liveStatus?: string;
    free?: boolean;
  }> = [];

  for (const p of providers) {
    const ids = Array.isArray(p.models) ? p.models : [];
    for (const id of ids) {
      const meta = nvMeta.get(id);
      if (opts.category && meta?.category !== opts.category) continue;
      if (opts.verifiedOnly && meta?.liveStatus !== 'verified') continue;
      if (opts.search) {
        const q = opts.search.toLowerCase();
        const hay =
          `${id} ${meta?.family ?? ''} ${meta?.vendor ?? ''} ${meta?.category ?? ''}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      rows.push({
        provider: p.id,
        model: id,
        category: meta?.category,
        vendor: meta?.vendor,
        liveStatus: meta?.liveStatus,
        free: meta?.free ?? true,
      });
    }
  }

  // Also include NVIDIA microservice entries when --provider nvidia (no chat id yet)
  if ((!opts.provider || opts.provider === 'nvidia') && !opts.category) {
    for (const m of nv.models) {
      if (!m.id.startsWith('build.nvidia.com/')) continue; // microservice IDs only
      if (opts.search) {
        const q = opts.search.toLowerCase();
        const hay = `${m.id} ${m.family ?? ''} ${m.description ?? ''}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      rows.push({
        provider: 'nvidia',
        model: m.id,
        category: m.category,
        vendor: m.vendor,
        liveStatus: m.liveStatus,
        free: m.free ?? true,
      });
    }
  }

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          count: rows.length,
          providers: providers.map((p) => p.id),
          warnings: [cat.warning, nv.warning].filter(Boolean),
          models: rows,
        },
        null,
        2
      )
    );
    return;
  }

  if (cat.warning || nv.warning) {
    console.error(`# ${[cat.warning, nv.warning].filter(Boolean).join('; ')}`);
  }
  console.log(`\n  ${rows.length} free model(s)`);
  if (opts.provider) console.log(`    provider : ${opts.provider}`);
  if (opts.category) console.log(`    category : ${opts.category}`);
  if (opts.search) console.log(`    search   : ${opts.search}`);
  if (opts.verifiedOnly) console.log(`    verified : only`);
  console.log('');

  // Group by category for human reading
  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = r.category || 'unknown';
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(r);
  }
  for (const [catName, items] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  [${catName}]  (${items.length})`);
    for (const r of items.slice(0, 50)) {
      const flag =
        r.liveStatus === 'verified'
          ? '✓ '
          : r.liveStatus === 'listed'
            ? '~ '
            : r.liveStatus === 'microservice'
              ? '◆ '
              : r.liveStatus === 'vision-only'
                ? '◐ '
                : '  ';
      console.log(`    ${flag}${r.model}`);
    }
    if (items.length > 50) console.log(`    … and ${items.length - 50} more`);
    console.log('');
  }
}

/* ────────────────────────────── show ────────────────────────────── */

function showModel(modelId: string): void {
  const nv = loadNvidiaRegistry();
  const cat = loadCatalog();

  const inCatalog = cat.providers.some(
    (p) => Array.isArray(p.models) && p.models.includes(modelId)
  );
  const meta = nv.models.find((m) => m.id === modelId);

  if (!inCatalog && !meta) {
    console.error(`Model "${modelId}" not found in catalog or NVIDIA registry`);
    process.exit(1);
  }

  const out: Record<string, unknown> = {
    id: modelId,
    inCatalog,
    catalogProviders: cat.providers
      .filter((p) => Array.isArray(p.models) && p.models.includes(modelId))
      .map((p) => p.id),
  };
  if (meta) {
    out.vendor = meta.vendor;
    out.family = meta.family;
    out.category = meta.category;
    out.endpoints = meta.endpoints;
    out.liveStatus = meta.liveStatus;
    out.free = meta.free;
    out.source = meta.source;
    out.buildSlug = meta.buildSlug;
    out.description = meta.description;
  }
  console.log(JSON.stringify(out, null, 2));
}

/* ────────────────────────────── set ────────────────────────────── */

function setModel(modelId: string, provider: string): void {
  const cat = loadCatalog();
  const nv = loadNvidiaRegistry();
  const inCatalog = cat.providers.some(
    (p) => p.id === provider && Array.isArray(p.models) && p.models.includes(modelId)
  );
  const inNvRegistry = nv.models.some((m) => m.id === modelId);

  if (!inCatalog && !inNvRegistry) {
    console.error(
      `Model "${modelId}" not found for provider "${provider}" in catalog or NVIDIA registry. Run \`tnf models list --provider ${provider} --search <q>\` to find it.`
    );
    process.exit(1);
  }

  const { wrote, path: outPath } = setActiveModel(modelId, provider);
  console.log(`✓ Active model set to ${provider}/${modelId}`);
  console.log(`  Wrote: ${outPath}`);
  console.log(
    `  Content:\n${wrote
      .split('\n')
      .map((l) => '    ' + l)
      .join('\n')}`
  );
  console.log(`\n  To activate for THIS shell, run: \`export $(grep -v '^#' ${outPath} | xargs)\``);
}

/* ────────────────────────────── categories ────────────────────────────── */

function listCategories(): void {
  const nv = loadNvidiaRegistry();
  const counts = new Map<string, number>();
  for (const m of nv.models) {
    const k = m.category || 'unknown';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n  ${rows.length} categories across ${nv.models.length} entries\n`);
  for (const [cat, count] of rows) {
    console.log(`    ${cat.padEnd(22)} ${String(count).padStart(4)}`);
  }
  console.log('');
}

/* ────────────────────────────── refresh ────────────────────────────── */

async function refreshLive(provider: string): Promise<void> {
  const cat = loadCatalog();
  const p = cat.providers.find((x) => x.id === provider);
  if (!p || !p.envKey || !p.baseUrl) {
    console.error(`Provider "${provider}" not found in catalog or missing env/baseUrl`);
    process.exit(1);
  }
  const apiKey = process.env[p.envKey];
  if (!apiKey) {
    console.error(`${p.envKey} is not set — cannot probe ${provider}`);
    process.exit(1);
  }
  console.log(`Probing ${p.baseUrl}/models with ${p.envKey}...`);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const resp = await fetch(`${p.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!resp.ok) {
      console.error(`HTTP ${resp.status} ${resp.statusText}`);
      process.exit(1);
    }
    const data = (await resp.json()) as { data?: Array<{ id?: string }> };
    const ids = (data.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
    console.log(`Live models: ${ids.length}`);
    for (const id of ids) console.log(`  ${id}`);
  } catch (err) {
    console.error(`Probe failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

/* ────────────────────────────── registration ────────────────────────────── */

export function registerCatalogCommand(program: Command): void {
  // `tnf catalog` (top-level). Using registerOrNest so any future
  // `ai catalog` / `models catalog` surface nests underneath without
  // colliding — see commands/_registry.ts.
  const { command: catalog } = registerOrNest(program, 'catalog', 'inspect');

  catalog.description('Inspect the free NVIDIA / LLM catalog and switch the active model');

  catalog
    .command('list')
    .alias('ls')
    .description('List free models from the canonical catalog')
    .option('--provider <id>', 'Limit to one provider')
    .option('--category <cat>', 'Filter by category (chat|reasoning|vision|...)')
    .option('--search <query>', 'Substring filter on id/family/vendor/category')
    .option('--verified-only', 'Hide listed/microservice entries')
    .option('--json', 'Machine-readable JSON')
    .action((opts: ListOpts) => listModels(opts));

  catalog
    .command('show <modelId>')
    .description('Show full metadata for one model id')
    .action((id: string) => showModel(id));

  catalog
    .command('set <modelId>')
    .description('Make this the active model (writes .env.models)')
    .option('--provider <id>', 'Provider id (default: nvidia)', 'nvidia')
    .action((id: string, opts: { provider?: string }) => setModel(id, opts.provider || 'nvidia'));

  catalog
    .command('categories')
    .description('List distinct model categories with counts')
    .action(() => listCategories());

  catalog
    .command('refresh [provider]')
    .description('Re-fetch /v1/models live from a provider')
    .action(async (provider: string = 'nvidia') => refreshLive(provider));
}
