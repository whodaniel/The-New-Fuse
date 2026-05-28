---
name: personal-archaeology-orchestration
description:
  Run a multi-agent personal-history reconstruction program with a Master
  Orchestrator, Team Orchestrators, investigator subagents, heartbeat files,
  periodic reporting, blocked-state escalation, and master-clock scheduling. Use
  when Codex needs to operate or scaffold autonomous archaeology teams inside
  TNF.
---

# Personal Archaeology Orchestration

## Purpose

Operate personal historical archaeology as a TNF-native program, not a one-off
prompt.

Primary skill type: `integration`

Secondary tags:

- `continuous`
- `exploratory`
- `deterministic`

This skill defines:

- role taxonomy for `Master Director`, `Master Orchestrator`,
  `Team Orchestrator`, and `Investigator`
- skill taxonomy for sub-skills and skill chaining
- investigator teams for repos, notes, media, code, narrative, and privacy
- heartbeat and blocked-state contracts
- periodic reporting and human-in-the-loop escalation
- master-clock schedule ownership for the archaeology loop

## Skill Classification

Classification itself is a skill.

Read [references/skill-taxonomy.md](references/skill-taxonomy.md) before
changing sub-skills or chains.

The owning meta agent/skill for this layer is `Master of Taxonomies`.

Treat the archaeology program as an umbrella skill-chain with these sub-skills:

- definition of definitions
- role classification
- skill classification
- skill chaining
- source reconstruction
- privacy governance
- heartbeat operations
- human escalation

This skill is the program-level bridge that connects those sub-skills into one
operating loop.

## Naming Taxonomy

Read [references/role-taxonomy.md](references/role-taxonomy.md) before creating
or naming agents.

Required distinction:

- `Master Director`: TNF protocol or platform-level authority
- `tnf-cli-agent`: current embodiment of `Master Director` authority
- `Master Orchestrator`: program-level orchestrator for a single domain or
  campaign
- `Team Orchestrator`: bounded coordinator for one sub-fleet
- `Investigator`: specialist evidence collector or synthesizer
- `Sentinel`: blocker and heartbeat watchdog

Do not label the archaeology fleet leader as `Master Director`. Use
`Master Orchestrator`.

## Program Layout

The archaeology program should have:

1. One `Master Orchestrator`
2. Multiple `Team Orchestrators`
3. Specialist `Investigator` agents
4. One `Auth Blocker Sentinel`
5. Durable state under `reports/personal-archaeology/`

## Team Model

Recommended teams:

- `source-acquisition`
- `narrative-reconstruction`
- `integrity-and-escalation`

Recommended investigators:

- repo lineage
- notes ledger
- media evidence
- code fossils
- timeline synthesis
- privacy redaction

## Clock And Heartbeats

Read
[references/clock-and-heartbeat-contract.md](references/clock-and-heartbeat-contract.md).

Every program run must maintain:

- heartbeat JSON per orchestrator/investigator
- iterative progress log
- blocked-action queue for human-required steps
- periodic digest report

If an agent is blocked by authentication, approval, or access:

1. write the blocked item to the human-actions queue
2. emit a human alert record
3. preserve current findings before escalation
4. do not silently stall

## Scripts

Bootstrap and pulse the program with:

- `node scripts/timeline/personal-archaeology-orchestrator.mjs init`
- `node scripts/timeline/personal-archaeology-orchestrator.mjs pulse --agent <agent-id> --status <status>`

Package aliases:

- `pnpm tnf:journey:program:init`
- `pnpm tnf:journey:program:pulse`

## References

- [../personal-historical-archaeology/SKILL.md](../personal-historical-archaeology/SKILL.md)
- [.agent/context/human-handoff.md](/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.agent/context/human-handoff.md)
- [docs/protocols/bridges/tnf-personal-archaeology-orchestration.yml](/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/protocols/bridges/tnf-personal-archaeology-orchestration.yml)
- [docs/operations/tnf-personal-archaeology-runbook.md](/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/operations/tnf-personal-archaeology-runbook.md)

## Validation

Run:

- `node --test scripts/timeline/personal-archaeology-orchestrator.test.mjs`
- `pnpm tnf:journey:program:init`
- `pnpm tnf:journey:program:pulse`

Check that:

- manifest and team files are created
- heartbeat files update per pulse
- blocked items append to the human-actions queue
- alert queue entries exist for auth or approval blockers
