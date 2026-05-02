# Cursor Watch-Learn: Accomplishments

Last updated: March 26, 2026

## Objective Completed

Built a working watch-and-learn capture pipeline that:

- captures screenshots at a fixed cadence (default: every 1 second),
- records exact cursor activity with timestamps and event IDs,
- correlates each frame to action data from the same time window,
- enforces rolling screenshot retention (max 20 by default),
- produces actionable analysis artifacts, and
- supports LLM visual interpretation via either:
  - OpenAI SDK (`OPENAI_API_KEY`) or
  - Codex OAuth CLI (`codex login` session).

## What Was Implemented

### 1. Core capture loop

File: `watch_learn_capture.py`

- Cross-platform screenshot capture (macOS/Linux/Windows fallback behavior).
- Cursor listener captures:
  - `move`
  - `click_down`
  - `click_up`
  - `scroll`
- Each event has:
  - exact timestamp (`timestamp`, `ts_epoch`)
  - deterministic sequence id (`event_id`)
  - coordinate and motion fields where relevant.

### 2. Worker architecture

Implemented as local threaded workers (no LLM used for retention):

- `relation_worker`
  - enriches frame records with event summaries, relationship labels, and intent tags.
- `retention_worker`
  - keeps only newest `N` screenshots, deletes oldest, logs prune events.
- `visual_llm_worker`
  - optional second interpretation worker for screenshot + telemetry reasoning.
  - backend routing:
    - `openai_sdk` when `OPENAI_API_KEY` is available
    - `codex_cli` when OAuth login is active (`codex login status`).

### 3. Exact tracking + analysis outputs

Per run folder `output/run-YYYYMMDD-HHMMSS/`:

- `events.jsonl`: raw event stream with exact time and event IDs.
- `frames.jsonl`: frame/window correlation data.
- `prune.jsonl`: retention deletion records.
- `llm_interpretation.jsonl`: visual interpretation outputs (when enabled).
- `analysis/timeline_events.csv`: event-by-event exact timeline.
- `analysis/frame_timeline.csv`: frame-level action/context timeline.
- `analysis/action_segments.csv`: grouped action segments.
- `analysis/hotspots.csv`: cursor hotspot bins.
- `analysis/findings.json`: deterministic findings.
- `analysis/actionable_report.md`: combined actionable report.
- `session.json`: full run summary + interpretation metadata.

## Validation Evidence

### OAuth LLM required-mode run (no API key)

Run: `output/run-20260326-185406/`

- start: `2026-03-26T18:54:06.441565Z`
- end: `2026-03-26T18:54:36.251750Z`
- frames written: `22`
- retention cap: `20`
- screenshots remaining: `20`
- screenshots pruned: `2`
- llm mode: `required`
- llm backend: `codex_cli`
- llm processed: `2`
- llm success: `2`
- llm failed: `0`

Primary artifacts:

- `output/run-20260326-185406/session.json`
- `output/run-20260326-185406/llm_interpretation.jsonl`
- `output/run-20260326-185406/analysis/actionable_report.md`
- `output/run-20260326-185406/analysis/timeline_events.csv`

## Current Operating Notes

- `--llm-interpretation required` now accepts either auth path:
  - OpenAI API key + SDK, or
  - Codex OAuth session.
- `--llm-model auto` selects backend-safe default behavior.
- `--llm-frame-stride 0` auto-tunes:
  - OpenAI SDK backend: stride `1`
  - Codex OAuth backend: stride `10` (cost/perf guardrail).

## Ready for Next Phase

The project is now ready for deeper training-label taxonomy and higher-frequency interpretation strategies (for example dynamic stride changes based on detected action bursts).
