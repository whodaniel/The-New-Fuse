# Actionable Cursor Activity Report

- Generated at: 2026-03-26T18:54:36.267183Z
- Run directory: /Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185406
- Frames captured: 22
- Events captured: 334
- Event span: 7.384s
- Screenshots retained: 20 (max 20)

## Exact Tracking Artifacts
- Timeline (event-by-event): `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185406/analysis/timeline_events.csv`
- Frame timeline: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185406/analysis/frame_timeline.csv`
- Action segments: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185406/analysis/action_segments.csv`
- Hotspots: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185406/analysis/hotspots.csv`
- Findings JSON: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185406/analysis/findings.json`
- LLM interpretations: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185406/llm_interpretation.jsonl`

## Event Counts
- click_down: 1
- click_up: 1
- move: 332

## Actionable Findings
1. No notable friction patterns detected in this run.

## LLM Visual Findings
- Processed frames: 2 (ok=2, error=0)
- intent::Reading/monitoring live run output and deciding next command, not yet executing an action. -> 1
- intent::Pausing to think before continuing or sending a documentation-related instruction. -> 1
1. Opportunity: detect passive monitoring states and proactively suggest the next likely command or auto-surface completion/timeout alerts to reduce idle watch time.
2. Opportunity: detect idle-at-compose moments and suggest autocomplete/template for documenting validation results to reduce hesitation.
