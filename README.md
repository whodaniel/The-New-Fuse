# The New Fuse

The New Fuse is an AI agent orchestration platform for building, coordinating,
and operating multi-agent workflows.

- Public site: https://thenewfuse.com
- Hosted app: https://app.thenewfuse.com
- Public docs: https://thenewfuse.com/docs

## Local Development

Prerequisites:

- Node.js matching `.nvmrc`
- pnpm 10+
- Redis 7+
- PostgreSQL 17+ for full API/database flows

```bash
git clone https://github.com/whodaniel/fuse-open-runtime.git
cd fuse-open-runtime
pnpm install
cp .env.example .env
touch .tnf.local.env
pnpm run dev
```

Use `.tnf.local.env` for machine-specific assets such as `TNF_ROOT`,
`TNF_RELAY_URL`, custom `TNF_PORTS`, and intentional occupied-port allowances.
See `docs/reference/local-runtime-profile.md`.

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

TNF is developed in this combined monorepo and published into downstream
distribution repositories:

- `whodaniel/fuse-open-runtime`: open-source runtime distribution
- `whodaniel/fuse-control-plane`: proprietary hosted SaaS control plane

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

The open runtime license is declared in the downstream public distribution. Do
not assume the combined monorepo is the final open-source artifact; verify
`docs/REPO_SEPARATION.md` and the downstream repository before public release.
