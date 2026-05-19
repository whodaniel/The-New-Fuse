# TNF AI5 Activation Audit (2026-05-19)

## Scope

Audit whether AI5 playlist ingestion is producing executable product
improvements, not just stored artifacts.

## Updates Implemented

1. Transcript-aware AI5 ingest in
   `scripts/autonomy/ingest_ai5_and_new_may_notes.py`:

- local transcript cache lookup
- `yt-dlp` caption fetch fallback
- normalized transcript text included in ingestion payload

2. Targeted re-ingest controls:

- `--video-id-filter`
- `--note-pk-filter`
- `--transcript-fetch-timeout-sec`

3. Action activation bridge added in
   `scripts/autonomy/activate_intelligence_actions.py`:

- converts artifacts into task queue with lane/owner/priority/acceptance
- emits `data/ingestion-runs/ai5-new-may-2026-action-queue.json`

4. Stricter activation gating:

- no procedural dispatch when transcript is unavailable
- procedural dispatch requires higher specificity hints (not generic fragments)
- queued status is auto-reset to pending if a task is no longer
  dispatch-eligible

5. Dispatch bridge added in `scripts/autonomy/dispatch_intelligence_tasks.py`:

- confidence-gated queue push into Redis
- JSON + markdown conversion reporting
- queue reconciliation mode to prune stale AI5 tasks from Redis
  (`--reconcile-queue`)

6. Ingest now auto-runs activation unless `--skip-action-activation` is set.
7. CLI shortcuts added in `package.json`:

- `tnf:intel:activate`
- `tnf:intel:batch:ingest`
- `tnf:intel:dispatch`
- `tnf:intel:dispatch:reconcile`

## Current Measured State

- Manifest tracked sources: `84` (`37` AI5 videos + `47` notes)
- Manifest latest run success: `84/84`
- AI5 activation scope: `37` videos
- Transcript status: `28 cache_hit`, `9 fetched`, `0 missing`
- Action queue tasks generated: `64`
- Immediate execution coverage (videos with procedural actions): `0.081`
  (`3/37`)
- No-procedural video count: `34`
- Transcript present but still non-procedural: `34`
- Dispatch-eligible tasks after strict gating: `0`
- Action queue status counts: `64 pending`, `0 queued`
- Redis reconcile outcome: queue depth `23 -> 1`, stale AI5 tasks removed: `22`

## Interpretation

The ingestion and activation stack is now deterministic and safe against
low-quality auto-dispatch, but procedural extraction quality remains the
bottleneck. TNF is now preventing weak or transcript-missing tasks from entering
execution queues, which improves reliability but exposes the true gap:
procedural sentence extraction is still too fragmentary for production
automation.

## Immediate Operational Commands

```bash
# Re-ingest specific videos with transcript fetch + activation + dispatch
python3 scripts/autonomy/ingest_ai5_and_new_may_notes.py \
  --video-id-filter kXBXIipl1lQ,ynJyIKwjonM \
  --note-pk-filter __none__ \
  --transcript-fetch-timeout-sec 25 \
  --auto-dispatch \
  --action-source-prefixes yt-ai5-

# Rebuild the activation queue from manifest/artifacts
python3 scripts/autonomy/activate_intelligence_actions.py \
  --manifest-path data/ingestion-runs/ai5-new-may-2026-manifest.json \
  --out-path data/ingestion-runs/ai5-new-may-2026-action-queue.json \
  --source-prefixes yt-ai5-

# Reconcile Redis queue with current curated action queue
python3 scripts/autonomy/dispatch_intelligence_tasks.py \
  --action-queue-path data/ingestion-runs/ai5-new-may-2026-action-queue.json \
  --reconcile-queue
```

## Market Readiness Implication

TNF now has a concrete inspect->act->verify bridge and queue hygiene controls,
but procedural execution density is still below launch-grade. The immediate
blocker is not ingestion coverage anymore; it is converting transcript content
into concrete, module-targeted implementation tasks with enough specificity to
auto-execute.
