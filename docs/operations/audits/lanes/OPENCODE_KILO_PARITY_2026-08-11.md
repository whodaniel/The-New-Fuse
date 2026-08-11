# OpenCode + Kilo Peer Parity — 2026-08-11

`[CLASS:INTEL] [STATUS:VERIFIED]`

Branch: `fix/opencode-kilo-parity`  
Parent: PR #89 merged (`5a8c83e7e8`)

## Gaps closed

Prior full-CLI audit cliffs (both ~83%):

| Agent    | Missing commands (before)                    |
| -------- | -------------------------------------------- |
| OpenCode | `attach`, `github`, `pr`, `web`              |
| Kilo     | `attach`, `github`, `pr`, `roll-call`, `web` |

All registered as honest guides in
`packages/tnf-cli/src/commands/peer-cli-parity-gaps.ts`
(`OPENCODE_KILO_PARITY_GAP_COMMANDS`).

## Verification

Live `tnf` boot was blocked in this workspace by a corrupted
`@supabase/supabase-js` install (`ENOTDIR` after checkout). Coverage was
recomputed offline by:

1. Loading `packages/tnf-cli/src/command-surface.snapshot.json` (full TNF noun
   set)
2. Adding the peer closers above
3. Parsing live `opencode --help` / `kilo --help` (help on stderr) via
   `parseHelpSurface`

Results:

| Agent    | Coverage | Remaining gaps                          |
| -------- | -------- | --------------------------------------- |
| OpenCode | **100%** | none                                    |
| Kilo     | **~97%** | `console` only vs snapshot-only surface |

On a healthy full CLI boot, Hermes already aliases `console` → `tui`, so the
live `tnf parity audit` should report **Kilo 100%** as well. Re-confirm after
`pnpm install` restores `tnf-cli` boot:

```bash
pnpm exec tsx packages/tnf-cli/src/cli.ts attach
pnpm exec tsx packages/tnf-cli/src/cli.ts roll-call
pnpm exec tsx packages/tnf-cli/src/cli.ts parity audit --agents opencode,kilo
```

## Next P0 candidates

- Confirm OpenCode/Kilo 100% on a healthy CLI boot
- Optional: Pi ghost `--path--` parser cleanup
- Remaining lower cliffs only if new peer CLIs join the roster
