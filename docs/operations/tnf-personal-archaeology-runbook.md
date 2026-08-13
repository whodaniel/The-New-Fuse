# TNF Personal Archaeology Runbook

Status: Active scaffold  
Audience: TNF operators and archaeology program maintainers

## 1. Purpose

Run a persistent, multi-agent reconstruction program for Daniel's life and
project history without confusing program authority with TNF platform authority.

## 2. Corporate Title Hierarchy

```text
Master Director
  tnf-cli-agent
    Master of Taxonomies
      master-of-taxonomies
    Master Orchestrator
      personal-archaeology-master-orchestrator
        Team Orchestrators
          source-acquisition
          narrative-reconstruction
          integrity-and-escalation
            Investigators / Sentinels
              repo-lineage-investigator
              notes-ledger-investigator
              media-evidence-investigator
              code-fossil-investigator
              timeline-synthesis-investigator
              auth-blocker-sentinel
```

## 3. Title Definitions

1. `Master Director`
   - top of the TNF organization
   - CEO-level protocol authority
   - currently represented by `tnf-cli-agent`
2. `Master of Taxonomies`
   - taxonomy and ontology authority
   - owns `definition-of-definitions`
   - classifies titles, skills, sub-skills, and chains
3. `Master Orchestrator`
   - top of one bounded program
   - for this program: `personal-archaeology-master-orchestrator`
4. `Team Orchestrator`
   - manages one bounded archaeology team
5. `Investigator`
   - gathers or synthesizes evidence within one lane

## 4. Program Cadence

1. Master loop every 30 minutes
2. Investigator pulse every 2 hours
3. Blocker watch every 15 minutes
4. Periodic digest every 12 hours

## 5. Persistent State

State root:

- `reports/personal-archaeology/`

Important files:

- `program.manifest.json`
- `status/*.json`
- `heartbeats/*.json`
- `progress/iteration-log.md`
- `blocked/human-actions.json`
- `notifications/alerts.jsonl`
- `notifications/outbox.jsonl`
- `notifications/dispatch-state.json`
- `reports/periodic-digest.md`

## 6. Human-In-The-Loop Rule

If any archaeology agent is blocked by:

- authentication
- missing access
- approvals
- third-party login

Then it must:

1. preserve findings references
2. append a blocked action item
3. append a human alert record
4. route escalation through `.agent/context/human-handoff.md`
5. relay to `tnf:bus:ingress` when TNF relay Redis is configured

## 7. Commands

Initialize the program:

```bash
pnpm tnf:journey:program:init
```

Pulse the master orchestrator:

```bash
pnpm tnf:journey:program:pulse -- --agent personal-archaeology-master-orchestrator --status active --summary "Delegated new reconstruction cycle"
```

Mark an auth blocker:

```bash
pnpm tnf:journey:program:pulse -- --agent notes-ledger-investigator --status blocked --blocked-reason "Apple Notes MCP authentication required" --requires-human "Authenticate Apple Notes MCP"
```

Run the master supervision loop:

```bash
pnpm tnf:journey:program:master-loop
```

Refresh investigator heartbeats:

```bash
pnpm tnf:journey:program:investigator-pulse
```

Publish a new digest:

```bash
pnpm tnf:journey:program:digest
```

Process pending blockers and relay them to TNF channels if configured:

```bash
pnpm tnf:journey:program:blocker-watch
```

## 8. Validation

Run:

```bash
node --test scripts/timeline/personal-archaeology-orchestrator.test.mjs
```
