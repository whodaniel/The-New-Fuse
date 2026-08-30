`[CLASS:PRIME] [STATUS:ACTIVE]`

# TNF Adaptable Host Verification — V2

**Protocol ID:** `TNF_ADAPTABLE_HOST_VERIFICATION`  
**Status:** ACTIVE

## Purpose

TNF capabilities may be staffed by changing combinations of model providers, CLI
harnesses, browser surfaces, local runtimes, agents, services, and humans.
Verification must discover what is actually enlisted and relevant rather than
enforcing yesterday's host pack.

OpenClaw, Hermes, Claude Code, Codex, Cursor, Gemini, Pi and similar surfaces
are providers/adapters. None is the universal identity of TNF.

## Repository identity before host assumptions

Before write-capable code work, establish that the working tree points at
`whodaniel/tnf-monorepo`. A historical folder name is not repository identity.

Use:

```bash
node scripts/protocols/turn-zero-v2-gate.cjs --require-write-ready
```

## Three independent classifications

Host verification must not collapse these into one work-plane label.

### Work domain

- `core`
- `agency`
- `personal`

### Artifact destination

- `oss_runtime`
- `public_contract`
- `private_control_plane`
- `satellite`
- `external`

### Data residency / sensitivity

Residency:

- `product_state`
- `bounded_working`
- `external_durable`
- `secret_machine_local`

Sensitivity:

- `public`
- `internal`
- `private`
- `restricted`

A personal workflow may reveal a generalized OSS improvement, but the private
source context remains external/private.

## Enlistment before enforcement

A provider-specific check may degrade a task only when that provider or
capability is actually required/enlisted.

Evidence of enlistment can include:

- explicit environment/config opt-in;
- harness configuration;
- active provider/runtime discovery;
- capability staffing receipt;
- task requirement.

Missing artifacts for an inactive provider are advisory, not a TNF-wide failure.

## Capability-first verification

Use:

```text
Task intent
  → required capabilities
  → available providers
  → authority/privacy/context/cost/latency check
  → staffing decision
  → execution
  → independent verification where warranted
```

Do not require a named provider when another enlisted provider satisfies the
capability contract.

## Host-specific trajectory / failure sources

ASSIMILATE_CHECK V2 asks each relevant/enlisted provider adapter for its own
trajectory/failure source. There is no universal requirement to scan
`~/.hermes/cron/output/` or any other one-host path.

## Rules

1. Canonical TNF handoff is
   `docs/protocols/reports/SESSION_HANDOFF_LATEST.{json,md}` plus approved local
   cache surfaces.
2. Discover before enforcing host-specific state.
3. Verify only the surfaces needed by the task or current staffing decision.
4. A provider being installed does not mean it is enlisted for this task.
5. A missing optional provider is not a framework outage.
6. TNF product/repository boundaries remain authoritative regardless of
   provider.
7. Private data may not be copied into a public provider/repository merely to
   improve convenience.

## Related

- `docs/protocols/TURN_ZERO_MANDATE.md`
- `docs/core/FRONTLOAD_MANIFEST.md`
- `docs/protocols/HARNESS_CONFIG.md`
- `data/harness/harness-config.json`
- `docs/product/TNF_PRODUCT_BOUNDARY.md`
- `docs/REPO_SEPARATION.md`
