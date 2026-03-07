# Legacy AIVI Integration Into TNF

This directory contains the full source tree from:

`/path/to/Projects/ai-studio-automator`

It is integrated into TNF as a first-class module source for reference, reuse,
and execution from the TNF monorepo scripts.

## What Is Included

- Extension UI/background/content scripts (`popup.*`, `background.js`,
  `content-scripts/*`)
- Service layer (`services/*`)
- CLI tools (`cli/*`)
- Backend app (`backend/*`)
- Docs, plans, and operational guides (`*.md`, `docs/archive/*`)
- Assets and store submission materials (`assets/*`, `icons/*`)
- Utilities and scripts (`tools/*`, `scripts/*`, `lib/*`, `src/*`)

## TNF Script Wiring

From repo root:

- `pnpm run tnf:aivi:inventory`
- `pnpm run tnf:aivi:docs:index`
- `pnpm run tnf:aivi:backend:install`
- `pnpm run tnf:aivi:backend:start`
- `pnpm run tnf:aivi:backend:dev`
- `pnpm run tnf:aivi:cli:status`

From `apps/chrome-extension`:

- `pnpm run aivi:inventory`
- `pnpm run aivi:docs:index`
- `pnpm run aivi:backend:install`
- `pnpm run aivi:backend:start`
- `pnpm run aivi:backend:dev`
- `pnpm run aivi:cli:status`

## TNF Services Tab

TNF Services tab is adapted to follow the original AIVI queue/history workflow
while remaining in TNF style and runtime architecture.
