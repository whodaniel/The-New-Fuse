---
name: 'cursor-watch-learn-operator'
description:
  'Run and validate cursor watch-and-learn capture sessions that correlate
  1-second screenshots with cursor events, enforce rolling screenshot deletion,
  and generate actionable full-summation reports. Use when building, testing, or
  demoing the cursor-watch-learn feature.'
---

# Cursor Watch Learn Operator

Use this skill to execute repeatable capture cycles in
`/Users/<owner>/tools/cursor-watch-learn` and report what happened in
plain language with supporting metrics.

## Run A Live Cycle

1. Ensure dependencies are installed:

```bash
cd /Users/<owner>/tools/cursor-watch-learn
./.venv/bin/pip install -r requirements.txt
```

2. Start capture with the baseline settings:

```bash
cd /Users/<owner>/tools/cursor-watch-learn
./.venv/bin/python watch_learn_capture.py \
  --screenshot-interval 1 \
  --max-screenshots 20 \
  --llm-interpretation auto \
  --llm-model auto \
  --llm-frame-stride 0
```

3. Let the user perform live mouse activity, then stop with `Ctrl+C`.
4. Inspect the newest run folder under `output/run-*`.

## Required Validations

1. Verify rolling retention:

- `frames/` file count is `<= max_screenshots`.
- `metadata.json` fields `frame_count`, `frames_pruned`, and
  `retention.max_frames` are consistent.

2. Verify correlation outputs exist:

- `analysis/timeline.json`
- `analysis/event_report.json`
- `analysis/actionable_report.md`
- `analysis/full_summation.json`
- `analysis/plain_language_summary.txt`

3. If LLM interpretation is enabled, verify `analysis/llm_interpretations.json`
   exists and has interpreted frames.

## Reporting Standard

Return a concise summary with:

- Time window (`started_at_utc`, `ended_at_utc`, elapsed seconds).
- Event totals (`move`, `click`, `scroll`).
- Retention totals (captured, retained, pruned).
- Top findings from `analysis/full_summation.json`.
- Plain-language interpretation highlights from
  `analysis/plain_language_summary.txt`.
- Paths to all key artifacts.

## Delegation Pattern

When runs are large or comparison-heavy, split work:

1. Subagent A validates counts and retention, then summarizes timeline and event
   metrics.
2. Subagent B synthesizes visual interpretations into behavior findings.
3. Merge both into one actionable final report with explicit evidence paths.

## Troubleshooting

- If `--llm-interpretation required` fails without `OPENAI_API_KEY`, use Codex
  OAuth fallback via `codex exec` and keep `--llm-model auto`.
- If no frames appear, verify OS screen capture permissions.
- If skill loading fails, re-check YAML quoting and run the skill validator.
