/**
 * scripts/seed-agent-registry.ts
 * Phase 4 (audit 2026-06-14): Idempotent seeder for canonical external agents.
 * Phase 9 addition: also assigns a deterministic `idNumber` (`ID#:<Base58>`)
 * and proper `canonicalEntityId` (`TNF:CATEGORY:PROVIDER:NAME:INSTANCE`) per row.
 *
 * Inserts kilo, opencode, pi, claude-code, hermes, jules into the `agents` table
 * with proper role + fulfillment + qualities metadata. Safe to re-run: each row
 * is keyed by (user_id, name), so the (id, ...) tuple won't duplicate.
 *
 * Run from the database package or repo root:
 *   pnpm --filter @the-new-fuse/database exec tsx scripts/seed-agent-registry.ts
 *
 * Requires DATABASE_URL env (or .env loaded).
 */
import { Client } from 'pg';

// -----------------------------------------------------------------------------
// Local copy of the canonical Base58 alphabet (Bitcoin-style) used by
// `packages/a2a-core/src/federated-identity.service.ts`. We duplicate the
// alphabet verbatim because this seeder must run without Redis, but we do
// NOT duplicate the persistence layer — id numbers here are seeded from a
// deterministic hash of the agent name so they're stable across re-runs and
// reproducible by external callers.
//
// Single source of truth for the alphabet lives in
// packages/a2a-core/src/federated-identity.service.ts FederatedIdentityService.
// Keep them in sync if the alphabet ever changes.
// -----------------------------------------------------------------------------
const FEDERATED_BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(num: number): string {
  if (!Number.isFinite(num) || num <= 0) return FEDERATED_BASE58_ALPHABET[0];
  let remaining = Math.trunc(num);
  let encoded = '';
  while (remaining > 0) {
    encoded = FEDERATED_BASE58_ALPHABET[remaining % 58] + encoded;
    remaining = Math.floor(remaining / 58);
  }
  return encoded;
}

function deterministicSeedNumber(seed: string): number {
  // FNV-1a 32-bit hash for a stable name -> integer. With max ~ 2^32 (4.3B)
  // and Base58 alphabet at 58^7 = 2.2T, this only uses ~2 chars of the
  // Base58 space encoded. That's deliberately conservative: federated ids
  // are sequential int -> Base58 in production, but seeded entries are
  // deterministic so re-running the seeder does not produce duplicate IDs.
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  // Bias into 1000-9999 range so the encoded Base58 is at least 2 chars
  // and visually distinctive from production IDs (which start at 1).
  return 1000 + (h % 9000);
}

function buildCanonicalEntityIdLocal(parts: {
  category: string;
  provider: string;
  name: string;
  instance?: number;
}): string {
  const norm = (s: string): string =>
    String(s)
      .trim()
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  const normInstance = (i?: number): string => {
    const n = typeof i === 'number' && Number.isFinite(i) ? Math.trunc(i) : 1;
    return String(n).padStart(3, '0');
  };
  const category = norm(parts.category);
  const provider = norm(parts.provider);
  const name = norm(parts.name);
  const instance = normInstance(parts.instance);
  if (!category || !provider || !name) {
    throw new Error(
      `buildCanonicalEntityIdLocal: category, provider, name are required (got ${JSON.stringify(parts)})`
    );
  }
  return ['TNF', category, provider, name, instance].join(':');
}

interface SeedAgent {
  name: string;
  type:
    | 'CLI_CODER'
    | 'CLI_KILO'
    | 'CLI_OPENCODE'
    | 'CLI_PI'
    | 'API_CLAUDE_CODE'
    | 'GITHUB_JULES'
    | 'TNF_CORE';
  role:
    | 'cli_coder'
    | 'cli_research'
    | 'code_generation'
    | 'code_review'
    | 'orchestrator'
    | 'task'
    | 'cli_qa';
  description: string;
  capabilities: string[];
  provider: string;
  fulfillment: {
    vendor: string;
    model?: string;
    transport: 'stdio' | 'http' | 'websocket' | 'browser-extension' | 'ide' | 'cli';
    protocol_version?: string;
    prompt_doc_uri?: string;
    tools?: string[];
    endpoint?: string;
    raw?: Record<string, unknown>;
  };
  qualities: {
    observability: 'native' | 'mirrored' | 'opaque';
    subAgent_capable: boolean;
    orchestrates_agents: boolean;
    persona_source: 'self' | 'tnf' | 'platform' | 'fixed';
    autonomy_level: 'supervised' | 'semiautonomous' | 'autonomous';
    description?: string;
  };
}

const SEED: SeedAgent[] = [
  {
    name: 'kilo-cli',
    type: 'CLI_KILO',
    role: 'cli_coder',
    description:
      'Kilo Code CLI coding agent (multi-vendor, multi-model). Persona selection + modification supported.',
    capabilities: ['code_generation', 'file_edit', 'terminal', 'web_research'],
    provider: 'kilo',
    fulfillment: {
      vendor: 'kilo',
      transport: 'cli',
      protocol_version: '0.74.x',
      prompt_doc_uri: 'tnf://agents/kilo-cli.md',
      tools: ['fs', 'shell', 'browser', 'lsp'],
      raw: { cli_command: 'kilo' },
    },
    qualities: {
      observability: 'mirrored',
      subAgent_capable: true,
      orchestrates_agents: false,
      persona_source: 'platform',
      autonomy_level: 'semiautonomous',
      description: 'Kilo CLI — multi-provider coding CLI; can spawn sub-agents.',
    },
  },
  {
    name: 'opencode-cli',
    type: 'CLI_OPENCODE',
    role: 'cli_coder',
    description: 'opencode CLI coding agent. Supports TUI sessions, plan-mode, and sessions DB.',
    capabilities: ['code_generation', 'file_edit', 'terminal'],
    provider: 'opencode',
    fulfillment: {
      vendor: 'opencode',
      transport: 'cli',
      protocol_version: '0.x',
      prompt_doc_uri: 'tnf://agents/opencode-cli.md',
      tools: ['fs', 'shell'],
      raw: {
        cli_command: 'opencode',
        session_storage: '~/.local/share/opencode/opencode.db',
      },
    },
    qualities: {
      observability: 'native',
      subAgent_capable: false,
      orchestrates_agents: false,
      persona_source: 'platform',
      autonomy_level: 'semiautonomous',
    },
  },
  {
    name: 'pi-coding-agent',
    type: 'CLI_PI',
    role: 'cli_coder',
    description:
      'Pi Coding Agent (@earendil-works/pi-coding-agent). Multi-provider, TUI, sessions, plan-mode.',
    capabilities: ['code_generation', 'file_edit', 'terminal'],
    provider: 'pi',
    fulfillment: {
      vendor: 'pi',
      transport: 'cli',
      protocol_version: '0.74.x',
      prompt_doc_uri: 'tnf://agents/pi-coding-agent.md',
      tools: ['fs', 'shell'],
      raw: { cli_command: 'pi', config_root: '~/.pi/agent/' },
    },
    qualities: {
      observability: 'native',
      subAgent_capable: false,
      orchestrates_agents: false,
      persona_source: 'platform',
      autonomy_level: 'semiautonomous',
    },
  },
  {
    name: 'claude-code',
    type: 'API_CLAUDE_CODE',
    role: 'code_generation',
    description: 'Anthropic claude-code CLI coding agent (ACP-compatible).',
    capabilities: ['code_generation', 'file_edit', 'terminal', 'web_research'],
    provider: 'anthropic',
    fulfillment: {
      vendor: 'anthropic',
      model: 'claude-sonnet-4',
      transport: 'cli',
      prompt_doc_uri: 'tnf://agents/claude-code.md',
      tools: ['fs', 'shell', 'browser'],
      raw: { cli_command: 'claude' },
    },
    qualities: {
      observability: 'native',
      subAgent_capable: false,
      orchestrates_agents: false,
      persona_source: 'platform',
      autonomy_level: 'semiautonomous',
    },
  },
  {
    name: 'tnf-hermes',
    type: 'TNF_CORE',
    role: 'orchestrator',
    description:
      'TNF entry point into Hermes Agent. Stays inside the TNF context + orchestration harness.',
    capabilities: [
      'tnf_protocol_routing',
      'tier_fallback',
      'browser_automation',
      'session_search',
      'skill_loading',
    ],
    provider: 'tnf-hermes',
    fulfillment: {
      vendor: 'hermes',
      transport: 'websocket',
      endpoint: 'ws://127.0.0.1:7788',
      protocol_version: 'hermes/v1',
      prompt_doc_uri: 'tnf://agents/tnf-hermes.md',
      tools: [
        'terminal',
        'browser',
        'vision',
        'skills',
        'delegate_task',
        'cronjob',
        'session_search',
      ],
      raw: {
        tnf_role: 'entry_point_to_hermes',
        containment_boundary: 'inside_tnf_harness',
      },
    },
    qualities: {
      observability: 'native',
      subAgent_capable: true,
      orchestrates_agents: true,
      persona_source: 'tnf',
      autonomy_level: 'semiautonomous',
      description: 'TNF owns its identity; hermes sits inside it.',
    },
  },
  {
    name: 'jules',
    type: 'GITHUB_JULES',
    role: 'cli_qa',
    description: 'Google Jules CLI coding agent. Persona is fixed; no persona customization.',
    capabilities: ['code_generation', 'terminal'],
    provider: 'google',
    fulfillment: {
      vendor: 'google',
      model: 'jules-1',
      transport: 'cli',
      prompt_doc_uri: 'tnf://agents/jules.md',
      tools: ['fs', 'shell'],
      raw: {
        cli_command: 'jules',
        persona_customization: false,
      },
    },
    qualities: {
      observability: 'opaque',
      subAgent_capable: false,
      orchestrates_agents: false,
      persona_source: 'fixed',
      autonomy_level: 'supervised',
      description: 'Persona is fixed; only fulfillment metadata is tracked by TNF.',
    },
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('seed-agent-registry: DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const selectSys = await client.query(
    "SELECT id FROM users WHERE email = 'system@thenewfuse.local' LIMIT 1"
  );
  if (selectSys.rowCount === 0) {
    console.error(
      'seed-agent-registry: SYSTEM user not found. Run 0007_seed_role_fulfillment_agents.sql first.'
    );
    process.exit(1);
  }
  const systemUserId = selectSys.rows[0].id;

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  // Phase 9: derive the canonicalEntityId and idNumber for each seed row.
  // canonicalEntityId format: `TNF:CATEGORY:PROVIDER:NAME:INSTANCE`.
  // idNumber format: `ID#:<Base58>` (deterministic from agent name; production
  // IDs flow through FederatedIdentityService which is sequential).
  //
  // Phase 9 FOLLOWUP-1: vector_ids produced by `generate_merkle_tree.py`
  // ALSO use the `ID#:` prefix but encode hash bytes (BLAKE-derived),
  // so we add a `federation.kind: 'agent'` discriminator so consumers
  // can tell which namespace an `ID#:` belongs to without inspecting the
  // underlying encoder.
  for (const seed of SEED) {
    const canonical = buildCanonicalEntityIdLocal({
      category: 'AGENT',
      provider: seed.provider,
      name: seed.name,
      instance: 1,
    });
    const idNumber = `ID#:${encodeBase58(deterministicSeedNumber(seed.name))}`;
    const federation = {
      kind: 'agent',
      canonicalEntityId: canonical,
      idNumber,
      mcid: null,
      scopes: seed.qualities.orchestrates_agents ? ['dacc-orchestrator'] : ['dacc-worker'],
      vector_id_prefix: 'ID#', // documents the cross-namespace caveat
    };
    const result = await client.query(
      `INSERT INTO "agents"
        (name, type, role, status, description, provider, user_id,
         capabilities, fulfillment, qualities,
         canonical_entity_id, id_number, federation)
       VALUES ($1, $2, $3, 'INACTIVE', $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb,
               $10, $11, $12::jsonb)
       ON CONFLICT ("user_id", "name") DO UPDATE SET
         role = EXCLUDED.role,
         description = EXCLUDED.description,
         provider = EXCLUDED.provider,
         capabilities = EXCLUDED.capabilities,
         fulfillment = EXCLUDED.fulfillment,
         qualities = EXCLUDED.qualities,
         canonical_entity_id = EXCLUDED.canonical_entity_id,
         id_number = COALESCE(EXCLUDED.id_number, "agents".id_number),
         federation = EXCLUDED.federation,
         fulfillment_updated_at = now(),
         updated_at = now()
       RETURNING (xmax = 0) AS inserted`,
      [
        seed.name,
        seed.type,
        seed.role,
        seed.description,
        seed.provider,
        systemUserId,
        JSON.stringify(seed.capabilities),
        JSON.stringify(seed.fulfillment),
        JSON.stringify(seed.qualities),
        canonical,
        idNumber,
        JSON.stringify(federation),
      ]
    );
    const isInsert = result.rows[0]?.inserted === true;
    if (isInsert) inserted += 1;
    else updated += 1;
  }

  await client.end();
  console.log(`seed-agent-registry: inserted=${inserted} updated=${updated} skipped=${skipped}`);
}

main().catch((err) => {
  console.error('seed-agent-registry: failed', err);
  process.exit(1);
});
