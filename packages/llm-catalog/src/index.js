/**
 * @the-new-fuse/llm-catalog
 *
 * Single source of truth for every free NVIDIA NIM endpoint + LLM provider
 * that TNF exposes across the entire stack.
 *
 *   data/providers/catalog.json       Provider list (envKey, baseUrl, tier)
 *   data/providers/nvidia-models.json 202 free NVIDIA endpoints with categories
 *
 * Every edge surface — VSCode extension, Tauri desktop, Chrome extension,
 * Web control panel, API gateway — imports from this module so the model
 * menu can never drift from the canonical registry.
 *
 * The module is defensive: if the JSON files can't be read (e.g. a packaged
 * VSCode .vsix without the data folder), it falls back to the embedded
 * BUILTIN_* constants, which mirror the same catalog. Consumers should
 * call loadCatalog() at boot and cache the result.
 */
// ─── model expiry guard (date-aware slot fall-through) ──────────────
// Vendor beta ids encode their own expiry (e.g. '-expires-on-0910'), so the
// catalog demotes them automatically instead of relying on a hand edit.
import { pickActiveModel, withActiveDefaultModel } from './model-expiry.js';
export * from './model-expiry.js';
async function tryImportNodeFs() {
    // Works in Node CommonJS and ESM (dynamic import). Bundlers (Vite/esbuild)
    // tree-shake this away in browser builds if configured correctly. The
    // 'node:fs' / 'node:path' import specifier is required to avoid bundlers
    // trying to resolve 'fs' in browser contexts.
    try {
        // Use indirect dynamic imports so this file compiles without @types/node
        // while the runtime still resolves the Node built-ins. The `b` prefix
        // prevents Vite/esbuild from special-casing the string literal.
        const fsSpec = 'node:f' + 's';
        const pathSpec = 'node:pa' + 'th';
        const mod = await import(fsSpec);
        const pathMod = await import(pathSpec);
        const fs = {
            readFileSync: (p, enc) => mod.readFileSync(p, enc),
            existsSync: (p) => mod.existsSync(p),
        };
        const path = {
            resolve: (...paths) => pathMod.resolve(...paths),
            dirname: (p) => pathMod.dirname(p),
            join: (...paths) => pathMod.join(...paths),
        };
        return { fs, path };
    }
    catch {
        return null;
    }
}
/**
 * Locate the repo root by walking up from a known file path or cwd. We
 * look for `data/providers/catalog.json` on disk to confirm.
 */
function resolveRepoRoot(nodePath, fs, hint) {
    const candidates = [];
    if (hint)
        candidates.push(hint);
    // Next, use caller cwd
    candidates.push(process?.cwd?.() || '');
    // Then look for __dirname equivalents via stack inspection (best-effort).
    try {
        const here = (typeof __dirname !== 'undefined' ? __dirname : undefined) || '';
        if (here) {
            candidates.push(here);
            candidates.push(nodePath.resolve(here, '../../../..'));
        }
    }
    catch {
        /* ignore */
    }
    for (let i = 0; i < 10; i++) {
        for (const c of [...candidates]) {
            if (!c)
                continue;
            const probe = nodePath.join(c, 'data/providers/catalog.json');
            if (fs.existsSync(probe))
                return c;
        }
        // Walk up each candidate by one level
        for (let j = 0; j < candidates.length; j++) {
            if (!candidates[j])
                continue;
            const parent = nodePath.dirname(candidates[j]);
            if (parent && parent !== candidates[j])
                candidates[j] = parent;
            else
                candidates[j] = '';
        }
    }
    return null;
}
let envPathOverride = null;
/**
 * Pin the catalog directory. Useful for tests and for edge surfaces that
 * know the absolute path on the host (e.g. the Tauri desktop app at runtime
 * can resolve via its resource bundle).
 */
export function setCatalogPath(p) {
    envPathOverride = p;
}
let inMemoryCache = null;
export function clearCatalogCache() {
    inMemoryCache = null;
}
// ─── builtin fallback ────────────────────────────────────────────────────
/**
 * Built-in fallback used only when the JSON files can't be located. Kept
 * intentionally compact — the canonical lists live in the JSON files. These
 * values mirror catalog.json + nvidia-models.json at the time of writing
 * (2026-08-14) and are overwritten by the live JSON when found.
 */
/**
 * DeepSeek slot preference, in order. Slot 1 is the V4.1 Flash internal beta,
 * whose id encodes its own expiry; the date-aware guard demotes it once that
 * UTC day ends, falling through to the stable 'deepseek-v4-flash' alias.
 * NOTE: the vendor rejects 'deepseek-v4.1-flash' (400) - do not use it.
 */
const DEEPSEEK_MODELS = [
    'deepseek-v4.1-flash-expires-on-0910',
    'deepseek-v4-flash',
    'deepseek-v4-pro',
    'deepseek-v4-flash-vision-exp',
];
export const BUILTIN_PROVIDERS = [
    {
        id: 'ollama',
        name: 'Local Ollama',
        envKey: null,
        baseUrl: 'http://localhost:11434/v1',
        tier: 1,
        enabled: true,
        defaultModel: 'qwen2.5-coder:7b',
        openaiCompatible: true,
    },
    {
        id: 'llamacpp',
        name: 'Local llama.cpp',
        envKey: null,
        baseUrl: 'http://127.0.0.1:8081/v1',
        tier: 2,
        enabled: true,
        defaultModel: 'qwen2.5-coder-3b-instruct',
        openaiCompatible: true,
    },
    {
        id: 'google',
        name: 'Google AI',
        envKey: 'GOOGLE_API_KEY',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        tier: 10,
        enabled: true,
        defaultModel: 'gemini-pro',
        openaiCompatible: false,
    },
    {
        id: 'groq',
        name: 'Groq',
        envKey: 'GROQ_API_KEY',
        baseUrl: 'https://api.groq.com/openai/v1',
        tier: 20,
        enabled: true,
        defaultModel: 'llama3-8b-8192',
        openaiCompatible: true,
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'meta-llama/llama-3.1-8b-instruct'],
    },
    {
        id: 'nvidia',
        name: 'NVIDIA NIM',
        envKey: 'NVIDIA_API_KEY',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        tier: 30,
        enabled: true,
        defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b',
        openaiCompatible: true,
        modelRegistry: './nvidia-models.json',
        models: [
            // Verified-first — see data/providers/nvidia-models.json for the full 200+
            'nvidia/nemotron-3-ultra-550b-a55b',
            'nvidia/nemotron-3-super-120b-a12b',
            'nvidia/nemotron-3.5-lightning-30b-a3b',
            'nvidia/nemotron-mini-4b-instruct',
            'minimaxai/minimax-m3',
            'openai/gpt-oss-20b',
            'thinkingmachines/inkling',
            'deepseek-ai/deepseek-v4-flash-0731',
            'meta/llama-3.1-70b-instruct',
            'meta/llama-3.1-8b-instruct',
            'meta/muse-glimmer-30b',
            'mistralai/mistral-nemotron',
            'stepfun-ai/step-3.7-flash',
            'nvidia/llama-3.3-nemotron-super-49b-v1',
            'nvidia/llama-3.3-nemotron-super-49b-v1.5',
            'nvidia/nemotron-3-nano-30b-a3b',
            'nvidia/nvidia-nemotron-nano-9b-v2',
            'z-ai/glm-5.2',
            'poolside/laguna-xs-2.1',
            'meta/llama-3.3-70b-instruct',
            'meta/llama-guard-4-12b',
            'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',
            'nvidia/nemotron-nano-12b-v2-vl',
        ],
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        envKey: 'DEEPSEEK_API_KEY',
        baseUrl: 'https://api.deepseek.com/v1',
        tier: 4,
        enabled: true,
        defaultModel: pickActiveModel(DEEPSEEK_MODELS) ?? DEEPSEEK_MODELS[0],
        openaiCompatible: true,
        models: [...DEEPSEEK_MODELS],
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        envKey: 'OPENROUTER_API_KEY',
        baseUrl: 'https://openrouter.ai/api/v1',
        tier: 50,
        enabled: true,
        defaultModel: 'openrouter/auto',
        openaiCompatible: true,
        models: [
            'meta-llama/llama-3.3-70b-instruct',
            'deepseek/deepseek-chat-v3-0324',
            'google/gemma-2-9b-it:free',
        ],
    },
    {
        id: 'xai',
        name: 'SpaceXAI (xAI)',
        envKey: 'XAI_API_KEY',
        baseUrl: 'https://api.x.ai/v1',
        tier: 55,
        enabled: true,
        defaultModel: 'grok-4.6',
        openaiCompatible: true,
    },
    {
        id: 'sambanova',
        name: 'SambaNova',
        envKey: 'SAMBANOVA_API_KEY',
        baseUrl: 'https://api.sambanova.ai/v1',
        tier: 55,
        enabled: true,
        defaultModel: 'Meta-Llama-3.1-8B-Instruct',
        openaiCompatible: true,
        models: ['Meta-Llama-3.1-405B-Instruct', 'DeepSeek-R1-Distill-Llama-70B'],
    },
    {
        id: 'moonshot',
        name: 'Moonshot',
        envKey: 'MOONSHOT_API_KEY',
        baseUrl: 'https://api.moonshot.cn/v1',
        tier: 58,
        enabled: true,
        defaultModel: 'moonshot-v1-8k',
        openaiCompatible: true,
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        envKey: 'ANTHROPIC_API_KEY',
        baseUrl: 'https://api.anthropic.com/v1',
        tier: 60,
        enabled: true,
        defaultModel: 'claude-3-haiku-20240307',
        openaiCompatible: false,
        models: [
            'claude-opus-4.5-20251124',
            'claude-sonnet-4.5-20251124',
            'claude-3-5-sonnet-20241022',
            'claude-3-haiku-20240307',
        ],
    },
    {
        id: 'openai',
        name: 'OpenAI',
        envKey: 'OPENAI_API_KEY',
        baseUrl: 'https://api.openai.com/v1',
        tier: 70,
        enabled: true,
        defaultModel: 'gpt-4o-mini',
        openaiCompatible: true,
        models: ['gpt-5.2', 'gpt-5.1-codex-max', 'gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini'],
    },
];
export const BUILTIN_NVIDIA_MODELS = [];
// ─── main loader ─────────────────────────────────────────────────────────
/**
 * Resolve the canonical catalog. Returns immediately when running in a Node
 * context with the JSON files on disk; falls back to BUILTIN_* constants
 * otherwise (browser builds, packaged runtimes without the data folder).
 *
 * Cached after the first call — clear with clearCatalogCache().
 */
export async function loadCatalog() {
    if (inMemoryCache)
        return inMemoryCache;
    const warnings = [];
    let providers = BUILTIN_PROVIDERS;
    let nvidiaModels = BUILTIN_NVIDIA_MODELS;
    const envBase = envPathOverride || process?.env?.TNF_PROVIDER_CATALOG_DIR || process?.env?.TNF_CATALOG_DIR;
    const node = await tryImportNodeFs();
    if (node?.fs && node.path) {
        const root = resolveRepoRoot(node.path, node.fs, envBase || undefined);
        if (root) {
            const catPath = node.path.join(root, 'data/providers/catalog.json');
            const nvPath = node.path.join(root, 'data/providers/nvidia-models.json');
            try {
                if (node.fs.existsSync(catPath)) {
                    const raw = JSON.parse(node.fs.readFileSync(catPath, 'utf8'));
                    if (Array.isArray(raw?.providers) && raw.providers.length > 0) {
                        providers = raw.providers.filter((p) => p && p.id && p.enabled !== false);
                    }
                }
                else {
                    warnings.push(`catalog.json not found at ${catPath}`);
                }
            }
            catch (err) {
                warnings.push(`catalog.json unreadable: ${err.message}`);
            }
            try {
                if (node.fs.existsSync(nvPath)) {
                    const raw = JSON.parse(node.fs.readFileSync(nvPath, 'utf8'));
                    if (Array.isArray(raw.models))
                        nvidiaModels = raw.models;
                }
                else {
                    warnings.push(`nvidia-models.json not found at ${nvPath}`);
                }
            }
            catch (err) {
                warnings.push(`nvidia-models.json unreadable: ${err.message}`);
            }
        }
        else {
            warnings.push('repo root not resolvable — using builtin fallback');
        }
    }
    else {
        warnings.push('node:fs unavailable — using builtin fallback');
    }
    // Date-aware guard applied at read time, so catalog.json can keep declaring
    // the vendor's literal beta id while the runtime never selects an expired one.
    providers = providers.map((p) => withActiveDefaultModel(p));
    inMemoryCache = { providers, nvidiaModels, warnings };
    return inMemoryCache;
}
/**
 * Convenience: return only the providers (no NVIDIA NIM metadata).
 */
export async function getProviders() {
    return (await loadCatalog()).providers;
}
/**
 * Convenience: list of NVIDIA model ids (verified-first). Useful for
 * populating a `<select>` without pulling the full metadata.
 */
export async function getNvidiaModels() {
    return (await loadCatalog()).nvidiaModels.map((m) => m.id);
}
/**
 * Provider metadata by id (or null if missing).
 */
export async function getProviderById(id) {
    return (await loadCatalog()).providers.find((p) => p.id === id) || null;
}
/**
 * Models for a given provider id. Looks up the catalog entry and returns
 * its `models[]` array (deduplicated against the builtin fallback so the
 * caller still gets a usable list if the catalog row is stale).
 */
export async function getModelsForProvider(providerId) {
    const catalog = await loadCatalog();
    const row = catalog.providers.find((p) => p.id === providerId);
    const out = [];
    const seen = new Set();
    for (const m of row?.models || []) {
        if (!seen.has(m)) {
            seen.add(m);
            out.push(m);
        }
    }
    // Merge in builtin models the row didn't list (so the CLI keeps working
    // if the catalog is older than the builtin list).
    const builtin = BUILTIN_PROVIDERS.find((p) => p.id === providerId)?.models || [];
    for (const m of builtin) {
        if (!seen.has(m)) {
            seen.add(m);
            out.push(m);
        }
    }
    return out;
}
/**
 * NVIDIA model metadata by id (or null if missing).
 */
export async function getNvidiaModelById(id) {
    return (await loadCatalog()).nvidiaModels.find((m) => m.id === id) || null;
}
/**
 * Category breakdown of the NVIDIA registry — handy for UI pickers.
 * Returns [{ category, count, models: [{id, liveStatus}] }].
 */
export async function getNvidiaByCategory() {
    const all = (await loadCatalog()).nvidiaModels;
    const grouped = new Map();
    for (const m of all) {
        const k = m.category || 'unknown';
        if (!grouped.has(k))
            grouped.set(k, []);
        grouped.get(k).push(m);
    }
    return [...grouped.entries()]
        .map(([category, models]) => ({ category, count: models.length, models }))
        .sort((a, b) => b.count - a.count);
}
//# sourceMappingURL=index.js.map