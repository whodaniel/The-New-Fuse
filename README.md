# <img src="https://thenewfuse.com/assets/brand/tnf-logo.png" alt="TNF Logo" width="32" height="32" align="center"> The New Fuse

**The New Fuse (TNF)** is the definitive next-generation AI agent orchestration
platform. Built for performance, security, and true autonomy, TNF empowers you
to build, coordinate, and operate complex multi-agent workflows across desktop,
web, and cloud.

- **Public Site:** [thenewfuse.com](https://thenewfuse.com)
- **Hosted App:** [app.thenewfuse.com](https://app.thenewfuse.com)
- **Documentation:** [thenewfuse.com/docs](https://thenewfuse.com/docs)
- **GitHub Repository:**
  [whodaniel/The-New-Fuse](https://github.com/whodaniel/The-New-Fuse)

## Local Development

Prerequisites:

- Node.js matching `.nvmrc`
- pnpm 10+
- Redis 7+
- PostgreSQL 17+ for full API/database flows

```bash
git clone https://github.com/whodaniel/The-New-Fuse.git
cd The-New-Fuse
pnpm install
cp .env.example .env
touch .tnf.local.env
pnpm run dev
```

Use `.tnf.local.env` for machine-specific assets such as `TNF_ROOT`,
`TNF_RELAY_URL`, custom `TNF_PORTS`, and intentional occupied-port allowances.
See `docs/reference/local-runtime-profile.md`.

For using the **local open-source install** together with a **thenewfuse.com
account**, see `docs/reference/local-oss-with-hosted-account.md`.

Before booting local services, inspect the active port surface:

```bash
./tnf ports status
./tnf ports preflight
```

Run the release gate before publishing or deploying:

```bash
pnpm run release:gate
pnpm run release:gate:strict
```

## Public Release Flow

TNF is developed and published from a single public monorepo:
`whodaniel/The-New-Fuse`.

- `whodaniel/The-New-Fuse`: Open-source runtime distribution and application
  code.
- Proprietary SaaS control plane infrastructure is maintained privately.

See `docs/REPO_SEPARATION.md` for the public/private boundary. Use the dry-run
sync before publishing downstream repositories:

```bash
pnpm run sync:repos:dry-run
```

## Primary Workspaces

- `apps/frontend`: React/Vite public site and app shell
- `apps/api`: API server
- `apps/api-gateway`: API gateway
- `packages/tnf-cli`: local CLI entrypoint
- `packages/relay-core`: relay and orchestration runtime primitives

## Security

Security reports should go to `security@thenewfuse.com`. Do not publish secrets,
tokens, credentials, private customer data, or unreleased proprietary control
plane details in public issues.

## License

This repository is licensed under the **MIT License** — see [LICENSE](LICENSE).

Proprietary control-plane paths are filtered when publishing
[`The-New-Fuse`](https://github.com/whodaniel/The-New-Fuse); see
`docs/REPO_SEPARATION.md`.
