# Actionable Cursor Activity Report

- Generated at: 2026-03-26T19:19:49.453635Z
- Run directory: /Users/<owner>/tools/cursor-watch-learn/output/run-20260326-191909
- Frames captured: 22
- Events captured: 124
- Event span: 1.476s
- Screenshots retained: 20 (max 20)

## Exact Tracking Artifacts
- Timeline (event-by-event): `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-191909/analysis/timeline_events.csv`
- Frame timeline: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-191909/analysis/frame_timeline.csv`
- Action segments: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-191909/analysis/action_segments.csv`
- Hotspots: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-191909/analysis/hotspots.csv`
- Findings JSON: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-191909/analysis/findings.json`
- Full summation JSON: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-191909/analysis/full_summation.json`
- LLM interpretations: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-191909/llm_interpretation.jsonl`

## Full Summation
- Active frames: 1/22
- Idle frames: 21/22
- Average events per frame: 5.64
- Average event rate: 84.01 events/s
- Total cursor move distance: 612.77 px
- Peak frame: id=13 events=124 at 2026-03-26T19:19:21.487615Z
- Top hotspot: (240, 600) events=66

## Event Counts
- click_down: 1
- click_up: 1
- move: 122

## Finding Summary
- Total findings: 0

## Actionable Findings (Top 25)
1. No notable friction patterns detected in this run.

## LLM Visual Findings
- Processed frames: 2 (ok=2, error=0)
- intent::Monitoring multi-terminal agent progress while paused, possibly deciding the next command. -> 1
- intent::Pausing to think/review before continuing to type or send the next terminal instruction. -> 1
- training_label::idle_monitoring_multiterminal_progress -> 1
- training_label::terminal_idle_hover_mid_draft -> 1
1. Opportunity: detect sustained idle-over-status behavior across parallel terminals and proactively surface a concise 'next best action' summary to reduce coordination overhead.
2. Opportunity: detect drafting hesitation in terminal workflows and offer lightweight next-step suggestions or autocomplete nudges without interrupting.
