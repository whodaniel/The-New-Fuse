---
name: tnf-cli-agent-onboarding
description: >-
  Onboard a new AI-agent CLI (Command Code, Codex, OpenCode, Kilo, Hermes, ...)
  into the TNF harness end-to-end: agent definition, ledger row, platform
  taxonomy, passthrough dispatch, registry rebuild, live bus registration, and
  ubiquity wiring. Use when adding any agent CLI to the swarm, when
  "command-code" or another CLI platform is missing from tnf traits, or when a
  new agent must be discoverable by orchestrators.
primary_type: protocol
category: engineering/onboarding
department: tech
risk_tier: low
harmful_pattern_detection: false
---

# TNF CLI Agent Onboarding

Onboard a new terminal AI agent CLI as a first-class TNF agent. This is the
five-layer contract proven during the 2026-08-16 Command Code onboarding.

## When to use

- A new agent CLI (Codex, OpenCode, Kilo, Hermes, Command Code, ...) must join
  the swarm.
- `tnf traits list --json` does not show the platform (warn-only registration is
  NOT complete).
- `tnf <cli> --help` does not dispatch to the target (missing passthrough).

## The 5-step contract (all required — warn-only taxonomy registration is a half-onboarding)

### 1. Agent definition file

Create `.agent/agents/<id>.md` modeled on `.agent/agents/codex-cli-agent.md`:

```yaml
---
category: Engineering
dacc_role: worker
worker_action: cli_coder
name: <id>
description: Live CLI runtime surface for the <CLI>...
tags: [cli, runtime-surface, local]
capabilities: [session_management, code_generation, ...]
agentType: local
---
# <CLI> Agent
[tnf-native]
... operational mandate, slash-command reference, constraints (no commit authority) ...
```

Mirror it: `cp .agent/agents/<id>.md .claude/agents/<id>.md` (mirror policy).

### 2. Ledger row

```bash
node scripts/check-agent-registration.cjs            # should list it unregistered
node scripts/check-agent-registration.cjs --fix       # appends TNF:LOCAL:AGENT:<ID>:001
```

Verify: `grep "<id>" docs/protocols/AGENT_STATUS_LEDGER.md`.

### 3. Platform taxonomy (packages/tnf-cli/src/cli.ts)

Add the platform to `PLATFORM_TAXONOMY` (~line 3382). This is the canonical way
to extend the runtime taxonomy (the array's own comment says so). Without it,
`tnf register` only warns and the agent is unroutable.

### 4. Passthrough dispatch (packages/tnf-cli/src/cli.ts)

Add the CLI name to `passthroughTargets` (~line 4370) so `tnf <cli> ...`
forwards with TNF MCP routing injected (`buildPassthroughEnv`).

### 5. Registry + live bus

```bash
node scripts/agent-registry/build-agent-registry.mjs          # refresh data/agent-registry
tnf register <id> worker <platform> --worker-action cli_coder --daemon  # Redis bus
```

Verify with `tnf traits list --json` (platform present) and
`redis-cli HGETALL tnf:agent-registry | grep <id>`.

## Ubiquity wiring (so the new CLI also gets all TNF skills)

1. Add the home root to `scripts/skills/skill-bank-sync.cjs` (folderSkillRoots +
   flatSkillRoots + detectOriginLabel): `~/.<id>/skills` →
   `{ llm: '<id>', scope: 'global' }`.
2. Add the target to `scripts/agents/reconcile-agent-banks.cjs` targetMap:
   `<id>: [path.join(home, '.<id>', 'skills_inactive', 'imported-claude-agents')]`.
3. Add the frontload surface to `scripts/install-agent-frontload.cjs` TARGETS.
4. Symlink the ubiquity skill family (`~/.agents/skills/*-slash-commands`,
   skill-management, tnf-universal-slash-commands,
   tnf-full-auto-network-autopilot) into `~/.<id>/skills/`.
5. Run `node scripts/skills/skill-bank-sync.cjs` +
   `node scripts/agents/reconcile-agent-banks.cjs --targets all`.

## Verification gate (run all before declaring done)

```bash
node scripts/check-agent-registration.cjs          # "All agents are registered"
tnf traits list --json | grep <id>                  # platform present
ls ~/.<id>/skills/ | grep -c slash-commands         # >= 9 (family present)
ls ~/.<id>/skills_inactive/imported-claude-agents/ | wc -l # specialist wrappers available on demand
node scripts/skills/universal-skill-disclosure-guard.cjs --check
node scripts/protocols/validate-turn-zero-authority.cjs
node scripts/harness/verify-harness-completeness.cjs
```

## Known failure modes

- **Warn-only register**: `tnf register` accepts non-canonical platforms with a
  warning. That is NOT onboarding — the taxonomy entry (step 3) is mandatory.
- **Symlink walk**: skill-bank-sync's walker follows symlinked skill dirs and
  skips broken symlinks (fixed 2026-08-16). If a new root's skills are symlinks,
  ensure they resolve; dangling links are skipped silently.
- **Concurrent commits**: another agent may commit half your change mid-session.
  Always re-verify the full 5-step contract at the end, not just the files you
  touched.
