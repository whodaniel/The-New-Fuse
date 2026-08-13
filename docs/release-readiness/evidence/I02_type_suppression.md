# Evidence: I02 — Type-suppression cleanliness

## Probes
```
rg --count-matches "@ts-ignore" apps/   # → 159 lines across files
rg --count-matches "@ts-ignore" packages/  # → 135 lines across files
rg --count-matches "@ts-nocheck" apps/ packages/  # → 493 lines across 491 files
```

## Result (2026-06-19T10:11Z)

```
@ts-ignore total (apps + packages): 294
@ts-nocheck total in 491 files
@ts-nocheck concentration:
  packages/ui-consolidated/src/css.d.ts
  packages/api/src/types/shims.ts
  packages/jules-skill/src/{client,index,types}.d.ts
  packages/relay-core/src/**/*.d.ts (declaration stubs)
  packages/workflow-engine/src/**/*.d.ts
```

49 of 51 hits in `node_modules` are `apps/external/ai_instruction_research/tmp_skill_repos/` — vendored dependency research, should be excluded from CI.

## Verdict

- `@ts-nocheck` is widely used in `.d.ts` stub files (legal in declaration-only files but aggressive in package bodies).
- `@ts-nocheck` in real source files: limited to `packages/api/src/types/shims.ts` (acknowledged).
- `@ts-ignore` count is within reach of ≤ 50 with focused remediation.

## Action

1. ESLint rule `@typescript-eslint/ban-ts-comment` for `*.ts`, `*.tsx` real sources (not in declaration files matching pattern `*.d.ts`).
2. Add `.eslintignore` for `apps/external/`, `node_modules/`, `dist/`.
3. Track top 20 `@ts-ignore` files by usage frequency; remediate in batches.

Note: the standalone `@ts-nocheck` count of 491 is largely legal stubs; the gate must distinguish subclass A (`.d.ts` stubs) vs subclass B (real sources).
