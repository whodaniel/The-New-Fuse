/**
 * Coherence guard for the shared provider catalog.
 *
 * TNF had four provider lists and no reconciliation between them:
 *
 *   provider-config.ts        7 providers — only place that knew NVIDIA NIM
 *   llm-provider-tester.cjs   9 providers — only place that knew local Ollama
 *   model_resolver.py         2 hardcoded constants
 *   llm-provider-status.json  generated output
 *
 * A provider added to one was invisible to the others, which is how the
 * autonomous worker fleet ended up unable to reach backends the CLI had been
 * using for months. `data/providers/catalog.json` is now the single source all
 * three code paths read.
 *
 * This test fails when the catalog is malformed, or when a consumer's built-in
 * fallback list drifts ahead of the catalog — i.e. when someone adds a provider
 * to code instead of to the catalog, restarting the exact divergence this
 * closed.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_PROVIDERS,
  loadProviderCatalog,
  loadProviderConfig,
  providerCatalogPath,
} from './provider-config.js';

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');

console.log('\nprovider catalog — the file itself');

const catalogPath = providerCatalogPath();
check('catalog resolves to a real file', fs.existsSync(catalogPath), catalogPath);

const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const rows: any[] = raw.providers ?? [];
check('catalog has providers', rows.length > 0);
check(
  'catalog covers the 22 directly discoverable TNF providers',
  rows.length >= 22,
  String(rows.length)
);

const ids = rows.map((r) => r.id);
check('every provider has an id', ids.every(Boolean));
check('ids are unique', new Set(ids).size === ids.length, ids.join(','));
check(
  'every provider has a baseUrl',
  rows.every((r) => typeof r.baseUrl === 'string' && r.baseUrl.startsWith('http'))
);
check(
  'every cloud provider declares an envKey',
  rows.filter((r) => r.type === 'cloud').every((r) => typeof r.envKey === 'string' && r.envKey)
);
check(
  'local providers declare a healthUrl so they can be probed',
  rows.filter((r) => r.type === 'local').every((r) => typeof r.healthUrl === 'string')
);
check(
  'tiers are numeric and orderable',
  rows.every((r) => typeof r.tier === 'number' && Number.isFinite(r.tier))
);

console.log('\nprovider catalog — TypeScript consumer');

const loaded = loadProviderCatalog();
check('loadProviderCatalog returns entries', (loaded?.providers.length ?? 0) > 0);
check('no warning on a healthy catalog', !loaded?.warning, loaded?.warning ?? '');
check(
  'TypeScript consumer includes local providers',
  loaded?.providers.some((provider) => provider.id === 'ollama' && provider.type === 'local') ??
    false
);
check(
  'TypeScript consumer hydrates the full NVIDIA registry',
  (loaded?.providers.find((provider) => provider.id === 'nvidia')?.models.length ?? 0) >= 200
);

const cfg = loadProviderConfig();
check(
  'loadProviderConfig surfaces catalog providers',
  cfg.providers.length >= 9,
  String(cfg.providers.length)
);
check(
  'no warnings from a healthy catalog',
  cfg.warnings.length === 0,
  JSON.stringify(cfg.warnings)
);

// The whole point: the catalog must be a superset of what the code knows.
const catalogIds = new Set(ids);
const missingFromCatalog = DEFAULT_PROVIDERS.filter((p) => !catalogIds.has(p.id)).map((p) => p.id);
check(
  'catalog covers every built-in DEFAULT_PROVIDERS entry',
  missingFromCatalog.length === 0,
  `missing: ${missingFromCatalog.join(', ')}`
);

console.log('\nprovider catalog — the other language consumers');

// These read the same JSON. Assert they still point at it, so a refactor that
// reintroduces a private list is caught here rather than in production months
// later.
const testerSrc = fs.readFileSync(
  path.join(repoRoot, 'scripts', 'swarm', 'llm-provider-tester.cjs'),
  'utf8'
);
check('tester loads the catalog', testerSrc.includes('loadCatalogProviders'));
check(
  'tester treats its inline list as a fallback, not the source',
  testerSrc.includes('FALLBACK_PROVIDERS')
);

const resolverSrc = fs.readFileSync(
  path.join(repoRoot, 'scripts', 'sub-director', 'model_resolver.py'),
  'utf8'
);
check('python resolver loads the catalog', resolverSrc.includes('_catalog_registry'));
check(
  'python resolver routes through the catalog registry, not the static map',
  resolverSrc.includes('registry = _catalog_registry()')
);

// Providers the tester's fallback knows that the catalog does not would mean
// the catalog is behind — the divergence, in the other direction.
// Aliases matter: the tester historically called Google "gemini" while
// provider-config called it "google". Same vendor, two ids — a divergence this
// guard caught on its first run. The catalog records the alias so both names
// resolve to one entry.
const knownNames = new Set<string>(ids);
for (const row of rows) {
  for (const alias of row.aliases ?? []) knownNames.add(alias);
}
check(
  'aliases are recorded so historical ids still resolve',
  knownNames.has('gemini') && catalogIds.has('google')
);

const fallbackIds = [...testerSrc.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
const testerOnly = [...new Set(fallbackIds)].filter((id) => !knownNames.has(id));
check(
  'no provider exists only in the tester fallback',
  testerOnly.length === 0,
  `catalog is missing: ${testerOnly.join(', ')}`
);

console.log(`\nprovider-catalog: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
