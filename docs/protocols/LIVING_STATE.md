# LIVING_STATE.md — TNF Open Runtime State Projection

`[CLASS:PRIME] [STATUS:SYNCHRONIZED] [VISIBILITY:PUBLIC]`

<!-- CURRENT_DIRECTIVE:START -->
**Current Directive:** Preserve the TNF open agent as a locally capable protocol participant while enforcing the Founder-IP/Open-Protocol boundary: public logical rails and gateways remain available; proprietary hosted decision procedures do not belong in the open distribution.
<!-- CURRENT_DIRECTIVE:END -->

## Current public-runtime invariants

- The open agent semantic kernel is:
  `Intent · Authority · Context · Capability · Boundary · Action · Receipt · Handoff`.
- The public lifecycle is:
  `RESPOND → ORIENT → CLASSIFY → HYDRATE → STAFF → ACT → VERIFY → PROPAGATE → HANDOFF`.
- `.agent/SYSTEM_PROMPT.md`, `TNF_INTEROPERABILITY_KERNEL.md`, `TNF_OPEN_AGENT_CORE.md`, `TURN_ZERO_MANDATE.md`, and `FRONTLOAD_MANIFEST.md` form the current public logical rail.
- `pnpm run tnf:onboard` must verify that rail before claiming TNF onboarding.
- The open runtime remains locally useful without private TNF source or the hosted SaaS.
- Capability never implies authority.
- Context is task-scoped and freshness-aware.
- Shared mutation requires ownership/collision awareness appropriate to the resource.
- Verification outranks narrative.
- Private/restricted context and `private_control_plane` implementation do not belong in the public runtime.

## Public repository role

`whodaniel/The-New-Fuse` is the official open-source runtime source/distribution repository. Open-source users may run, inspect, modify, fork, and contribute to the public runtime.

TNF's internal release process may use a separate private canonical development source, but the open runtime does not require access to that source in order to function.

## Hosted capability boundary

Hosted TNF may expose optional policy/optimization/authority services through public contracts. When those are absent, the open agent continues under valid local/operator policy, deterministic public fallbacks where appropriate, or explicit defer/deny for the specific operation whose authority is unavailable.

The open agent must not become a thin remote client.

## Current boundary correction

The active public tree is being narrowed where implementation details exceeded what interoperability required. The public semantic/control rail is being strengthened at the same time so IP separation does not remove TNF's open-agent reasoning discipline.

Internal TNF operational ledgers, private invention records, private policy weights, proprietary graph/reachability implementations, and private hosted decision machinery are intentionally not mirrored into this public state projection.

## Next public-runtime checks

1. Verify `node scripts/protocols/open-agent-rail-gate.cjs --no-write` passes.
2. Verify `node scripts/verify-repo-frontload.cjs` passes.
3. Verify `node --test scripts/protocols/open-agent-rail-gate.test.cjs` passes.
4. Verify `pnpm run tnf:onboard -- --task "open runtime protocol check"` completes without private-source dependency.
5. Continue auditing current public code for decision procedures that exceed the minimum interoperability/local-runtime boundary; replace them with public contracts, operator-configurable local policy, or safe public fallbacks without removing the core agent lifecycle.
