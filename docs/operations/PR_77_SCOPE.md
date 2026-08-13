# PR #77 scope groups — `feat/cross-agent-cli-parity`

Purpose: make review / optional split decisions explicit. This file is
documentation only; it does not change runtime behavior.

## Commit groups on this branch (vs `main`)

1. **`fb03bc485a` — pre-commit build gate**  
   Staged typecheck gate so silent `TS2307` / staged-file errors cannot ship
   unnoticed. Independent of CLI parity; could be landed alone.

2. **`2a3e939b82` — URL retarget to `whodaniel/The-New-Fuse`**  
   Docs / agent / Jules / audit string updates. Large diff, low runtime risk.
   Could be a separate chore PR if review wants a thinner parity review.

3. **`083afbc8be` — parity foundation**  
   Collision-safe modules (`status` / `config resolved` / `logs` / `parity` /
   `version` / `sync` / `skills`), `ParityService`, sync-auditor honesty,
   handoff IMMEDIATE_TASKS vs OPERATOR_NOTICES split.

4. **`f54affdfd1` + follow-ups — Hermes gap closers**  
   Aliases + thin wrappers / honest channel entrypoints until Hermes top-level
   **noun** coverage reaches 100% on the auditor. This is **surface parity**,
   not full product parity (Slack/WhatsApp are guides to telegram/openclaw).

## Recommended review order

1. Read `scripts/agents/sync-tnf-cli-with-agents.mjs` coverage formula.
2. Skim `packages/tnf-cli/src/commands/_registry.ts` + `hermes-parity-gaps.ts`.
3. Spot-check `tnf sync`, `tnf parity agents`, `tnf dump`, `tnf slack`.
4. Decide whether URL rewrite / build-gate want to stay bundled or be
   cherry-picked into separate PRs before merge.

## Explicit non-goals (still open work)

Native Slack / WhatsApp / WhatsApp Cloud bots, Hermes pets/skins/pairing product
UX, and deep channel protocol work. Top-level verbs exist so Hermes users are
not bricked; they route to live TNF paths or say what is missing.
