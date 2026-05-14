# Audio Trigger KWS + LLM MVP Plan

This app folder stores the implementation plan for a trigger-first audio
intelligence pipeline that avoids expensive LLM calls until high-confidence
word/phrase patterns are detected.

## Readiness

This app is now **pilot-ready** for real use with live mini-omni integration.

- Real HTTP API service is available (`src/server.ts`).
- Trigger pipeline runs continuously in-memory.
- mini-omni native `/chat` integration is active.
- Recent rule/package/LLM results are queryable via API.
- Auto-prompt orchestration now supports keyword/rule and visual-object triggers.
- Self-assessment + self-adjustment loops write context cards to wiki-friendly logs.

It is not yet fully production hardened (HA, durable queues, persistent DB,
auth).

## Goal

Build a low-latency pipeline that:

1. Listens continuously to audio streams.
2. Detects target terms/phrases and grouped concepts.
3. Fires rule-based triggers only when conditions are met.
4. Asynchronously enriches events in vector DB + knowledge graph.
5. Batches contextual packages for LLM reasoning.

## Why This Pattern

- LLM calls happen only on meaningful triggers.
- Lower cost than full transcription + always-on prompting.
- Better control using explicit combo rules and confidence thresholds.
- Provenance-first context packages improve LLM reliability.

## System Architecture

1. `audio-gateway`

- Ingest PCM audio (16kHz mono).
- Maintain rolling buffer (15-30s).
- Publish 20ms frames.

2. `vad-gate`

- Speech/non-speech filtering.
- Drops silence/background early.

3. `kws-engine`

- Streaming phoneme/subword posteriors.
- Large lexicon matcher (WFST or weighted trie).
- Lexicon artifact precompiled from master vocabulary.

4. `grouping-filter`

- Maps term hits to canonical groups.
- Supports synonyms and phrase variants.

5. `rule-engine`

- Evaluates boolean/combo/sequence trigger DSL.
- Applies windowing, confidence gates, cooldown.

6. `enricher`

- Normalizes entities/facts.
- Writes to vector DB + knowledge graph.
- Builds provenance-rich context packages.

7. `llm-batcher`

- Dedupes and micro-batches packages.
- Renders prompt template and calls LLM.

## Data Flow

`Audio -> VAD -> KWS Hit Events -> Grouped Events -> Rule Match -> Context Package -> Batch -> LLM`

## Current Scaffold

The folder now includes a runnable TypeScript scaffold:

- `src/services/audio-gateway.ts`
- `src/services/vad-gate.ts`
- `src/services/kws-engine.ts`
- `src/services/grouping-filter.ts`
- `src/services/rule-engine.ts`
- `src/services/enricher.ts`
- `src/services/llm-batcher.ts`
- `src/services/llm-backends/mini-omni-client.ts`

## mini-omni Backend

The default backend mode is native mini-omni voice endpoint:

1. Copy `.env.example` values into your environment.
2. Start mini-omni server:
   `cd /Users/<owner>/mini-omni && python3 server.py --ip 0.0.0.0 --port 60808 --device cpu`
3. Run `pnpm --filter @the-new-fuse/audio-trigger-kws-mvp demo`.

To run as an API service instead of demo mode:

1. Start mini-omni server.
2. Run `pnpm --filter @the-new-fuse/audio-trigger-kws-mvp serve`.
3. Call `POST /v1/ingest/text` with `streamId` and `utterance`.

Backend modes:

- `MINI_OMNI_MODE=native_chat` (default): calls mini-omni `/chat` and stores
  returned WAV output.
- `MINI_OMNI_MODE=openai_compat`: calls OpenAI-style `/v1/chat/completions`.

Config keys:

- `MINI_OMNI_ENABLED`
- `MINI_OMNI_MODE`
- `MINI_OMNI_API_URL`
- `MINI_OMNI_BASE_URL`
- `MINI_OMNI_CHAT_PATH`
- `MINI_OMNI_COMPLETIONS_PATH`
- `MINI_OMNI_MODEL`
- `MINI_OMNI_TIMEOUT_MS`
- `MINI_OMNI_STREAM_STRIDE`
- `MINI_OMNI_MAX_TOKENS`
- `MINI_OMNI_SAMPLE_WAV`
- `MINI_OMNI_OUTPUT_WAV_DIR`
- `APP_HOST`
- `APP_PORT`
- `REQUIRE_INGEST_AUTH`
- `INGEST_API_KEY`
- `MAX_RECENT_RULE_FIRES`
- `MAX_RECENT_PACKAGES`
- `MAX_RECENT_LLM_RESULTS`
- `AUTO_PROMPT_ENABLED`
- `AUTO_PROMPT_SEQUENCES_FILE`
- `CONTEXT_CARD_DIR`
- `CLAUDE_HOOKS_ENABLED`
- `CLAUDE_HOOKS_REQUIRE_SECRET`
- `CLAUDE_HOOKS_SHARED_SECRET`
- `CLAUDE_HOOKS_STREAM_PREFIX`
- `CLAUDE_HOOKS_DEFAULT_CONFIDENCE`
- `MAX_RECENT_AUTOPROMPT_RUNS`
- `MAX_RECENT_ASSESSMENTS`
- `MAX_RECENT_CONTEXT_CARDS`

If `CONTEXT_CARD_DIR` is not set, the runtime auto-detects and writes cards to
the existing wiki at `packages/compounding-memory/wiki` when available.

If `MINI_OMNI_SAMPLE_WAV` is not set (common in cloud), the service now
generates a short synthetic WAV input automatically for native `/chat` calls.

## API Endpoints

- `GET /healthz`
- `POST /v1/ingest/text`
- `POST /v1/ingest/visual`
- `POST /v1/ingest/claude-hook`
- `POST /v1/flush`
- `GET /v1/events/rules`
- `GET /v1/events/packages`
- `GET /v1/events/llm-results`
- `GET /v1/events/autoprompt-runs`
- `GET /v1/events/assessments`
- `GET /v1/events/context-cards`
- `GET /v1/events/claude-hook-triggers`

## Claude Hook Webhooks

This service can ingest Anthropic Claude Code HTTP hook events and convert them
into `claude_hook` auto-prompt triggers.

Minimal hook target:

- URL: `POST /v1/ingest/claude-hook`
- Auth: `x-api-key` (same ingest key) and optional `x-claude-hook-secret`
- Output: when runs fire, endpoint returns `hookSpecificOutput.additionalContext`
  so Claude can continue with orchestration context in the same session.

Example `~/.claude/settings.local.json` hook block:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "http://127.0.0.1:43110/v1/ingest/claude-hook",
            "headers": {
              "x-api-key": "replace-with-strong-key"
            }
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "http",
            "url": "http://127.0.0.1:43110/v1/ingest/claude-hook",
            "headers": {
              "x-api-key": "replace-with-strong-key"
            }
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "hooks": [
          {
            "type": "http",
            "url": "http://127.0.0.1:43110/v1/ingest/claude-hook",
            "headers": {
              "x-api-key": "replace-with-strong-key"
            }
          }
        ]
      }
    ]
  }
}
```

Example:

```bash
curl -sS -X POST http://127.0.0.1:43110/v1/ingest/text \
  -H 'x-api-key: replace-with-strong-key' \
  -H 'content-type: application/json' \
  -d '{"streamId":"prod_stream_01","utterance":"aspirin 200 mg please"}'
```

## Cloud Deployment

Yes, this can be part of production deployment with this split:

1. Deploy `audio-trigger-kws-mvp` API service as stateless Node app.
2. Deploy mini-omni as a dedicated model service (GPU/CPU VM/container).
3. Point `MINI_OMNI_API_URL` from API service to model service `/chat`.
4. Add managed persistence for packages/events (Postgres + vector + graph).

Notes:

- Cloudflare Workers are not suitable for running mini-omni model inference
  directly.
- You can still run this API on cloud containers and call a separate model host.

Detailed runbook:

- `docs/cloud_runtime-cloudflare-production.md` ⚠️ **DEPRECATED — CloudRuntime no longer
  used**
- `cloudflare/worker.example.ts`
- `cloudflare/wrangler.toml`
- `cloudflare/src/index.ts`
- `cloud_runtime.toml` ⚠️ **DEPRECATED — CloudRuntime no longer used**
- `Dockerfile`

Quickest live test commands:

- `docs/cloud_runtime-cloudflare-production.md` -> `Run Now`

## Suggested Repository Structure

```txt
apps/audio-trigger-kws-mvp/
  README.md
  .env.example
  package.json
  tsconfig.json
  src/
    index.ts
    services/
      ...
  docs/
    rule-dsl-v0.md
    storage-estimate.md
  schemas/
    trigger_rule.schema.json
    hit_event.schema.json
    context_package.schema.json
  configs/
    rules/
      examples.rules
```

## MVP SLOs

1. Trigger latency p95: `<250ms` (term end to rule fire).
2. Context package creation p95: `<400ms`.
3. LLM enqueue p95: `<2s`.
4. False triggers: `<0.1/hour/stream`.
5. LLM call reduction vs transcript-first baseline: `>95%`.

## Default Thresholds

- Term min confidence: `0.72`.
- Rule min confidence: `0.82`.
- Rule window: `5000ms`.
- Rule cooldown: `8000ms`.
- Sequence max gap: `7000ms`.

## Rollout Plan

### Phase 1 (Weeks 1-2)

- Audio ingest, VAD, KWS event stream.
- No LLM calls yet.
- Validate hit precision/recall on curated audio set.

### Phase 2 (Weeks 3-4)

- Grouping filter and rule engine (DSL + evaluator).
- Add alerting and metrics dashboard.

### Phase 3 (Weeks 5-6)

- Enricher + vector DB + KG writes.
- Context package generation with provenance fields.

### Phase 4 (Week 7)

- LLM micro-batching and template rendering.
- Tune thresholds and cooldowns from live telemetry.

## Open Decisions

1. Runtime language split (Go/Rust realtime, Python enrichment, or single
   stack).
2. Initial target domain taxonomy (medical, support, security, etc.).
3. Storage stack choices (Postgres+pgvector+Neo4j, or managed equivalents).
4. Privacy requirements for raw audio retention and redaction.
