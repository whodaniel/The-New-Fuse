# Cursor Agent top-level guides — 2026-08-11

`[CLASS:INTEL] [STATUS:VERIFIED]`

Branch: `fix/cursor-agent-toplevel-guides`

Reference: `cursor-agent` **2026.08.04-aaa8809**

## Verdict

Help-surface audit vs live `cursor-agent --help` is **100%** (17 commands / 24
root options, **0** gaps).

Metric coverage was already 100% on the full TNF tree (`ls` via nested aliases,
`worker` via plural `workers`). Remaining gap was **top-level UX**: `tnf ls` /
`tnf worker` did not resolve.

## Changes

`packages/tnf-cli/src/commands/peer-cli-parity-gaps.ts`:

- Guides: `ls` (session list / resume), `worker` (authority workers / fleet)
- Cursor root option markers: `--worktree [name]`, `--yolo`; `--worktree-base`
  description aligned to branch/ref

## Verify

```bash
pnpm exec tsx packages/tnf-cli/scripts/cursor-parity-verify.mts
# or, when CLI deps boot:
pnpm exec tsx packages/tnf-cli/src/cli.ts ls
pnpm exec tsx packages/tnf-cli/src/cli.ts worker
pnpm exec tsx packages/tnf-cli/src/cli.ts parity audit --agents cursor-agent
```
