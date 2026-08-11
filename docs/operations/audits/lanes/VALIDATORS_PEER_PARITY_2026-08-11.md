# Validators + Claude/Pi/Codex Peer Parity — 2026-08-11

`[CLASS:INTEL] [STATUS:VERIFIED]`

Branch: `fix/validators-peer-parity`

## Validators (restore / harden — not recreate)

Audit claimed validators were missing; they already existed as stubs. Hardened:

| Script                                        | Change                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `scripts/handoff-pre-validator.js`            | Validates `SESSION_HANDOFF_LATEST.json` against schema (Ajv + fallback) |
| `scripts/handoff-pre-validator.cjs`           | Same SESSION_HANDOFF check; director cycle age is soft/warn-only        |
| `scripts/validation/validate-architecture.js` | Real FS/schema scoring (no hardcoded 95% stubs); avg **100%** on repo   |

Verify:

```bash
node scripts/handoff-pre-validator.js
node scripts/validation/validate-architecture.js
```

## Peer CLI parity (Claude / Pi / Codex)

New module: `packages/tnf-cli/src/commands/peer-cli-parity-gaps.ts`  
Wired from `packages/tnf-cli/src/cli.ts` after Hermes gap closers.

| Agent              | Before         | After                           |
| ------------------ | -------------- | ------------------------------- |
| Claude             | 20%            | **100%** (0 gaps)               |
| Codex              | 42%            | **100%** (0 gaps)               |
| Pi                 | 24%            | **98%** (ghost `--path--` only) |
| Hermes             | 100%           | 100% (unchanged)                |
| Mean (8 available) | 52% / 159 gaps | **83%** / **35** gaps           |

TNF surface after close: **318** commands, **117** root options.

Pi residual `--path--` is a help-parser ghost (invalid flag token);
intentionally not registered.

## Verify

```bash
pnpm exec tsx packages/tnf-cli/src/cli.ts parity audit
pnpm exec tsx packages/tnf-cli/src/cli.ts features
pnpm exec tsx packages/tnf-cli/src/cli.ts setup-token
```

## Next P0 (operator-selected)

Raise **Jules** + **cursor-agent** parity (largest remaining coverage cliffs:
38% / 59%).
