# Jules + Cursor Agent Peer Parity — 2026-08-11

`[CLASS:INTEL] [STATUS:VERIFIED]`

Branch: `fix/jules-cursor-parity`  
Parent: PR #87 merged (`b51820843f`)

## Coverage

| Agent          | Before | After             |
| -------------- | ------ | ----------------- |
| Jules          | 38%    | **100%** (0 gaps) |
| cursor-agent   | 59%    | **100%** (0 gaps) |
| Mean (8 avail) | ~83%   | **96%** (10 gaps) |

TNF surface after close: **326** commands, **134** root options.

## Changes

Extended `packages/tnf-cli/src/commands/peer-cli-parity-gaps.ts`:

- Jules: `new`, `teleport` guides +
  `--apply/--assignee/--json/--limit/--parallel/--repo`
- Cursor Agent: `about`, `bedrock`, `create-chat`, `generate-rule`,
  `install-shell-integration`, `uninstall-shell-integration` guides + remaining
  root option markers (`--approve-mcps`, `--auto-review`, `--endpoint`, …)

## Verify

```bash
pnpm exec tsx packages/tnf-cli/src/cli.ts about
pnpm exec tsx packages/tnf-cli/src/cli.ts new
pnpm exec tsx packages/tnf-cli/src/cli.ts parity audit --agents jules,cursor-agent
```

## Next P0 candidates

Remaining cliffs: OpenCode / Kilo (~83%, attach/github/pr/web) and Pi ghost
`--path--`.
