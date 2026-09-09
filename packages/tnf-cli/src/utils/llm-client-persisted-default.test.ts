/**
 * Contract guard for the persisted operator default model.
 *
 * Until 2026-09-05 `tnf models --select` wrote ~/.config/tnf/model.default.json
 * but LLMClient.resolveProvider() never read it — the operator's explicit
 * choice was silently ignored in every process that did not inherit an
 * interactive shell's TNF_LLM_* exports (cron, launchd, agent harnesses),
 * which then fell through the chain to NVIDIA. Strategy 1.5 makes the
 * persisted default authoritative: it must outrank the model-providers.json
 * chain, lose only to explicit env vars, and degrade (never fail closed)
 * when its provider is unknown or has no credential in env.
 *
 * These tests drive the resolver through TNF_DEFAULT_MODEL_PATH and
 * TNF_PROVIDER_CONFIG_PATH so they never touch the real ~/.config/tnf.
 *
 * Run: tsx src/utils/llm-client-persisted-default.test.ts
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

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-persisted-default-'));
const fixtureModelPath = path.join(tmpRoot, 'model.default.json');
const fixtureProvidersPath = path.join(tmpRoot, 'providers.json');

const PREV = {
  TNF_DEFAULT_MODEL_PATH: process.env.TNF_DEFAULT_MODEL_PATH,
  TNF_PROVIDER_CONFIG_PATH: process.env.TNF_PROVIDER_CONFIG_PATH,
  ALPHA_KEY: process.env.ALPHA_KEY,
  BETA_KEY: process.env.BETA_KEY,
  TNF_LLM_BASE_URL: process.env.TNF_LLM_BASE_URL,
  TNF_LLM_API_KEY: process.env.TNF_LLM_API_KEY,
  TNF_LLM_MODEL: process.env.TNF_LLM_MODEL,
};

function restoreEnv(): void {
  for (const [key, value] of Object.entries(PREV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

// Two cloud providers, both credentialed. The model-providers.json chain
// never sees them, so any resolution naming beta proves the persisted
// default won; any resolution naming alpha-after-skip proves graceful
// degradation rather than a hard failure.
fs.writeFileSync(
  fixtureProvidersPath,
  JSON.stringify({
    providers: [
      {
        id: 'alpha',
        name: 'Alpha',
        type: 'cloud',
        envKey: 'ALPHA_KEY',
        altEnvKeys: [],
        baseUrl: 'https://alpha.test/v1',
        modelsPath: '/models',
        authStyle: 'bearer',
        authOptional: false,
        tier: 10,
        enabled: true,
        models: ['alpha-model-1'],
      },
      {
        id: 'beta',
        name: 'Beta',
        type: 'cloud',
        envKey: 'BETA_KEY',
        altEnvKeys: [],
        baseUrl: 'https://beta.test/v1',
        modelsPath: '/models',
        authStyle: 'bearer',
        authOptional: false,
        tier: 20,
        enabled: true,
        models: ['beta-model-1'],
      },
    ],
  }),
  'utf8'
);

// Extra fields (source, id, ISO-string updatedAt) mirror the real file
// written by setDefaultModel and external verification scripts.
function writePersistedDefault(body: Record<string, unknown>): void {
  fs.writeFileSync(fixtureModelPath, JSON.stringify(body), 'utf8');
}

async function resolveCurrent(): Promise<{
  provider: string;
  model: string;
  baseUrl: string;
}> {
  const { LLMClient } = await import('../utils/llm-client.js');
  const client = await LLMClient.create('probe');
  return { provider: client.providerName, model: client.model, baseUrl: client.baseUrl };
}

try {
  // ── Unit: readPersistedDefaultModel ──────────────────────────────────
  const { readPersistedDefaultModel, defaultModelPath } = await import(
    '../services/ModelsService.js'
  );
  process.env.TNF_DEFAULT_MODEL_PATH = fixtureModelPath;
  process.env.TNF_PROVIDER_CONFIG_PATH = fixtureProvidersPath;
  delete process.env.TNF_LLM_BASE_URL;
  delete process.env.TNF_LLM_API_KEY;
  delete process.env.TNF_LLM_MODEL;

  check('defaultModelPath honours TNF_DEFAULT_MODEL_PATH', defaultModelPath() === fixtureModelPath);
  fs.writeFileSync(fixtureModelPath, 'not json at all {', 'utf8');
  check('malformed file degrades to null', readPersistedDefaultModel() === null);
  writePersistedDefault({ provider: 'beta' });
  check('incomplete file (no model) degrades to null', readPersistedDefaultModel() === null);
  writePersistedDefault({
    provider: ' beta ',
    model: ' beta-model-1 ',
    updatedAt: '2026-09-05T00:00:00Z',
    id: 'fixture-id',
    source: 'external verification script',
  });
  const readBack = readPersistedDefaultModel();
  check(
    'extra fields tolerated, values trimmed',
    readBack?.provider === 'beta' && readBack.model === 'beta-model-1',
    JSON.stringify(readBack)
  );

  // ── Integration: Strategy 1.5 in resolveProvider ─────────────────────
  writePersistedDefault({ provider: 'beta', model: 'beta-model-1' });
  process.env.ALPHA_KEY = 'alpha-secret';
  process.env.BETA_KEY = 'beta-secret';

  const won = await resolveCurrent();
  check(
    'persisted default outranks chain + tier order',
    won.provider === 'beta' && won.model === 'beta-model-1' && won.baseUrl === 'https://beta.test/v1',
    JSON.stringify(won)
  );

  delete process.env.BETA_KEY;
  const skipped = await resolveCurrent();
  check(
    'missing credential degrades to next strategy (never beta)',
    skipped.provider !== 'beta' && skipped.baseUrl !== 'https://beta.test/v1',
    JSON.stringify(skipped)
  );

  process.env.BETA_KEY = 'beta-secret';
  fs.unlinkSync(fixtureModelPath);
  const noFile = await resolveCurrent();
  check(
    'missing persisted file leaves existing resolution untouched (never beta)',
    noFile.provider !== 'beta',
    JSON.stringify(noFile)
  );

  const unknownProvider = path.join(tmpRoot, 'unknown.default.json');
  fs.writeFileSync(unknownProvider, JSON.stringify({ provider: 'ghost', model: 'x' }), 'utf8');
  process.env.TNF_DEFAULT_MODEL_PATH = unknownProvider;
  const unknown = await resolveCurrent();
  check(
    'unknown persisted provider degrades to next strategy',
    unknown.provider !== 'ghost',
    JSON.stringify(unknown)
  );

  // Strategy 1 still outranks the persisted default.
  process.env.TNF_DEFAULT_MODEL_PATH = fixtureModelPath;
  process.env.TNF_LLM_BASE_URL = 'https://env-override.test/v1';
  process.env.TNF_LLM_API_KEY = 'env-secret';
  process.env.TNF_LLM_MODEL = 'env-model-1';
  const envWins = await resolveCurrent();
  check(
    'explicit env vars still outrank persisted default',
    envWins.provider === 'custom' && envWins.model === 'env-model-1',
    JSON.stringify(envWins)
  );
} finally {
  restoreEnv();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
