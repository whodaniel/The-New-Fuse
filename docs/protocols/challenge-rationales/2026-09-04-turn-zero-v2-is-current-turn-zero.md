# Turn Zero means Turn Zero V2 on session entry — 2026-09-04

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:CHALLENGE_RATIONALE] [VISIBILITY:COLLECTIVE]`

- file: docs/protocols/TURN_ZERO_MANDATE.md
- file: docs/core/AGENTS.md
- file: docs/core/FRONTLOAD_MANIFEST.md
- doc_hash_mandate:
  sha256:dde4dd6143da0241fe4139c50eb9e175f983a59d627b0ea8858e52ab5cc44f79
- doc_hash_agents:
  sha256:4857edbc89c8eb0dd1c519a260fbd2b09b6cb067e88c21469589780cd7a4b2bd
- doc_hash_manifest:
  sha256:0b4b12902f578aeae031033be5e18596b8cbb4e5e2e09aff524f561bd01f0d37
- authority_tier: operator-directed protocol clarity on session-entry surfaces.

## Assumption challenged

That “Turn Zero” and “Turn Zero V2” could be treated as distinct or ambiguous
entry protocols, and that a worktree-local copy of
`scripts/protocols/turn-zero-v2-gate.cjs` (for example under
`lane4-video-extraction`) could be cited as the protocol source of truth.

## Evidence

1. Operator correction (2026-09-04): Turn Zero V2 is foundational canonical TNF
   protocol logic — not video-lane owned and not branch-scoped.
2. A host session (Kilo) cited
   `~/.tnf/worktrees/lane4-video-extraction/scripts/protocols/turn-zero-v2-gate.cjs`
   as the key file, conflating a checkout shadow with authority.
3. Session surfaces still mixed retired “await confirmation” paste rituals with
   the manifest-derived onboard path (issue #176), so agents did not reliably
   see “Turn Zero V2” as the current Turn Zero.

## Change authorized

- Lock alias law into `TURN_ZERO_MANDATE.md`: **Turn Zero means Turn Zero V2**.
- Align Stage A / status / onboard / AGENTS / FRONTLOAD / harness skills /
  marketplace rule+command with that naming.
- Gate receipt prints foundational scope + `repoRoot`.
- Lesson: `docs/protocols/lessons/2026-09-04-turn-zero-v2-not-lane-scoped.md`.

No lifecycle reordering. No competing Stage A inventory. Executable remains
`scripts/protocols/turn-zero-v2-gate.cjs` via `pnpm run tnf:onboard`.
