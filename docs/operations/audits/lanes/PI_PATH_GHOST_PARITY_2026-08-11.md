# Pi `--path--` Ghost Flag Fix — 2026-08-11

`[CLASS:INTEL] [STATUS:VERIFIED]`

Branch: `fix/pi-path-ghost-parity`

## Problem

Pi help examples include placeholder paths like:

```text
pi --export ~/.pi/agent/sessions/--path--/session.jsonl
```

`parseHelpSurface` harvested `--path--` from non-option prose, leaving Pi at
**98%** (1 fake option gap) after all real peer cliffs were closed.

## Fix

Added `isPlausibleLongOption()` in
`packages/tnf-cli/src/services/ParityService.ts` and applied it to both
usage-line and option-section long-flag harvesting.

Rejects tokens that are not well-formed kebab long options (trailing `-`,
internal `--`, etc.).

## Live verify

```bash
pnpm exec tsx packages/tnf-cli/src/cli.ts parity audit --agents pi
```

| Metric             | Result                         |
| ------------------ | ------------------------------ |
| Pi                 | **100%** (0 gaps)              |
| Mean (8 available) | **100%** (**0** open gaps)     |
| TNF surface        | 331 commands, 134 root options |

Also confirmed in the same run: Claude, Codex, OpenCode, Kilo, Jules, Hermes,
cursor-agent all **100%**.
