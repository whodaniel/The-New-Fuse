# OpenCode + Kilo Peer Parity — 2026-08-11

`[CLASS:INTEL] [STATUS:VERIFIED]`

Branch: `fix/opencode-kilo-parity` (merged as PR #90 → `9a05179b92`)

## Gaps closed

Prior full-CLI audit cliffs (both ~83%):

| Agent    | Missing commands (before)                    |
| -------- | -------------------------------------------- |
| OpenCode | `attach`, `github`, `pr`, `web`              |
| Kilo     | `attach`, `github`, `pr`, `roll-call`, `web` |

All registered as honest guides in
`packages/tnf-cli/src/commands/peer-cli-parity-gaps.ts`
(`OPENCODE_KILO_PARITY_GAP_COMMANDS`).

## Live verification (2026-08-11T15:03Z)

Repaired local `@supabase/supabase-js` link under
`packages/tnf-cli/node_modules` (symlink → repo-root hoisted package), then:

```bash
pnpm exec tsx packages/tnf-cli/src/cli.ts attach
pnpm exec tsx packages/tnf-cli/src/cli.ts roll-call
pnpm exec tsx packages/tnf-cli/src/cli.ts parity audit --agents opencode,kilo
```

| Metric             | Result                                 |
| ------------------ | -------------------------------------- |
| OpenCode           | **100%** (0 gaps)                      |
| Kilo               | **100%** (0 gaps)                      |
| Mean (8 available) | **100%** (1 open gap total)            |
| Remaining peer gap | Pi **98%** — ghost `--path--` only     |
| TNF surface        | **331** commands, **134** root options |

Also at 100%: Claude, Codex, Jules, cursor-agent, Hermes.

## Next P0

Fix Pi help-parser ghost `--path--` (only remaining tracked peer gap).
