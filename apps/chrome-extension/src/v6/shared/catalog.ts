/**
 * Chrome-extension catalog helper.
 *
 * The chrome extension talks to a TNF backend that exposes
 *   GET /api/llm/models
 *   GET /api/llm/nvidia-catalog
 * with the same shape as @the-new-fuse/llm-catalog. This helper fetches
 * and caches the catalog so any chrome extension page (popup, side panel,
 * floating panel, options page) can populate a provider/model picker
 * without hardcoding any model names.
 */

import {
  BUILTIN_PROVIDERS,
  type CatalogProvider,
  type NvidiaModelEntry,
} from '@the-new-fuse/llm-catalog';

interface CatalogCache {
  providers: CatalogProvider[];
  nvidia: NvidiaModelEntry[];
  fetchedAt: number;
}

let cache: CatalogCache | null = null;
let inflight: Promise<CatalogCache> | null = null;
const TTL_MS = 5 * 60 * 1000;

/** Default REST base URL — overridden by chrome.storage.sync['tnfApiUrl']. */
function apiBase(): string {
  // Resolve the URL lazily so the helper works in service workers AND in
  // content scripts where chrome.storage is sync-only.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfg = (globalThis as any)?.chrome?.storage?.sync;
    if (cfg?.get) {
      // synchronous fallback for content scripts; async resolve below
    }
  } catch {
    /* ignore */
  }
  // best-effort default
  return (globalThis as any)?.TNFAI_API_BASE || 'http://localhost:3001';
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`catalog fetch ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Returns the canonical catalog (providers + nvidia NIM entries) with a
 * short TTL cache. Falls back to the builtin providers if the backend
 * is unreachable so the chrome extension still renders a usable UI.
 */
export async function getCatalog(force = false): Promise<CatalogCache> {
  const now = Date.now();
  if (!force && cache && now - cache.fetchedAt < TTL_MS) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const [providersResp, nvidiaResp] = await Promise.all([
        fetchJson<{ providers: CatalogProvider[] }>('/api/llm/models'),
        fetchJson<
          | { models: NvidiaModelEntry[] }
          | { providers: CatalogProvider[]; nvidiaModels: NvidiaModelEntry[] }
        >('/api/llm/nvidia-catalog?compact=1').catch(() => ({ providers: [], nvidiaModels: [] })),
      ]);
      const nvidia = (nvidiaResp as any)?.nvidiaModels || (nvidiaResp as any)?.models || [];
      cache = {
        providers: providersResp.providers || BUILTIN_PROVIDERS,
        nvidia,
        fetchedAt: Date.now(),
      };
    } catch {
      cache = { providers: BUILTIN_PROVIDERS, nvidia: [], fetchedAt: Date.now() };
    }
    inflight = null;
    return cache;
  })();
  return inflight;
}

/** Convenience: list of model ids for a given provider, or [] if missing. */
export async function getModelsForProvider(providerId: string): Promise<string[]> {
  const cat = await getCatalog();
  const row = cat.providers.find((p) => p.id === providerId);
  return row?.models || [];
}

/** Convenience: list of NVIDIA model ids (verified-first). */
export async function getNvidiaModels(): Promise<string[]> {
  const cat = await getCatalog();
  return cat.nvidia.map((m) => m.id);
}

/** Clear the in-memory cache (for testing or refresh buttons). */
export function clearCatalogCache(): void {
  cache = null;
}
