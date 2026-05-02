# Actionable Cursor Activity Report

- Generated at: 2026-03-26T18:51:55.708020Z
- Run directory: /Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185145
- Frames captured: 1
- Events captured: 0
- Event span: 0.0s
- Screenshots retained: 1 (max 20)

## Exact Tracking Artifacts
- Timeline (event-by-event): `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185145/analysis/timeline_events.csv`
- Frame timeline: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185145/analysis/frame_timeline.csv`
- Action segments: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185145/analysis/action_segments.csv`
- Hotspots: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185145/analysis/hotspots.csv`
- Findings JSON: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185145/analysis/findings.json`
- LLM interpretations: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-185145/llm_interpretation.jsonl`

## Event Counts

## Actionable Findings
1. No notable friction patterns detected in this run.

## LLM Visual Findings
- Processed frames: 1 (ok=1, error=0)
- intent::Pausing to read terminal output and decide the next command/message before typing. -> 1
1. Opportunity: detect idle-over-input after long-running task output and proactively suggest next-step shortcuts (e.g., run review, continue test, or queue message).
