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

### TNF CLI as Local Sub-Director (default)

After OSS install / onboard / boot, TNF endows the local CLI as **Local
Sub-Director** and establishes the core federated fleet (Redis, harness
heartbeats, Subdirector workers, launchd agents). Cloud Super Director sync
stays optional until a cloud Redis URL is configured.

```bash
# Recommended install path
bash scripts/install-tnf-cli.sh --from-local

# Or explicitly
pnpm run tnf:onboard
# / node scripts/runtime/establish-core-federated-fleet.cjs
# / tnf fleet establish

# Verify
tnf fleet core-status
bash scripts/runtime/local-subdirector-service.sh status
```

Skip with `TNF_SKIP_CORE_FLEET=1`. Identity lands in `~/.tnf/agent.yaml` and
`~/.tnf/local-subdirector/identity.env`.

Use `.tnf.local.env` for machine-specific assets such as `TNF_ROOT`,
`TNF_RELAY_URL`, custom `TNF_PORTS`, and intentional occupied-port allowances.
See `docs/reference/local-runtime-profile.md`.

### Current LLM provider/model selection

The CLI reads TNF's canonical 22-provider catalog, bundles that catalog in the
installable package, and refreshes model lists from provider APIs where the
provider exposes one. Use the interactive picker to choose and persist a default
model:

```bash
tnf provider list
tnf models openrouter --refresh
tnf models --select # arrows, PageUp/PageDown, type-to-filter, Enter
```

If a provider is offline or has no configured key, TNF keeps its durable catalog
entries visible and reports that live discovery was unavailable rather than
silently presenting an empty menu. See `docs/UNIFIED_LLM_CATALOG.md`.
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

TNF is developed in the private combined monorepo `whodaniel/tnf-monorepo` and
published to two downstream repos. Do not commit directly to the publication
targets.

- `whodaniel/tnf-monorepo` — private development (all source)
- `whodaniel/The-New-Fuse` — public open-runtime publication (~90%)
- `whodaniel/fuse-control-plane` — private control-plane extract (~10%)

This public clone is the open runtime. If you have monorepo access, develop
there. Scaffolding map: `docs/lineage/PRODUCT_REPO_MAP.md`. See
`docs/REPO_SEPARATION.md` for the public/private boundary. Use the dry-run sync
before publishing downstream repositories:

```bash
pnpm run sync:repos:dry-run
```

Product doctrine for future work lives in
`docs/product/TNF_PRODUCT_BOUNDARY.md`: classify each new artifact as public OSS
runtime, public contract, private SaaS control plane, separate satellite, or
personal/client business material before it lands.

Current engineering reconciliation and external-gate status is recorded in
`docs/operations/CANONICAL_RECONCILIATION_STATUS_2026-08-21.md`.
Canonical-only boundary and declaration checks are repository-scoped in CI;
the generated public overlay validates its own runtime surface and must never
be treated as a second monorepo source.

Satellite repositories declare their runtime boundary with the versioned
`tnf-extension.json` contract documented in
`docs/extensions/TNF_EXTENSION_MANIFEST_V1.md`. Only manifests classified as
`loadable-extension` are accepted by `tnf plugins install`.

Member storage doctrine lives in
`docs/product/TNF_MEMBER_DATA_STORAGE_BOUNDARY.md` and
`docs/product/TNF_PERSONAL_DATA_LOCATION_REGISTRY.md`: TNF stores bounded
working artifacts, indexes, and consented external-location references. Durable
member docs and media should stay in Google Drive, another connected storage
provider, customer object storage, or a private repository.

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
