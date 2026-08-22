# TNF / Claude Project Harness Pointer

Canonical TNF authority lives in-repo. This file is a pointer, not a copied Turn Zero stack.

## Required Session Entry

From the TNF repository root:

```bash
pnpm run tnf:onboard -- --task "<current task if known>"
```

`docs/core/FRONTLOAD_MANIFEST.md` is the only Stage A rail inventory. `docs/protocols/TURN_ZERO_MANDATE.md` governs lifecycle/write readiness.

Do not use `scripts/tnf-onboard.cjs` as the normal entrypoint; it is legacy diagnostics only.

For nontrivial engineering, load `.agent/skills/tnf-engineering-context/SKILL.md`. Before overlapping code changes, inspect current branches/PRs/handoffs and respect active package/workstream ownership.

After context compaction/provider substitution/repo movement/rail-hash change, rerun onboarding.

Operating discipline: **Inspect → Act → Verify**.

See `docs/claude.md` for broader project conventions.
