# TNF Product Boundary

> Status: Active product doctrine
>
> Purpose: Keep TNF development pointed at a long-term professional open-source
> distribution and a private hosted SaaS control plane.

## North Star

TNF is built as two durable products that share contracts, vocabulary, and
release discipline:

| Product              | Visibility | Primary user                                                | Must contain                                                                                                                                                  | Must not contain                                                                                                                                          |
| -------------------- | ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open-source TNF      | Public     | Local operators, developers, teams running their own agents | Portable runtime, CLI, app form factors, relay primitives, MCP/A2A contracts, extension points, safe stubs for unavailable hosted authority                   | Secrets, operator-machine state, private customer data, proprietary orchestration policy, billing/entitlement enforcement, hosted-only director authority |
| TNF SaaS server side | Private    | thenewfuse.com hosted customers and operators               | Director authority, tenant isolation, billing and entitlement enforcement, hosted orchestration policy, private control-plane services, production operations | Public-only demo assumptions, local operator shortcuts, client artifacts that belong in private storage, code that should be a reusable OSS contract      |

The public project should feel complete and professional without needing the
private server implementation. The private server side should extend the public
runtime through explicit contracts, not by leaking hidden dependencies into the
open codebase.

## Default Classification Rule

Every new TNF artifact must be classified before it lands:

| Classification                         | Where it belongs             | Rule                                                                                                                                                                                                       |
| -------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regular OSS runtime                    | Public export                | Needed for local install, public CLI, supported app form factors, relay, MCP/A2A, developer extension APIs, or documentation that helps public users run TNF.                                              |
| Public contract for private capability | Public export                | Types, interfaces, schemas, no-op stubs, and docs that explain how the private SaaS side integrates without exposing proprietary implementation.                                                           |
| Private SaaS control plane             | Private control-plane export | Tenant authority, hosted orchestration policy, billing, entitlements, customer operations, production-only coordination, or implementation that creates the hosted moat.                                   |
| Separate satellite                     | Separate distribution lane   | Games, demos, optional integrations, experiments, vendor/research checkouts, and products that are not part of the default TNF runtime.                                                                    |
| Personal or client business artifact   | Outside TNF source control   | Client briefs, strategy memos, working trackers, private research, personal data, or commercial prospecting files. Store these in a private cloud drive or private repository, not in the public TNF tree. |

When classification is unclear, default to the smallest public contract plus a
private implementation behind it. Do not make public code depend on private
source paths.

## Public Open-Source Standard

The open-source distribution should optimize for:

- A clean first-run path with documented prerequisites and health checks.
- Portable source paths with no absolute operator-machine assumptions.
- MIT-licensed reusable packages and app form factors.
- Clear degraded behavior when hosted control-plane authority is absent.
- Verifiable release gates before publication.
- Human-readable docs plus machine-readable boundary data.

The current regular OSS app list is defined by
`data/distribution/oss-app-boundary.json` and summarized in
`docs/packaging/OSS_APP_BOUNDARY.md`. Which GitHub repo is canonical for each
product lives in `docs/lineage/PRODUCT_REPO_MAP.md` and
`data/distribution/product-repo-map.json`.

Related products that are **not** the TNF runtime download:

- `SkIDEancer` — TNF-adjacent Cloud IDE (own public repo)
- `EXTREAMIX` — standalone streaming product
- `LPM-Standalone` — localhost port monitor
- `MyPhone-Remote` — standalone product satellite; API is `tnf-myphoneremote-api`
- `ai-arcade` — standalone product satellite
- `casin8-games` — standalone product satellite
- `poker-room` — standalone product satellite

Do not fold those into `apps/` or into a packed TNF-Extensions GitHub repo.

## Private SaaS Standard

The private hosted layer should optimize for:

- Tenant separation, auditability, and server-side enforcement.
- Hosted control-plane authority that never relies on frontend hiding.
- Billing and entitlement checks enforced server-side.
- Operational observability, rollback paths, and production runbooks.
- Contract compatibility with the public runtime.
- No duplicated public runtime logic unless the duplication is a deliberate
  adapter or deployment wrapper.

The authoritative public/private source split is documented in
`docs/REPO_SEPARATION.md` and enforced by `scripts/sync-repos.sh`.

Member data storage has a separate boundary:
`docs/product/TNF_MEMBER_DATA_STORAGE_BOUNDARY.md`. Supabase should hold product
metadata, indexes, references, and bounded working-set artifacts; it is not a
member cloud drive. The companion location registry is
`docs/product/TNF_PERSONAL_DATA_LOCATION_REGISTRY.md`; it stores where each
user's durable docs and media live, not the docs and media themselves.

## Offload Rule for Personal Business Markdown

Markdown files created for personal business development, client strategy,
prospecting, UHNW service design, or similar non-TNF source work do not belong
in the TNF public distribution or private SaaS codebase by default.

Use this order of preference:

1. Private Google Drive or another private cloud drive.
2. Private GitHub repository when version history, issues, or code-adjacent
   collaboration are needed.
3. Local staging only as a temporary holding area until cloud sync is available.

Only move one of these artifacts into TNF documentation if it has been rewritten
as product-neutral TNF documentation and classified under the table above.

## Change Gate

Before merging or publishing a change that touches the boundary:

1. Classify every changed path.
2. Update `data/distribution/oss-app-boundary.json` when app membership changes.
3. Update `scripts/sync-repos.sh` when private extraction or public exclusion
   changes.
4. Add or update stubs/contracts for private functionality needed by the public
   runtime.
5. Run the relevant dry-run and leakage gates:

```bash
node scripts/packaging/check-oss-app-boundary.cjs
node scripts/packaging/check-product-repo-map.cjs
node scripts/product/check-member-storage-policy.cjs
node scripts/product/check-personal-data-location-policy.cjs
pnpm run sync:repos:dry-run
pnpm run lineage:verify-export
pnpm run lineage:check-leakage
```

Do not use a successful local boot as proof that a change is distributable.
Distribution readiness requires the boundary checks above.
