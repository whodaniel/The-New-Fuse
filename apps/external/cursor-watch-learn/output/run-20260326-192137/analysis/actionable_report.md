# Actionable Cursor Activity Report

- Generated at: 2026-03-26T19:22:14.541934Z
- Run directory: /Users/<owner>/tools/cursor-watch-learn/output/run-20260326-192137
- Frames captured: 6
- Events captured: 0
- Event span: 0.0s
- Screenshots retained: 6 (max 20)

## Exact Tracking Artifacts
- Timeline (event-by-event): `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-192137/analysis/timeline_events.csv`
- Frame timeline: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-192137/analysis/frame_timeline.csv`
- Action segments: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-192137/analysis/action_segments.csv`
- Hotspots: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-192137/analysis/hotspots.csv`
- Findings JSON: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-192137/analysis/findings.json`
- Full summation JSON: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-192137/analysis/full_summation.json`
- LLM interpretations: `/Users/<owner>/tools/cursor-watch-learn/output/run-20260326-192137/llm_interpretation.jsonl`

## Full Summation
- Active frames: 0/6
- Idle frames: 6/6
- Average events per frame: 0.0
- Average event rate: 0.0 events/s
- Total cursor move distance: 0 px
- Peak frame: id=1 events=0 at 2026-03-26T19:21:37.861538Z
- Top hotspot: none

## Event Counts

## Finding Summary
- Total findings: 0

## Actionable Findings (Top 25)
1. No notable friction patterns detected in this run.

## LLM Visual Findings
- Processed frames: 3 (ok=3, error=0)
- intent::Reviewing the agent’s written status/thoughts before deciding the next instruction. -> 1
- intent::Reviewing agent/log output before deciding the next command. -> 1
- intent::Reviewing agent output and pausing before issuing the next command. -> 1
- training_label::idle_review_of_terminal_draft -> 1
- training_label::terminal_idle_review_output -> 1
- training_label::idle_reading_terminal_output -> 1
1. Opportunity: detect idle-over-draft states and proactively suggest concise next actions (e.g., "send", "revise", or "run verification") to reduce decision latency.
2. Opportunity: detect idle-on-output and offer a concise next-action prompt (e.g., summarize findings or propose next command) to reduce decision friction.
3. Opportunity: detect idle-on-output moments and proactively suggest concise next actions (e.g., summarize decisions or offer command shortcuts) to reduce cognitive load.
