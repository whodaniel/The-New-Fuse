# Audio Trigger KWS + LLM MVP Plan

This app folder stores the implementation plan for a trigger-first audio intelligence pipeline that avoids expensive LLM calls until high-confidence word/phrase patterns are detected.

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

Backend modes:

- `MINI_OMNI_MODE=native_chat` (default): calls mini-omni `/chat` and stores returned WAV output.
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

1. Runtime language split (Go/Rust realtime, Python enrichment, or single stack).
2. Initial target domain taxonomy (medical, support, security, etc.).
3. Storage stack choices (Postgres+pgvector+Neo4j, or managed equivalents).
4. Privacy requirements for raw audio retention and redaction.
