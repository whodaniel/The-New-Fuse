# TNF LLM Provider and Model Surface Audit — 2026-08-31

## Outcome

The strongest form factor is now the combination of:

1. `data/providers/catalog.json` — language-neutral provider authority;
2. `data/providers/nvidia-models.json` — the 202-entry NVIDIA registry;
3. `packages/tnf-cli/src/services/ModelsService.ts` — live, authenticated,
   paginated model discovery with explicit failure state and catalog fallback;
4. `tnf models --select` — searchable, arrow-navigable provider and model menus.

This combines the broadest active catalog with the most complete live refresh
path. A real public OpenRouter refresh on 2026-08-31 returned 425 live text
models. Provider API results, not a dated checked-in list, are authoritative
when a live probe succeeds.

## Inspected implementations

| Surface                                                             | Strength                                                             | Limitation/classification                                                                  |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `packages/llm-catalog` + `data/providers/*`                         | Canonical cross-surface provider data and full NVIDIA metadata       | File-backed; does not itself call provider APIs                                            |
| `packages/tnf-cli/src/services/ModelsService.ts`                    | Live provider model APIs, cache, status, costs/context normalization | Was limited to credentialed cloud providers and generic Bearer auth; upgraded in this work |
| `apps/frontend/src/data/llmProviders.ts`                            | Broad 23-type UX taxonomy including enterprise/custom lanes          | Descriptive/static examples, not runtime model-list authority                              |
| `apps/frontend/src/hooks/useGetProvidersModels.ts`                  | Fetches provider-specific models from the backend                    | Contains dated fallback arrays; backend availability determines freshness                  |
| `apps/frontend/src/shared/features/settings/LLMConfigManager.tsx`   | Uses `@the-new-fuse/llm-catalog` in a settings UI                    | Browser/package fallback can be narrower than the file registry                            |
| `apps/api/src/services/provider-catalog.service.ts`                 | Reconciles global configuration with per-user provider keys          | Selectable-provider authority, not comprehensive model discovery                           |
| `apps/api/src/controllers/available-models.controller.ts`           | REST exposure of the canonical catalog                               | Serves checked-in catalog state rather than provider-live state                            |
| `packages/core/src/services/LocalAIDetectionService.ts`             | Discovers Ollama, LM Studio, LocalAI, llama.cpp-style runtimes       | Local-only scope                                                                           |
| `archive/skill-consolidation-20260829/features/ai/llm/components/*` | Largest historical set of per-provider configuration forms           | Archived; not authority and includes dated model lists                                     |

## Directly discoverable provider coverage

The canonical active catalog now contains 22 providers:

- Local: Ollama, llama.cpp, LM Studio, LocalAI, Text Generation WebUI.
- Primary APIs: OpenAI, Anthropic, Google Gemini, xAI, DeepSeek, Mistral,
  Cohere, Perplexity.
- Hosted/open-model APIs and gateways: OpenRouter, NVIDIA NIM, Groq, Together
  AI, Fireworks AI, SambaNova, Qwen/DashScope, Novita AI, Moonshot.

OpenRouter is intentionally key-optional for model listing and provides the
widest always-refreshable menu. The service also resolves Google's alternate
`GEMINI_API_KEY`/`GOOGLE_AI_API_KEY` names and Qwen's alternate `QWEN_API_KEY`
name.

Enterprise/configuration-specific lanes in the frontend taxonomy are not
pretended to be universal endpoints:

- Azure OpenAI requires a resource-specific endpoint, deployment names, API
  version and Azure-style authentication.
- AWS Bedrock listing requires region/credential-aware AWS API signing.
- `generic-openai` requires an operator-supplied base URL.
- `native` is TNF internal routing, not an external provider catalog.

Those remain addable through `~/.config/tnf/providers.json` when an operator has
a concrete endpoint. They should receive dedicated adapters before being
promoted into the zero-configuration catalog.

## Discovery contracts implemented

- Bearer-authenticated `GET /models` and key-optional OpenRouter listing.
- Google query-key auth, `pageSize=1000`, and `nextPageToken` pagination.
- Anthropic `x-api-key` plus `anthropic-version`, `limit=1000`, and `after_id`
  pagination.
- Cohere `page_size=1000` and `next_page_token` pagination.
- Ollama native `GET /api/tags` response normalization.
- OpenAI-compatible, bare-array, `data[]`, `models[]`, and `model_list[]`
  response normalization.
- Live-first dedupe against durable catalog fallback models.
- Concurrent whole-catalog probing and single-provider interactive probing.

Official API references checked during this audit:

- [OpenAI models](https://platform.openai.com/docs/api-reference/models/list)
- [Claude list models](https://platform.claude.com/docs/en/api/models/list)
- [Gemini models.list](https://ai.google.dev/api/models)
- [Ollama list models](https://docs.ollama.com/api/tags)
- [OpenRouter models API](https://openrouter.ai/docs/api/api-reference/models/get-models)
- [Groq models](https://console.groq.com/docs/models)
- [Mistral model management API](https://docs.mistral.ai/api/endpoint/models)
- [Cohere list models](https://docs.cohere.com/reference/list-models)

## Verification receipts

- `pnpm --filter @the-new-fuse/tnf-cli type-check` — passed.
- Provider config tests — 20 passed.
- Provider catalog tests — 22 passed, including 22-provider coverage, local
  providers, and full NVIDIA-registry hydration.
- Interactive selector state-machine tests — 10 passed.
- Real `ModelsService.getProvider('openrouter')` — status `ok`, discovery
  `live`, 425 live models.
- Built `tnf models openrouter --refresh --json` — 425 rows, all marked live.
- Real PTY `tnf models --select` — Down Arrow moved from Ollama to llama.cpp;
  Escape cancelled without changing the default.
- Command-surface oracle and CI gate — passed with 512 command paths. The
  snapshot includes the intended `models`/`provider` changes plus
  `--no-telemetry` and `--require-verification`, two options already present in
  committed Tier-2 `tnf agents match` code whose snapshot update had been
  omitted.
- `preflight-skip.test.ts` — 4 passed. Its probe now uses the bounded read-only
  `tnf status` path and explicitly requests visible non-TTY preflight receipts;
  it no longer treats the heavyweight operational `tnf doctor` as a test fixture
  or allows a timeout to satisfy an output-absence assertion.
- `pnpm --filter @the-new-fuse/tnf-cli test` — passed end-to-end, including all
  downstream CLI tests that the previous doctor timeout prevented from running.
