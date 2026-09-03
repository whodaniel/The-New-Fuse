import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Available LLM catalog for agent creation / operator UIs.
 * Source of truth: data/providers/catalog.json (provider list + per-provider
 * models) + data/providers/nvidia-models.json (full NVIDIA NIM catalog
 * with categories and live-status metadata).
 *
 * Public read endpoint — no JWT — so local desktop can populate Create Agent
 * without an auth session.
 *
 * The hardcoded VERIFIED_MODELS / PROVIDER_META constants that used to live
 * here were the third copy of "which providers exist" — they drifted from
 * packages/tnf-cli llm-provider-detector.ts and from the catalog file. They
 * have been removed; this controller now reads the same bytes the CLI does.
 */

interface CatalogProvider {
  id: string;
  name?: string;
  envKey?: string | null;
  baseUrl?: string;
  tier?: number;
  enabled?: boolean;
  defaultModel?: string;
  models?: string[];
  /** Restricts who may be served this provider. See isEntitled(). */
  entitlement?: string;
  entitlementNote?: string;
}

interface NvModelEntry {
  id: string;
  vendor?: string;
  category?: string;
  liveStatus?: string;
  description?: string;
}

function resolveCatalogPath(): string | null {
  const override = process.env.TNF_PROVIDER_CATALOG_PATH;
  const candidates: string[] = [];
  if (override && override.trim()) candidates.push(override.trim());
  // apps/api/src/controllers -> repo root
  candidates.push(path.resolve(process.cwd(), 'data/providers/catalog.json'));
  candidates.push(path.resolve(__dirname, '../../../../data/providers/catalog.json'));
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function resolveNvidiaRegistryPath(): string | null {
  const override = process.env.TNF_NVIDIA_MODELS_PATH;
  const candidates: string[] = [];
  if (override && override.trim()) candidates.push(override.trim());
  candidates.push(path.resolve(process.cwd(), 'data/providers/nvidia-models.json'));
  candidates.push(path.resolve(__dirname, '../../../../data/providers/nvidia-models.json'));
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

interface CatalogSnapshot {
  providers: CatalogProvider[];
  warnings: string[];
}

let cachedCatalog: CatalogSnapshot | null = null;

/**
 * Entitlement filter.
 *
 * Some providers are usable only by the TNF operator personally, not by TNF's
 * users. NVIDIA is the live case: those endpoints come from the operator's
 * NVIDIA Developer Program membership. Serving them to anyone else would be
 * using one person's personal developer credentials to run other people's
 * inference.
 *
 * This endpoint is documented above as public/no-JWT, so there is no session to
 * resolve a role from. The filter is therefore not session-role-based. Two
 * things can grant an operator-only provider, both failing closed:
 *
 *   1. Operator login custody — ~/.tnf/authority/operator-profile.json (mode
 *      0600, owned by the caller) listing the capability. That directory already
 *      holds roles.json and the Ed25519 keys; custody of it IS the operator
 *      login. Refused in agent context so an agent cannot inherit it.
 *   2. An explicit deployment override, TNF_OPERATOR_CATALOG=1, for a dev
 *      instance started deliberately.
 *
 * A deployed multi-user service has neither, so it withholds without being
 * configured to. Getting this backwards leaks a personal entitlement to every
 * caller, so the default must be the safe one.
 */
function isEntitled(p: CatalogProvider): boolean {
  if (!p.entitlement) return true;
  if (p.entitlement === 'operator-dev-only') {
    // Explicit deployment override, for a dev instance started deliberately.
    if ((process.env.TNF_OPERATOR_CATALOG || '').trim() === '1') return true;
    // Otherwise resolve from operator custody: ~/.tnf/authority/operator-profile.json,
    // mode 0600, owned by the caller. That directory IS the operator login — the
    // same custody that holds roles.json and the Ed25519 keys. A deployed
    // multi-user service has no such directory and therefore withholds, which is
    // the behaviour we want without configuring anything there.
    return hasOperatorEntitlement('operator-catalog');
  }
  // Unknown entitlement values are withheld rather than assumed harmless.
  return false;
}

/**
 * Ask the operator profile whether this machine's operator granted a capability.
 *
 * Deliberately defensive: the profile lives outside the app tree, so any
 * resolution or read failure must mean "not entitled" rather than an exception
 * escaping into a request path. Refuses in agent context inside the library.
 */
function hasOperatorEntitlement(entitlement: string): boolean {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'scripts/lib/tnf-operator-profile.cjs'),
      path.resolve(__dirname, '../../../../scripts/lib/tnf-operator-profile.cjs'),
    ];
    for (const c of candidates) {
      if (!fs.existsSync(c)) continue;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const lib = require(c);
      return Boolean(lib.has?.(entitlement));
    }
  } catch {
    /* fail closed */
  }
  return false;
}

function loadCatalog(): CatalogSnapshot {
  if (cachedCatalog) return cachedCatalog;
  const catalogPath = resolveCatalogPath();
  if (!catalogPath) {
    cachedCatalog = { providers: [], warnings: ['catalog.json not found'] };
    return cachedCatalog;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const rows = Array.isArray(raw?.providers) ? raw.providers : [];
    cachedCatalog = {
      providers: rows.filter(
        (r: CatalogProvider) => r && r.id && r.enabled !== false && isEntitled(r)
      ),
      warnings: [],
    };
  } catch (err) {
    cachedCatalog = {
      providers: [],
      warnings: [`${catalogPath} unreadable: ${(err as Error).message}`],
    };
  }
  return cachedCatalog;
}

let cachedNvidiaRegistry: { models: NvModelEntry[]; warning?: string } | null = null;

function loadNvidiaRegistry(): { models: NvModelEntry[]; warning?: string } {
  if (cachedNvidiaRegistry) return cachedNvidiaRegistry;
  const regPath = resolveNvidiaRegistryPath();
  if (!regPath) {
    cachedNvidiaRegistry = { models: [], warning: 'nvidia-models.json not found' };
    return cachedNvidiaRegistry;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(regPath, 'utf8'));
    cachedNvidiaRegistry = {
      models: Array.isArray(raw?.models) ? raw.models : [],
      warning: undefined,
    };
  } catch (err) {
    cachedNvidiaRegistry = {
      models: [],
      warning: `${regPath} unreadable: ${(err as Error).message}`,
    };
  }
  return cachedNvidiaRegistry;
}

/** Clear in-memory caches (used by tests). */
export function clearAvailableModelsCache(): void {
  cachedCatalog = null;
  cachedNvidiaRegistry = null;
}

async function fetchLiveModels(
  providerId: string,
  baseUrl: string,
  apiKey: string
): Promise<string[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeout);
    if (!response?.ok) return null;
    const data = (await response.json()) as { data?: Array<{ id?: string }> };
    if (!Array.isArray(data?.data)) return null;
    const ids = data.data.map((m) => m.id).filter((id): id is string => Boolean(id));
    return ids.length ? ids : null;
  } catch {
    return null;
  }
}

interface ProviderModel {
  id: string;
  name: string;
  provider: string;
  category?: string;
  liveStatus?: string;
}

interface ProviderEntry {
  id: string;
  name: string;
  priority: number;
  configured: boolean;
  source: 'verified' | 'live' | 'catalog';
  envKey?: string | null;
  baseUrl?: string;
  modelCount: number;
  models: ProviderModel[];
}

@ApiTags('llm')
@Controller('llm')
export class AvailableModelsController {
  @Get('models')
  @ApiOperation({ summary: 'List available LLM models (verified + live when keyed)' })
  @ApiResponse({ status: 200, description: 'Provider/model catalog' })
  async listModels(@Query('provider') provider?: string, @Query('refresh') refresh?: string) {
    const wantRefresh = refresh === '1' || refresh === 'true';
    const cat = loadCatalog();
    const nvidiaReg = loadNvidiaRegistry();
    // Build a lookup from nvidia-models.json so each catalog entry can be
    // annotated with its category and live-status.
    const nvMeta = new Map<string, NvModelEntry>();
    for (const m of nvidiaReg.models) nvMeta.set(m.id, m);

    const wantProvider = provider ? [provider] : null;
    const rows = wantProvider ? cat.providers.filter((p) => p.id === provider) : cat.providers;

    const providers: ProviderEntry[] = [];
    for (const p of rows) {
      const apiKey = p.envKey ? process.env[p.envKey] : undefined;
      const configured = Boolean(apiKey && apiKey !== 'missing-key' && apiKey.length > 10);
      let models = Array.isArray(p.models) ? p.models : [];
      let source: 'verified' | 'live' | 'catalog' = 'catalog';
      if (configured && wantRefresh) {
        const live = await fetchLiveModels(p.id, p.baseUrl || '', apiKey!);
        if (live?.length) {
          const verifiedSet = new Set(models);
          const extras = live.filter((m) => !verifiedSet.has(m));
          models = [...models.filter((m) => live.includes(m) || verifiedSet.has(m)), ...extras];
          source = 'live';
        }
      }
      const priority = typeof p.tier === 'number' ? p.tier : 50;
      providers.push({
        id: p.id,
        name: p.name || p.id,
        priority,
        configured,
        source,
        envKey: p.envKey,
        baseUrl: p.baseUrl,
        modelCount: models.length,
        models: models.map((modelId) => {
          const meta = nvMeta.get(modelId);
          return {
            id: modelId,
            name: modelId,
            provider: p.id,
            category: meta?.category,
            liveStatus: meta?.liveStatus,
          };
        }),
      });
    }

    return {
      defaultProvider: providers.find((p) => p.configured)?.id || providers[0]?.id || 'nvidia',
      providers,
      warnings: cat.warnings.concat(nvidiaReg.warning ? [nvidiaReg.warning] : []),
    };
  }

  @Get('providers')
  @ApiOperation({ summary: 'List LLM providers with configuration status' })
  async listProviders() {
    const catalog = await this.listModels();
    return catalog.providers.map((p) => ({
      id: p.id,
      name: p.name,
      configured: p.configured,
      modelCount: p.modelCount,
      priority: p.priority,
    }));
  }

  /**
   * Full NVIDIA NIM catalog (chat + vision + embeddings + specialized NIM
   * microservices). Powers the provider/model picker in agent creation.
   */
  @Get('nvidia-catalog')
  @ApiOperation({ summary: 'Full free NVIDIA NIM catalog with categories & live status' })
  async nvidiaCatalog(@Query('category') category?: string) {
    // This endpoint reads nvidia-models.json directly and so does NOT pass
    // through loadCatalog()'s entitlement filter. Gate it explicitly, or the
    // operator's personal NVIDIA Developer Program catalog (202 models) is
    // served in full to every caller of a public, no-JWT route.
    if (!isEntitled({ id: 'nvidia', entitlement: 'operator-dev-only' })) {
      return {
        count: 0,
        models: [],
        categories: [],
        warning:
          'NVIDIA NIM catalog is operator-dev-only (NVIDIA Developer Program credentials are personal to the TNF operator) and is not served by this instance.',
      };
    }
    const reg = loadNvidiaRegistry();
    let models = reg.models;
    if (category) {
      models = models.filter((m) => m.category === category);
    }
    return {
      count: models.length,
      warning: reg.warning,
      categories: Array.from(new Set(reg.models.map((m) => m.category).filter(Boolean))),
      models,
    };
  }
}
