# Value Ladder Operator Runbook

## 1) Regenerate and validate the source ladder report

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export VLA_DIR="$CODEX_HOME/skills/imported-claude-agents/value-ladder-architect-agent"
bash "$VLA_DIR/scripts/run_pipeline.sh" \
  "$VLA_DIR/references/input-template.json" \
  "$VLA_DIR/output/value_ladder_report.json"
```

## 2) Dispatch order (strict)

T01 -> T02 -> (T03,T04,T05) -> T06 -> T07 -> T08 -> T09 -> (T10,T11) -> (T12,T13)

Manifest: `/Users/<owner>/.codex/skills/imported-claude-agents/value-ladder-architect-agent/output/agent_dispatch_manifest.json`

## 3) Copy/paste dispatch prompts

Send each line as a new request in sequence.

```text
$audience-persona-architect-agent
Use /Users/<owner>/.codex/skills/imported-claude-agents/value-ladder-architect-agent/output/value_ladder_report.json and produce persona-brief.json for all 5 offers.
```

```text
$sales-funnel-architect-agent
Using persona-brief.json + value_ladder_report.json, create funnel-blueprint.md with page-level architecture and handoff logic.
```

```text
$lead-magnet-funnel-agent
Build lead-magnet-funnel-pack.md for Free Growth Playbook (opt-in page, thank-you page, delivery email, 3 nurture emails).
```

```text
$digital-product-factory-agent
Build tripwire-product-pack.md for Starter Toolkit (contents, fulfillment flow, onboarding copy).
```

```text
$content-writer-agent
Build core-offer-copy-pack.md for Core Accelerator Program (webinar registration page, webinar pitch structure, sales page, close emails).
```

```text
$email-marketing-automation-agent
From all prior deliverables, output automation-map.json with triggers, delays, branches, tags, and goals.
```

```text
$deal-negotiator-agent
Create high-ticket-offer-terms.md for Elite Advisory (scope, price terms, qualification, objection handling).
```

```text
$legal-compliance-agent
Create compliance-checklist.md covering FTC disclosures, privacy policy, terms, and required disclaimers for all pages/emails.
```

```text
$traffic-generation-agent
Create traffic-plan-30d.md focused on feeding lead magnet and webinar funnels.
```

```text
$ab-testing-optimizer-agent
Create ab-test-backlog.md with top 10 tests prioritized by expected revenue impact.
```

```text
$analytics-and-reporting-agent
Create weekly-growth-report-template.md tracking conversion by ladder rung.
```

```text
$cro-process-agent
Create cro-sprint-plan.md (investigation, hypothesis, execution, evaluation).
```

```text
$funnel-economics-analyst-agent
Create unit-economics-report.md template for CAC, LTV, payback, and LTV:CAC.
```

## 4) Operating cadence (every 30 minutes)

Run one cycle manually:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export VLA_DIR="$CODEX_HOME/skills/imported-claude-agents/value-ladder-architect-agent"
bash "$VLA_DIR/scripts/run_30m_cycle.sh" "$VLA_DIR/references/input-template.json"
cat "$VLA_DIR/output/ready_tasks.json"
```

What each 30-minute cycle does:

- Regenerates and validates `value_ladder_report.json`
- Reads `task_status.json`
- Emits currently unblocked tasks to `ready_tasks.json`

When a task is complete, mark it `done` in:

`/Users/<owner>/.codex/skills/imported-claude-agents/value-ladder-architect-agent/output/task_status.json`

### macOS automation with launchd (every 1800s)

Create `~/Library/LaunchAgents/com.vla.30m.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.vla.30m</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>export CODEX_HOME="${HOME}/.codex"; bash "${CODEX_HOME}/skills/imported-claude-agents/value-ladder-architect-agent/scripts/run_30m_cycle.sh"</string>
    </array>
    <key>StartInterval</key>
    <integer>1800</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/vla-30m.out</string>
    <key>StandardErrorPath</key>
    <string>/tmp/vla-30m.err</string>
  </dict>
</plist>
```

Load it:

```bash
launchctl unload ~/Library/LaunchAgents/com.vla.30m.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.vla.30m.plist
launchctl list | rg com.vla.30m
```
