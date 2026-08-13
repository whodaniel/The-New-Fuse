/**
 * Contract guard for the user-configurable provider registry.
 *
 * Until 2026-08-05 the LLM provider list was a hardcoded array inside
 * ModelsService.listProviders(), making it the fourth uncoordinated copy of
 * "which providers exist" across this machine. Lifting it into
 * `~/.config/tnf/providers.json` is only an improvement if the loader is
 * strictly non-destructive: a missing file, a malformed file, or a partial
 * override must never shrink the registry to nothing, and must never degrade
 * silently — a provider list that quietly loses entries is precisely how a
 * failover chain stops failing over.
 *
 * These tests drive the loader through TNF_PROVIDER_CONFIG_PATH so they never
 * touch the real ~/.config/tnf.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli test
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

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

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-provider-config-'));

/**
 * Point the loader at a temp file and read it. loadProviderConfig() resolves
 * TNF_PROVIDER_CONFIG_PATH and re-reads disk on every call, so no module
 * cache-busting is needed.
 */
async function loadWith(contents: string | null): Promise<any> {
  const { loadProviderConfig } = await import('./provider-config.js');
  const p = path.join(tmpRoot, `providers-${Math.random().toString(36).slice(2)}.json`);
  if (contents !== null) fs.writeFileSync(p, contents, 'utf8');
  process.env.TNF_PROVIDER_CONFIG_PATH = p;
  return loadProviderConfig();
}

async function main(): Promise<void> {
  const { DEFAULT_PROVIDERS, DEFAULT_TOLERANCES, loadProviderCatalog } =
    await import('./provider-config.js');

  // The effective floor is the shared catalog when it is readable, and the
  // built-in array otherwise. These assertions are about that floor being
  // PRESERVED through degradation and override — not about a specific count.
  // Hardcoding DEFAULT_PROVIDERS.length here made them fail the moment the
  // catalog became the source, which is a stale test rather than a regression.
  const catalog = loadProviderCatalog();
  const baselineCount = catalog?.providers.length || DEFAULT_PROVIDERS.length;

  // --- no config file -----------------------------------------------------
  const none = await loadWith(null);
  check(
    'missing file falls back to the baseline registry',
    none.providers.length === baselineCount,
    `got ${none.providers.length}, expected ${baselineCount}`
  );
  check('missing file reports source=defaults', none.source === 'defaults');
  check(
    'missing file raises no warnings',
    none.warnings.length === 0,
    JSON.stringify(none.warnings)
  );
  check(
    'missing file uses built-in tolerances',
    none.tolerances.cacheExpiryMs === DEFAULT_TOLERANCES.cacheExpiryMs &&
      none.tolerances.fetchTimeoutMs === DEFAULT_TOLERANCES.fetchTimeoutMs
  );

  // --- malformed JSON -----------------------------------------------------
  const broken = await loadWith('{ this is not json');
  check(
    'malformed file still yields a usable registry',
    broken.providers.length === baselineCount,
    `got ${broken.providers.length}, expected ${baselineCount}`
  );
  check('malformed file degrades loudly', broken.warnings.length > 0);
  check(
    'malformed warning names the file',
    broken.warnings.some((w: string) => w.includes('not valid JSON')),
    JSON.stringify(broken.warnings)
  );

  // --- partial override ---------------------------------------------------
  const partial = await loadWith(JSON.stringify({ providers: [{ id: 'openai', tier: 1 }] }));
  check(
    'overriding one provider preserves the rest',
    partial.providers.length === baselineCount,
    `got ${partial.providers.length}, expected ${baselineCount}`
  );
  check('override is applied', partial.providers.find((p: any) => p.id === 'openai')?.tier === 1);
  check(
    'overridden provider keeps built-in fields it did not set',
    partial.providers.find((p: any) => p.id === 'openai')?.envKey === 'OPENAI_API_KEY'
  );
  check('providers are sorted by tier', partial.providers[0].id === 'openai');

  // --- new provider -------------------------------------------------------
  const added = await loadWith(
    JSON.stringify({
      providers: [
        {
          id: 'localllm',
          name: 'Local',
          envKey: 'LOCAL_API_KEY',
          baseUrl: 'http://localhost:1234/v1',
          tier: 5,
        },
      ],
    })
  );
  check(
    'user can add a provider',
    added.providers.some((p: any) => p.id === 'localllm')
  );
  check('added provider sorts by its tier', added.providers[0].id === 'localllm');

  // --- unprobeable provider is rejected loudly ----------------------------
  const bad = await loadWith(JSON.stringify({ providers: [{ id: 'ghost', name: 'Ghost' }] }));
  check(
    'provider with no baseUrl/envKey is dropped',
    !bad.providers.some((p: any) => p.id === 'ghost')
  );
  check(
    'dropping an unprobeable provider is reported',
    bad.warnings.some((w: string) => w.includes('ghost')),
    JSON.stringify(bad.warnings)
  );

  // --- disabling ----------------------------------------------------------
  const disabled = await loadWith(
    JSON.stringify({ providers: [{ id: 'openai', enabled: false }] })
  );
  check(
    'provider can be disabled without being removed',
    disabled.providers.find((p: any) => p.id === 'openai')?.enabled === false
  );

  // --- tolerances ---------------------------------------------------------
  const tol = await loadWith(JSON.stringify({ tolerances: { fetchTimeoutMs: 250 } }));
  check('tolerance override is applied', tol.tolerances.fetchTimeoutMs === 250);
  check(
    'unset tolerance keeps its default',
    tol.tolerances.cacheExpiryMs === DEFAULT_TOLERANCES.cacheExpiryMs
  );

  const badTol = await loadWith(JSON.stringify({ tolerances: { fetchTimeoutMs: -5 } }));
  check(
    'invalid tolerance is rejected',
    badTol.tolerances.fetchTimeoutMs === DEFAULT_TOLERANCES.fetchTimeoutMs
  );
  check(
    'invalid tolerance is reported',
    badTol.warnings.some((w: string) => w.includes('fetchTimeoutMs'))
  );

  fs.rmSync(tmpRoot, { recursive: true, force: true });

  console.log(`\n  ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
