# @the-new-fuse/protocol-contracts

Workspace package in The New Fuse monorepo.

|              |                                    |
| ------------ | ---------------------------------- |
| **npm name** | `@the-new-fuse/protocol-contracts` |
| **path**     | `packages/protocol-contracts`      |

```bash
pnpm --filter @the-new-fuse/protocol-contracts build
```

See the monorepo root [`README.md`](../../README.md) and
[`docs/REPO_SEPARATION.md`](../../docs/REPO_SEPARATION.md).

## Build Fragility Note (2026-08-05)

`tsconfig.tsbuildinfo` can become stale after partial cleanups or branch
switches, causing `pnpm run build` (which invokes `tsc -b`) to silently emit
nothing because TypeScript's incremental mode thinks the project is up-to-date.
If downstream packages (e.g. `relay-core`) report
`TS2307: Cannot find module '@the-new-fuse/protocol-contracts'` even though the
package builds without errors, delete the stale buildinfo and rebuild:

```bash
rm -f packages/protocol-contracts/tsconfig.tsbuildinfo
pnpm --filter @the-new-fuse/protocol-contracts build
```

This package's `dist/` is gitignored (unlike `relay-core/dist/`), so downstream
consumers must have a fresh `dist/` present at runtime.
