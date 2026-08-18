# Unified LLM Catalog

**Single source of truth for LLM provider/model lists across every TNF
surface.**

> Status: ACTIVE — August 2026 Package: `@the-new-fuse/llm-catalog`
> (`packages/llm-catalog/`)

---

## Why this exists

Before August 2026, every TNF edge surface (VSCode extension, Tauri Desktop, Web
control panel, Chrome extension, API gateway) maintained its own hardcoded list
of LLM providers and models. When NVIDIA NIM added new free endpoints, DeepSeek
published a new model, or Groq expanded, each surface had to be manually updated
— and they drifted. The unified catalog eliminates that drift:

1. One JSON file per concern (`catalog.json` for non-NVIDIA providers,
   `nvidia-models.json` for the NVIDIA NIM free fleet).
2. One TypeScript package that reads those files and exposes a typed API.
3. Every surface imports the same package, so a single JSON edit propagates
   everywhere on the next build.

## Canonical data files

| File                 | Location          | Contents                                                                                          |
| -------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `catalog.json`       | `data/providers/` | 12 non-NVIDIA providers with OpenAI-compatible base URLs, default models, env keys, tier rankings |
| `nvidia-models.json` | `data/providers/` | 202 NVIDIA NIM free models with metadata (category, callable status, context window, description) |

Either file can be edited by hand. There is no database dependency — the catalog
is file-backed so it works in dev, in Docker, and on Cloud Run without a
migration.

## Package API

```typescript
import {
  loadCatalog,
  getProviders,
  getProviderById,
  getModelsForProvider,
  getNvidiaModels,
  getNvidiaModelById,
  getNvidiaByCategory,
  clearCatalogCache,
  setCatalogPath,
  BUILTIN_PROVIDERS,
} from '@the-new-fuse/llm-catalog';
```

| Function                   | Returns                                | Notes                                                                                                                                                                |
| -------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadCatalog()`            | `Promise<{ providers, nvidiaModels }>` | Async; walks up from CWD to find `data/providers/`. Falls back to `BUILTIN_PROVIDERS` if files are missing. Memoized — call `clearCatalogCache()` to force a reload. |
| `getProviders()`           | `CatalogProvider[]`                    | Synchronous (after `loadCatalog` has resolved). All 12 non-NVIDIA providers.                                                                                         |
| `getProviderById(id)`      | `CatalogProvider \| null`              | e.g. `getProviderById('groq')`                                                                                                                                       |
| `getModelsForProvider(id)` | `string[]`                             | Model IDs for a given provider. Returns `BUILTIN_PROVIDERS` fallback if the provider has no `models[]` array in catalog.json.                                        |
| `getNvidiaModels()`        | `NvidiaModel[]`                        | All 202 NVIDIA NIM free models.                                                                                                                                      |
| `getNvidiaModelById(id)`   | `NvidiaModel \| null`                  | e.g. `getNvidiaModelById('nvidia/nemotron-470b-instruct')`                                                                                                           |
| `getNvidiaByCategory(cat)` | `NvidiaModel[]`                        | Filter by category: `reasoning`, `vision`, `code`, `embed`, `rerank`, `general`, `audio`, etc.                                                                       |

## API endpoints (apps/api)

The backend exposes three REST endpoints that read from the same canonical
files, so non-TypeScript consumers (curl, other services) get the same data:

| Endpoint                  | Method | Auth | Returns                                              |
| ------------------------- | ------ | ---- | ---------------------------------------------------- |
| `/api/llm/models`         | GET    | Yes  | All providers + their models                         |
| `/api/llm/providers`      | GET    | Yes  | Provider list only (no models)                       |
| `/api/llm/nvidia-catalog` | GET    | Yes  | NVIDIA models; optional `?category=reasoning` filter |

All endpoints return JSON. The controller lives at
`apps/api/src/controllers/available-models.controller.ts`
(`@Controller('llm')`).

Cloud: `https://app.thenewfuse.com/api/llm/models` (returns 401 without auth).

## Edge surfaces consuming the catalog

| Surface                     | Import path                                                       | What it does                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **VSCode extension**        | `apps/vscode-extension/src/core/models.ts`                        | `initProviderModels()` on activate; `/model` picker reads cached catalog                                                       |
| **VSCode extension types**  | `apps/vscode-extension/src/core/types.ts`                         | `LLMProviderType` union includes all 12 providers + nvidia, groq, sambanova, deepseek, xai, moonshot, google, ollama, llamacpp |
| **VSCode extension config** | `apps/vscode-extension/src/core/config.ts`                        | Default provider = `nvidia`, default model = `nvidia/nemotron-470b-instruct`                                                   |
| **Tauri Desktop**           | `apps/tauri-desktop/src/config/verifiedModels.ts`                 | Re-exports `VERIFIED_PROVIDER_CATALOG`, `defaultProviderId`, `modelsForProvider` from shared catalog                           |
| **Tauri Desktop Settings**  | `apps/tauri-desktop/src/pages/Settings.tsx`                       | Default/Fallback Provider `<select>` iterates `VERIFIED_PROVIDER_CATALOG`                                                      |
| **Web control panel**       | `apps/frontend/src/services/llm/providers.ts`                     | 14-provider registry aligned with catalog                                                                                      |
| **Web control panel**       | `apps/frontend/src/shared/features/settings/LLMConfigManager.tsx` | Model field is a `<Select>` populated from `loadCatalog()`                                                                     |
| **Web control panel**       | `apps/frontend/src/hooks/useModels.tsx`                           | Fetches `/api/llm/models` first, falls back to `/api/models`                                                                   |
| **API gateway**             | `apps/api-gateway/src/gateway/ide-gateway.controller.ts`          | `getConfig()` builds the `ai:` block from `loadCatalog()` — 12 OpenAI-compatible providers                                     |
| **Chrome extension**        | `apps/chrome-extension/src/v6/shared/catalog.ts`                  | Helper that fetches `/api/llm/models` + `/api/llm/nvidia-catalog` with 5-min TTL cache                                         |

## Adding a new provider

1. Edit `data/providers/catalog.json` — add a new entry to the `providers`
   array:

```json
{
  "id": "newprovider",
  "name": "New Provider",
  "envKey": "NEWPROVIDER_API_KEY",
  "baseUrl": "https://api.newprovider.com/v1",
  "tier": 2,
  "enabled": true,
  "defaultModel": "newprovider/large",
  "models": ["newprovider/large", "newprovider/small"],
  "openaiCompatible": true
}
```

2. Rebuild the surfaces that import `@the-new-fuse/llm-catalog` (or restart if
   running in dev mode — the `clearCatalogCache()` function forces a reload).

3. No code changes needed — the new provider appears in:
   - VSCode `/model` picker
   - Tauri Settings Default/Fallback Provider selects
   - Web control panel LLM Provider Configuration
   - API gateway `/v1/ide/config`
   - Chrome extension catalog helper

## Adding a new NVIDIA NIM model

1. Edit `data/providers/nvidia-models.json` — add a new entry to the `models`
   array:

```json
{
  "id": "nvidia/new-model-instruct",
  "name": "New Model Instruct",
  "category": "reasoning",
  "callable": true,
  "contextWindow": 131072,
  "description": "Description of the model"
}
```

2. Rebuild/restart. The model appears in every NVIDIA model picker.

## Deployment

The Dockerfile at `Dockerfile.api` (repo root) copies
`packages/llm-catalog/package.json` and builds it in the turbo chain before
building `apps/api`. The Cloud Build config at
`scripts/deployment/cloudbuild.yaml` builds and deploys to Google Cloud Run:

```bash
gcloud builds submit --config scripts/deployment/cloudbuild.yaml \
  --substitutions _IMAGE_TAG=<tag>
```

The API server is deployed at `https://api-server-ipjhxcemfa-uc.a.run.app` and
proxied through `app.thenewfuse.com/api/*`.

## Troubleshooting

**Catalog not loading on a surface**: Ensure the surface's
`node_modules/@the-new-fuse/llm-catalog` symlink exists and points to
`../../../../packages/llm-catalog` (not `../../packages/llm-catalog` — the depth
matters).

**`MODULE_NOT_FOUND` for `dist/index.cjs`**: The package.json declares
`"main": "dist/index.cjs"` but the TypeScript compiler only emits
`dist/index.js`. Run `pnpm --filter @the-new-fuse/llm-catalog run build` to
compile. If CJS is needed, add `"module": "commonjs"` to `tsconfig.json` or
create a separate CJS build.

**Cloud Build fails**: The cloudbuild.yaml uses `--file Dockerfile.api` with
build context `.` (repo root). Ensure `packages/llm-catalog/package.json` is
explicitly copied in the Dockerfile (it is, as of August 2026) and that
`@the-new-fuse/llm-catalog` is listed as a dependency in
`apps/api/package.json`.
