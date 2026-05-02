# Changelog

All notable changes to `cursor-watch-learn` are documented in this file.

## 2026-03-26

### Added

- Initial implementation of `watch_learn_capture.py` with:
  - 1-second screenshot loop (`--interval` configurable),
  - cursor telemetry capture (`move`, `click_down`, `click_up`, `scroll`),
  - frame-to-event relationship enrichment,
  - rolling screenshot retention (`--max-screenshots`, default `20`).
- Structured run artifacts:
  - `events.jsonl`, `frames.jsonl`, `prune.jsonl`, `session.json`.
- Deterministic interpretation/report pipeline:
  - `analysis/timeline_events.csv`,
  - `analysis/frame_timeline.csv`,
  - `analysis/action_segments.csv`,
  - `analysis/hotspots.csv`,
  - `analysis/findings.json`,
  - `analysis/actionable_report.md`.
- LLM visual interpretation worker with dual backend support:
  - OpenAI SDK backend (`OPENAI_API_KEY`),
  - Codex OAuth backend via `codex exec`.
- Mode controls:
  - `--llm-interpretation required|auto|off`
  - `--llm-model auto`
  - `--llm-frame-stride` with auto mode (`0`).
- Project documentation:
  - `README.md` updated for setup and usage,
  - `ACCOMPLISHMENTS.md` added with validated outcomes.

### Changed

- Finding generation now de-duplicates scroll bursts using segment-level detection instead of sliding-window duplicates.
- Reporting now includes a full aggregation artifact:
  - `analysis/full_summation.json`
  - concise `analysis/actionable_report.md` with finding summaries and top findings (full detail still in JSON/CSV).
- CLI completion output now includes a concise findings summary and direct paths to summation artifacts.

### Validated Runs

- `run-20260326-182723`
  - 24 frames captured, 20 retained, 4 pruned.
  - Verified prune behavior and frame/event logging.
- `run-20260326-184208`
  - 22 frames captured, 20 retained, 2 pruned.
  - Verified retention behavior after LLM backend refactor.
- `run-20260326-185145`
  - `--llm-interpretation required` with no API key.
  - Confirmed OAuth path works (`llm_backend=codex_cli`, 1/1 successful interpretations).
- `run-20260326-185406`
  - 22 frames captured, 20 retained, 2 pruned.
  - OAuth-required LLM mode active with successful interpretations (`2/2`).
- `run-20260326-191031`
  - 24 frames captured, 20 retained, 4 pruned.
  - OAuth-required LLM mode active with successful interpretations (`2/2`).
  - High scroll activity captured (`scroll=497`) with dense finding output.
- `run-20260326-191137`
  - Stress check with denser LLM sampling (`--llm-frame-stride 2`).
  - 7 frames captured, 7 retained, 0 pruned.
  - OAuth-required LLM mode active with successful interpretations (`3/3`) and no queue drops.
- `run-20260326-191909`
  - 22 frames captured, 20 retained, 2 pruned.
  - OAuth-required LLM mode active with successful interpretations (`2/2`).
  - Verified full-summation artifact generation in the run output.
- `run-20260326-192002`
  - Synthetic rapid-scroll stress test (`200` scroll events over `2.242s`).
  - Finding output de-duplicated correctly to a single `scroll_burst` finding.
  - Verified new report format and `full_summation.json`.
- `run-20260326-192105`
  - Smoke test for new console findings summary output.
  - Verified artifact path reporting in terminal completion output.
- `run-20260326-192137`
  - OAuth-required LLM smoke test after summary-output update.
  - Verified concise console findings summary includes LLM training-label counts and artifact pointers.
