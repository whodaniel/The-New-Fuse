# LLM Ranking Optimizer Protocol

## Overview
Reads arena intel data and generates advisory ranking recommendations for model fallback chains. Updates `data/llm-intel/ranking-recommendations.json` and `ranking-report-latest.md`. **Advisory only** — no configs are modified automatically.

## Schedule
- **Cron**: `30 */4 * * *` (every 4 hours at :30, UTC — runs 30min after collector)
- **Registry ID**: `tnf-llm-ranking-optimizer`
- **Category**: `llm_intelligence`
- **Owner**: `llm-ranking-optimizer` agent / `super-admin`

## Input
- `data/llm-intel/arena-intel-latest.json` (from collector)

## Processing Pipeline

1. **Load intel data** — read arena rankings, news, NVIDIA health from latest snapshot
2. **Normalize model names** — map short arena names (e.g., "kimi-k2.6") to NVIDIA NGC IDs (e.g., "moonshotai/kimi-k2.6")
3. **Compute composite scores** — weighted combination:
   - Arena rankings: weight 1.0 (averaged across all sources where model appears)
   - Benchmark scores (Aider, SWE-bench): weight 0.7
   - Health status: primary sort key (live > slow > eol)
   - Latency: secondary sort within same health tier
4. **Compare vs current priorities** — read from `~/.tnf/model-providers.json` and `~/.hermes/model-fallback-chain.json`
5. **Generate recommendations** — actions:
   - `add`: model not in current config but has arena presence
   - `reorder`: model exists but composite rank differs from current priority
   - `remove-eol`: model marked EOL by NVIDIA health probe
   - `demote`: model is slow (>15s latency) — deprioritize
6. **Filter news** — extract items mentioning relevant NVIDIA models
7. **Write outputs** — JSON recommendations + markdown report

## Output Schema (`tnf/llm-ranking-recommendations/0.1`)

```
data/llm-intel/
├── ranking-recommendations.json  # Machine-readable recommendations
└── ranking-report-latest.md     # Human-readable report
```

### ranking-recommendations.json
```json
{
  "schema": "tnf/llm-ranking-recommendations/0.1",
  "generatedAt": "2026-05-04T12:30:00Z",
  "compositeScores": [
    { "compositeRank": 1, "nvidiaId": "meta/llama-3.3-70b-instruct", "avgArenaScore": 1280, "healthStatus": "live", "latencyMs": 850 }
  ],
  "currentPriorityOrder": ["meta/llama-3.3-70b-instruct", ...],
  "recommendations": [
    { "action": "reorder", "model": "...", "currentPriority": 5, "proposedPriority": 2, "delta": -3, "reason": "..." }
  ],
  "newsDigest": [{ "title": "...", "url": "...", "source": "...", "sentiment": "...", "relevantNvidiaModels": [...] }],
  "summary": { "totalModelsScored": 37, "liveModels": 19, "recommendationsCount": 45 }
}
```

## Applying Recommendations
```bash
# Preview changes
pnpm tnf:llm:apply-rankings
# → choose "preview" to see what would change

# Apply all
pnpm tnf:llm:apply-rankings
# → choose "all" and confirm

# Apply to specific configs
pnpm tnf:llm:apply-rankings
# → enter comma-separated config numbers
```

All changes are backed up with `.bak-<timestamp>` files before modification.

## Run Commands
```bash
# Manual run
pnpm tnf:llm:optimize

# View report
pnpm tnf:llm:report

# Via cron runner
node scripts/protocols/run-chronological-process.cjs --process-id tnf-llm-ranking-optimizer
```
