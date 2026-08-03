<img src="https://thenewfuse.com/assets/brand/tnf-logo.png" alt="The New Fuse" width="80" height="80" align="left">

# The New Fuse

> **The AI agent orchestration platform.** Build, coordinate, and operate
> multi-agent systems across desktop, web, and cloud with MCP and A2A protocols.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js 20.20+](https://img.shields.io/badge/Node.js-20.20+-green.svg)](https://nodejs.org/)
[![pnpm 10](https://img.shields.io/badge/pnpm-10.22-orange.svg)](https://pnpm.io/)

---

## Canonical repository

**Develop here:**
[`whodaniel/The-New-Fuse`](https://github.com/whodaniel/The-New-Fuse)

Historical slug `the-new-fuse-next-gen` GitHub-redirects (301) to this repo.

Published distribute targets (do not commit there directly):

- [`The-New-Fuse`](https://github.com/whodaniel/The-New-Fuse) — ~90%
  open runtime
- [`fuse-control-plane`](https://github.com/whodaniel/The-New-Fuse-control-plane) —
  proprietary slice

See [`docs/REPO_SEPARATION.md`](./docs/REPO_SEPARATION.md).

---

## Local development

Prerequisites: **Node.js ≥ 20.20** (see `.nvmrc`), **pnpm 10.22.x**, Redis 7+,
PostgreSQL 17+ for full API flows.

```bash
git clone https://github.com/whodaniel/The-New-Fuse.git
cd The-New-Fuse
pnpm install
cp .env.example .env
touch .tnf.local.env
pnpm run dev
```

CLI / ports:

```bash
./tnf ports status
./tnf ports preflight
pnpm run release:gate
```

Primary workspaces: `apps/frontend`, `apps/api`, `apps/api-gateway`,
`packages/tnf-cli`, `packages/relay-core`.

Package workspace name for core types/services: `@the-new-fuse/core`
(`packages/core`). Prefer reading that package's exports over marketing snippets
— agent harness entrypoints live across `packages/core`, `packages/tnf-core`,
`packages/relay-core`, and `packages/tnf-cli`.

---

## Self-hosting (open runtime)

```bash
git clone https://github.com/whodaniel/The-New-Fuse.git
cd The-New-Fuse
pnpm install
pnpm run dev
```

---

## Docs & security

- Site: [thenewfuse.com](https://thenewfuse.com)
- App: [app.thenewfuse.com](https://app.thenewfuse.com)
- Agent ops: [`AGENTS.md`](./AGENTS.md),
  [`docs/protocols/DIRECTIVES.md`](./docs/protocols/DIRECTIVES.md)
- Security: `security@thenewfuse.com`

## License

MIT — see [`LICENSE`](./LICENSE).
