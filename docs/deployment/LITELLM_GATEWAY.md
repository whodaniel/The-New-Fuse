# LiteLLM Gateway (server-side model serving)

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:DEPLOYMENT] [OWNER:TNF]`

## What this is for

TNF already serves its model catalog server-side. Verified live on `api-server`
(Cloud Run, `us-central1`), all auth-guarded (`401`, with a genuine `404` on an
unknown path, so these are real routes):

| Route                          | Serves                                                 |
| ------------------------------ | ------------------------------------------------------ |
| `GET /api/llm/models`          | all providers + models                                 |
| `GET /api/llm/providers`       | provider list                                          |
| `GET /api/llm/nvidia-catalog`  | 202 NVIDIA NIM models, `?category=` filterable         |
| `POST /api/ai/text-completion` | inference (provider auto-selected by first usable key) |

What it does **not** have is metering: no per-user spend tracking, no budgets,
no quotas, no rate limit on those routes. That is the gap LiteLLM fills, and it
is needed for **both** planned revenue models — BYOK quotas need it exactly as
much as any metered tier does.

## The legal constraint (read before designing billing)

Anthropic's commercial terms forbid customers reselling the Services "except as
expressly approved by Anthropic", and OpenAI carries comparable
resale/redistribution restrictions. So:

| Model                                              | Position                                                |
| -------------------------------------------------- | ------------------------------------------------------- |
| **BYOK** — user supplies their own key             | Clean. No resale occurs. Build first.                   |
| **Product where inference is an ingredient**       | Fine. This is what TNF already is.                      |
| **Passthrough + markup on TNF-held provider keys** | Prohibited absent express approval. Do not build as-is. |

You own model **outputs** (OpenAI's terms assign them to you); that is selling
results, not selling access. Routing aggregation through OpenRouter puts the
provider relationship with them rather than TNF — materially safer than becoming
reseller-of-record — but **whether OpenRouter permits downstream resale by TNF
is unconfirmed and must be answered in writing by their sales team before any
upcharge tier ships.**

## Config is generated, never hand-written

```bash
node scripts/llm/generate-litellm-config.cjs                  # cloud providers only
node scripts/llm/generate-litellm-config.cjs --only-configured # skip providers with no key
node scripts/llm/generate-litellm-config.cjs --nvidia-limit 40 # add N NIM models
node scripts/llm/generate-litellm-config.cjs --include-local   # localhost providers (dev only)
```

Source of truth stays `data/providers/catalog.json` + `nvidia-models.json`. A
hand-maintained `config.yaml` would recreate the per-surface drift the unified
catalog was built to eliminate — see `docs/UNIFIED_LLM_CATALOG.md`.

Local providers are **excluded by default**: Cloud Run cannot reach
`localhost:11434`, and shipping them server-side produces menu entries that fail
on call.

### Operator-only providers are withheld by default

Some providers are the **operator's personal entitlement, not TNF's to serve**.
NVIDIA is the live case: those endpoints come from the TNF operator's NVIDIA
Developer Program membership. Serving them to TNF's users would be running other
people's inference on one person's personal developer credentials.

`catalog.json` marks these with `"entitlement": "operator-dev-only"`. Three
places enforce it, all failing closed:

| Surface                                             | Behaviour                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadCatalog()` in `available-models.controller.ts` | entitled providers filtered out of `/api/llm/models` and `/api/llm/providers`                                                                        |
| `GET /api/llm/nvidia-catalog`                       | gated explicitly — it reads `nvidia-models.json` directly and does **not** pass through `loadCatalog()`, so without its own gate all 202 models leak |
| `generate-litellm-config.cjs`                       | withheld unless `--include-operator-only`                                                                                                            |

Server-side, they are served only when the process was started with
`TNF_OPERATOR_CATALOG=1` — a deployment switch, not a user role. That endpoint
is documented as public/no-JWT, so there is no session to resolve a role from;
making the gate role-based would have implied an auth context that isn't there.
Unknown `entitlement` values are withheld rather than assumed harmless.

**Do not set `TNF_OPERATOR_CATALOG=1` on any instance serving other users.** It
is for the operator's own dev instances, local or cloud.

### Known naming drift the generator works around

One Google credential has three spellings across TNF: `catalog.json` says
`GOOGLE_API_KEY`, `apps/api/src/controllers/ai.controller.ts` reads
`GEMINI_API_KEY || GOOGLE_AI_API_KEY`, and the live service has
`GEMINI_API_KEY`. The generator resolves to whichever alias is actually
populated (`ENV_KEY_ALIASES`). **This is a workaround, not a fix** — reconciling
the names at source touches every surface reading the shared catalog and is
deliberately left as a separate decision.

## Deploying

LiteLLM needs Postgres for virtual keys, budgets and spend tracking. **TNF
already has Postgres via Supabase** — no new database tier required; point
`DATABASE_URL` at it (ideally a dedicated schema).

Required environment:

| Var                  | Purpose                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Supabase Postgres. Without it the proxy routes but records nothing — useless for quotas. |
| `LITELLM_MASTER_KEY` | admin key; mints virtual keys. Never ship to a client.                                   |
| provider keys        | whichever of the 17 cloud providers you enable                                           |

Deploy alongside the existing services with the established path
(`scripts/deployment/gcp-deploy.sh` → `scripts/deployment/cloudbuild.yaml`), not
a new platform. Railway and its `cloud_runtime` alias are retired; Render and
Fly.io have never been TNF infrastructure.

## BYOK and metering

LiteLLM issues **virtual keys** with per-key/user/team budgets enforced in real
time plus spend tracking. That maps onto the product directly:

- one virtual key per TNF user, budget = their plan allowance
- BYOK users route through their own provider key; the virtual key still meters
  usage for quota and analytics without TNF holding their credential
- spend logs give per-request cost attribution, the prerequisite for any tier

## Sequence

1. Confirm the existing catalog returns live data — authenticated
   `GET /api/llm/models`.
2. Stand up LiteLLM with generated config + Supabase `DATABASE_URL`.
3. Ship BYOK with per-key budgets. Legally clean revenue.
4. Only then design the upcharge tier, gated on OpenRouter's written answer.

Do not invert 3 and 4.
