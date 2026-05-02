# Cursor Watch-Learn Capture

This utility captures a screenshot every second, records cursor activity at the same time, and links each frame to the cursor actions that happened in that frame window.

Project implementation log: `ACCOMPLISHMENTS.md`
Project change history: `CHANGELOG.md`

## Features

- 1-second screenshot cadence by default (`--interval` configurable)
- Cursor event capture (`move`, `click_down`, `click_up`, `scroll`)
- Exact event ordering with timestamps and event IDs (`events.jsonl`)
- Frame-to-action relationship summaries (`frames.jsonl`) with frame window start/end times
- Rolling screenshot retention: keeps only newest `N` files (`--max-screenshots`, default `20`)
- Processing is offloaded to worker subagents (threads):
  - `relation_worker` for telemetry enrichment
  - `retention_worker` for rolling deletion
  - `visual_llm_worker` for screenshot + cursor interpretation (optional but supported)
- Auto-generated actionable reporting under `analysis/`

## Setup

```bash
cd /Users/<owner>/tools/cursor-watch-learn
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If using LLM visual interpretation, set:

```bash
export OPENAI_API_KEY=your_key_here
```

If you are logged into Codex CLI with OAuth (`codex login status`), the tool can use that
instead of an API key.

## Test Round (15 seconds)

```bash
cd /Users/<owner>/tools/cursor-watch-learn
source .venv/bin/activate
python watch_learn_capture.py --interval 1 --duration 15 --max-screenshots 20
```

Require LLM interpretation in the run:

```bash
python watch_learn_capture.py \
  --interval 1 \
  --duration 15 \
  --max-screenshots 20 \
  --llm-interpretation required \
  --llm-model auto
```

## Output

Each run is saved under:

- `output/run-YYYYMMDD-HHMMSS/`

Files:

- `screenshots/` newest screenshots only (max 20 by default)
- `events.jsonl` raw cursor events
- `frames.jsonl` per-frame record + relationship summary
- `prune.jsonl` screenshot deletion events
- `llm_interpretation.jsonl` frame-by-frame visual interpretations from the LLM (when enabled)
- `session.json` run summary
- `analysis/timeline_events.csv` exact timestamped action timeline
- `analysis/frame_timeline.csv` frame timeline with app/window context
- `analysis/action_segments.csv` grouped movement/scroll/click segments
- `analysis/findings.json` deterministic actionable findings
- `analysis/full_summation.json` complete run-level aggregation (events, frames, findings, hotspots, LLM)
- `analysis/actionable_report.md` combined actionable report (deterministic + LLM findings, top 25 findings shown)

## Notes

- On macOS, you must allow Screen Recording for Terminal (or your shell host) to capture screenshots.
- Frontmost app/window lookup uses AppleScript and may require Accessibility permissions.
- LLM mode options:
  - `--llm-interpretation required` fail if no LLM backend is available
  - `--llm-interpretation auto` use best available backend:
    - OpenAI SDK backend when `OPENAI_API_KEY` is set
    - Codex OAuth backend via `codex exec` when logged in
  - `--llm-interpretation off` disable LLM interpretation
  - `--llm-frame-stride 0` auto-stride (OpenAI SDK: 1, Codex OAuth: 10)
- At run completion, the CLI now prints a concise findings summary and pointers to `full_summation.json` and `actionable_report.md`.
