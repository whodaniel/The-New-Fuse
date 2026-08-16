# Executable Intelligence Artifact

**Artifact ID:** eia-5b23cfaaeca0860c **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:45:38+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6393
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6393
- Title: 3 of 6 are dirty stubs that pretend to be servers. That's exactly…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:45:38+00:00

## Taxonomy of Actionability

### Procedural

- Until I wrote the probe just now, these placeholders circulated in the config
  forever.
- They take >13s to boot tsx + nestjs deps
- devops-bridge starts up cleanly (DevOps Bridge MCP Server running on stdio)
  and then idles waiting on stdin for client input.
- server stays alive, awaiting JSON-RPC over stdio.
- Strong hypothesis: my probe is framing the JSON-RPC message wrong.
- Modern MCP stdio servers use Content-Length headers, NOT
  bare-newline-delimited JSON.
- Use 'tnf' as the entrypoint for OpenClaw and other Claw-type agent operations.
- Prefer native 'tnf <command>' routes first, then 'tnf openclaw ...' or 'tnf
  claw ...'.
- TURN ZERO ONBOARDING PROMPT (Copy/Paste for new agent sessions):
- Launch raw AI CLIs from the TNF repository root so ./docs/...
- or 'cat ~/.tnf/handoff-current.json' for raw JSON
- [WARN] The "pnpm" field in package.json is no longer read by pnpm.
- The following keys were ignored: "pnpm.overrides".
- See https://pnpm.io/settings for the new home of each setting.
- Step 1: Reading state files...
- Step 2: Reading frontload policy files...
- .agent/SYSTEM_PROMPT.md
- .agent/context/resource-map.md
- .agent/context/agent-onboarding.md
- Step 3: Reading session handoff...

### Strategic

- Protocol: Integration Verification
- creative: architecture-diagram,
- model-watchdog, provider-probe-gate
- llm-wiki, polymarket, resea...
- tnf: TNF Free LLM Fleet, TNF LLVM
- Tip: provider_routing controls OpenRouter provider sorting, whitelisting, and
- Model switched: minimaxai/minimax-m3
- Provider: Nvidia
- Checking script: @the-new-fuse/stripe-provider-bridge:dev -> STRIPE_PROVIDER
- Checking script: @the-new-fuse/stripe-provider-bridge:dev -> STRIPE_PROVIDER_P
- verify).els List available model/provider information.cost
- verify).els List available model/provider information.cost a
- Please update the tnf cli LLM PROVIDER/MODEL LIST with what you have:
- Provider: nvidia Model: minimaxai/minimax-m3
- Checking script: @the-new-fuse/stripe-provider-bridge:dev ->
- Sending 4 messages after interrupt: 'Checking script:
  @the-new-fuse/jules-integration:d...'
- Checking script: @the-new-fuse/jules-integration:dev -> tsc -b --watch

### Governance

- The MCP version of my probe is incompatible with their protocol
- OPERATOR POLICY:
- TNF Protocol Pre-Flight Checks
- Protocol: Turn Zero Mandate
- Status: ACTIVE Protocol ID: TNF_TURN_ZERO_CANONICAL
- Step 2: Reading frontload policy files...
- Step 4: Verifying integrity...
- Protocol references validated
- Protocol: Living State Sync
- Protocol: Procedural Disclosure
- [Procedural Disclosure] Checking protocol alignment...
- Protocol: Session Handoff
- Protocol: Knowledge Tree Integrity
- Protocol: Integration Verification
- Protocol Check Summary
- Core Protocols: 49 protocol files
- model-watchdog, provider-probe-gate
- ]0d879ecf5 from lama-3.1-8b-instructmos-reason2-8b-content-safety

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.019
- Verification Difficulty: Hard

## Synthesis

Artifact captures 20 procedural, 17 strategic, and 18 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.
