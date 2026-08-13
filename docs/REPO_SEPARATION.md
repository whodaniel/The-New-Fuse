# TNF Repository Separation Architecture

> **Status**: Active — This is the canonical reference for how TNF code is
> distributed across repositories.
>
> **Last Updated**: 2026-08-13 (satellites are per-repo; sync no longer orphans
> public main)

---

## TL;DR for AI Agents

**TNF uses a single combined PRIVATE monorepo for development, with two
downstream publication repos.**

```
whodaniel/tnf-monorepo  (COMBINED MONOREPO, PRIVATE — you develop here)
    │
    ├──► whodaniel/The-New-Fuse        (PUBLIC,  ~90% open-source runtime)
    └──► whodaniel/fuse-control-plane  (PRIVATE, ~10% proprietary control plane)
```

- **NEVER commit directly to `The-New-Fuse` or `fuse-control-plane`.**
- **ALL development happens in `whodaniel/tnf-monorepo`.**
- Run `pnpm run sync:repos` to push changes to both downstream repos.
- The proprietary boundary is defined in `scripts/sync-repos.sh` (the
  `PROPRIETARY_*` arrays).

### ⚠️ Naming was swapped on 2026-07-25

The flagship name `The-New-Fuse` now belongs to the **public** publication repo,
because that is the artifact the world should find. The private development
monorepo is `whodaniel/tnf-monorepo`.

| Name                     | Before 2026-07-25         | After                         |
| ------------------------ | ------------------------- | ----------------------------- |
| `whodaniel/The-New-Fuse` | private combined monorepo | **public** open runtime       |
| `whodaniel/The-New-Fuse` | public open runtime       | _(name retired)_              |
| `whodaniel/tnf-monorepo` | _(did not exist)_         | **private** combined monorepo |

**Any remote still pointing at `whodaniel/The-New-Fuse` for monorepo work is now
aimed at the PUBLIC repo.** Pushing the monorepo there publishes proprietary
code. Check with `git remote -v` and repoint to `tnf-monorepo`. Historical slugs
`The-New-Fuse` and `the-new-fuse-next-gen` refer to the pre-swap layout.

---

## Why This Architecture

TNF is an open-source multi-agent AI orchestration platform with a small
proprietary layer that powers the hosted SAAS offering. The split is:

| Layer                    | Visibility | Purpose                                                        |
| ------------------------ | ---------- | -------------------------------------------------------------- |
| **Open Runtime** (~90%)  | Public     | Core platform, packages, UI, relay, agents, tools              |
| **Control Plane** (~10%) | Private    | Director authority, orchestration policy, billing/entitlements |

We develop in a single monorepo because:

1. **Cross-cutting changes** — A feature often touches both public packages and
   private orchestration. One commit, one PR.
2. **Tooling** — pnpm workspaces, turbo pipeline, IDE workspace, agent configs
   are all calibrated for the monorepo.
3. **Solo developer + AI agents** — No team boundary justifies repo-level
   separation during development.

For product-level classification rules before code lands, see
[`docs/product/TNF_PRODUCT_BOUNDARY.md`](product/TNF_PRODUCT_BOUNDARY.md).

---

## Repository Map

### `whodaniel/tnf-monorepo` — Combined Private Monorepo

This is where you work. It contains the open-source runtime, the proprietary
control-plane sources, and everything published to both downstream repos.

```
tnf-monorepo/
├── apps/                       # Regular OSS form factors only
│   ├── api/                    # 🟢 NestJS API server
│   ├── api-gateway/            # 🟢 NestJS gateway
│   ├── backend/                # 🟢 Backend (orchestrator module is stub)
│   │   └── src/modules/
│   │       └── orchestrator/   # 🔴 PROPRIETARY (full impl here, stubbed in open-runtime)
│   ├── frontend/               # 🟢 React frontend
│   ├── relay-server/           # 🟢 WebSocket relay
│   ├── tauri-desktop/          # 🟢
│   ├── vscode-extension/       # 🟢
│   ├── chrome-extension/       # 🟢
│   ├── mcp-servers/            # 🟢
│   └── extensions → ../../TNF-Extensions   # local clones; not a packaged offering
```

Satellite apps (games, Nexus, PicoClaw, Telegram MCP, …) are **each their own
private GitHub repo**. `TNF-Extensions/` is only a local workspace of those
clones. See
[`data/distribution/oss-app-boundary.json`](../data/distribution/oss-app-boundary.json)
`github` fields. Do not treat `TNF-Extensions` as one publish unit.

```
tnf-monorepo/  (continued)
├── packages/
│   ├── relay-core/
│   │   └── src/
│   │       ├── master-clock.ts # 🔴 PROPRIETARY (stubbed in open-runtime)
│   │       ├── broker-agent.ts # 🔴 PROPRIETARY (stubbed in open-runtime)
│   │       └── index.ts        # 🟢
│   ├── control-plane-contracts/# 🟢 PUBLIC API surface for control-plane stubs
│   ├── agent-coordination/     # 🔴 PROPRIETARY
│   └── ...                     # 🟢 (all others are open)
├── cloudflare-sharedstate/     # 🔴 PROPRIETARY
├── scripts/
│   ├── registry/orchestrator/  # 🔴 PROPRIETARY (covered by PROPRIETARY_DIRS)
│   └── sync-repos.sh           # ⚙️ THE SYNC SCRIPT
└── docs/
    └── REPO_SEPARATION.md      # 📖 THIS FILE
```

🟢 = Open source (ships in the public `The-New-Fuse`) 🔴 = Proprietary (full
source stays in the private monorepo `tnf-monorepo`, extracted to
`fuse-control-plane`, stubbed in the public publish tree)

### `whodaniel/The-New-Fuse` — Open Source Publish Target (Public)

Published from the monorepo MINUS proprietary content. Where proprietary code
was removed, contract stubs are placed that:

- Export types from `@the-new-fuse/control-plane-contracts`
- Provide no-op stub classes with console warnings
- Reference the control-plane repo in comments

### `whodaniel/fuse-control-plane` — Proprietary (Read-Only)

Published automatically by `sync-repos.sh`. Contains:

```
fuse-control-plane/
├── services/                   # Standalone microservices
│   ├── master-clock/           # Master clock synchronization
│   ├── broker-agent/           # Agent brokering
│   ├── backend-orchestrator/   # Orchestration engine
│   └── backend-shared-state/   # State management
├── cloudflare-sharedstate/     # Cloudflare D1 worker
├── source-originals/           # Latest source from monorepo
│   ├── relay-core/             # master-clock.ts, broker-agent.ts
│   ├── backend-orchestrator/   # Full orchestrator module
│   ├── nexus-orchestrator/     # 3D visualization sources
│   ├── picoclaw-overseer/      # Go-based overseer
│   └── agent-coordination/     # Multi-agent patterns
├── orchestration-scripts/      # Top-level orchestration scripts
├── docs/                       # Control-plane documentation
├── scripts/                    # Utility scripts
└── .github/workflows/          # CI/CD for each service
```

---

## App Boundary — What Ships in the Regular OSS Download

Proprietary and "not in the download" are **two different axes**, and conflating
them routes code to the wrong repo.

| Bucket                                 | Where it goes                                                  | Mechanism                        |
| -------------------------------------- | -------------------------------------------------------------- | -------------------------------- |
| Core runtime + form factors            | Public `The-New-Fuse`                                          | default (not excluded)           |
| Proprietary control plane              | Private `fuse-control-plane` (extracted)                       | `PROPRIETARY_FILES/DIRS/SCRIPTS` |
| Satellites, demos, standalone products | Own private GitHub repos; local clones under `TNF-Extensions/` | not packaged with the runtime    |

The regular open-source download is **9 apps**:

`api`, `api-gateway`, `backend`, `chrome-extension`, `frontend`, `mcp-servers`,
`relay-server`, `tauri-desktop`, `vscode-extension`.

The full three-bucket classification lives in
[`data/distribution/oss-app-boundary.json`](../data/distribution/oss-app-boundary.json)
and is enforced by `ALWAYS_EXCLUDE` in `scripts/sync-repos.sh`.

> **Do not add non-shipping apps to `PROPRIETARY_DIRS`.** That array _extracts_
> to `fuse-control-plane`, so listing e.g. `apps/poker-room` there would copy a
> game into the proprietary control-plane repo. Withholding from the public
> download is `ALWAYS_EXCLUDE`; extraction to the control plane is
> `PROPRIETARY_*`.

Until 2026-08-09 only `nexus-orchestrator` and `picoclaw-overseer` were withheld
— every other app under `apps/`, including the payment services, published by
default.

---

## Cross-Boundary Runtime Dependencies

The split is not only a source-code boundary — it changes **runtime behaviour**.
Running only the open side is a supported configuration, but some capabilities
are gated off, and the failure looks like a bug if you do not know this.

### Agent registration requires Director authority

`packages/relay-core/src/standalone-relay.ts` defers agent registration to the
Master Clock, which is proprietary. With the control plane absent:

- `AGENT_REGISTER` is refused with
  `REGISTRATION_ERROR / RELAY_BRIDGE_ERROR: "Relay bridge not connected, cannot register agent."`
- `GET /health` on the relay reports `agents: 0` indefinitely
- Anything that infers presence from the agent roster stays empty — e.g. the
  Chrome extension registers as `platform: 'chrome-extension'`, so the desktop
  app's "Extension" indicator never lights up

**This is the boundary working as designed, not a misconfiguration.** Redis
being up is not sufficient; the authority service is the missing half.

Two supported ways to work locally:

```bash
BRIDGE_GATE_ENABLED=false   # open the gate; register agents without Director authority
```

or run the control-plane `services/master-clock` alongside the relay.

The open publication tree receives a 21-line stub for `master-clock.ts` and
`broker-agent.ts` (see `verify-open-runtime-export.sh`), so a consumer of the
public repo gets stub-mode behaviour by default.

---

## Boundary Integrity

The `PROPRIETARY_*` arrays are only as good as their paths. Every consumer
resolves entries as **repo-root-relative** (`"$EXPORT/$entry"`), so a wrong or
stale path silently protects nothing.

This failed in production: `PROPRIETARY_SCRIPTS` listed all 20 entries as bare
filenames while the files lived under `scripts/registry/orchestrator/`,
`scripts/orchestration/` and `scripts/`. Nothing matched, nothing was removed,
and 17 of them published. `check-proprietary-leakage.sh` had the identical path
bug, so the guard reported `PASS` throughout.

Rules that follow from that:

1. **Always use full repo-root-relative paths** in every `PROPRIETARY_*` array.
2. **Prefer directory coverage** over file lists for a wholly-proprietary
   directory, so new files there are proprietary by default.
3. `check-proprietary-leakage.sh` now **fails on a stale declaration** — a
   declared path that does not exist in the monorepo is an error, not a no-op.
4. Verify before publishing: `bash scripts/verify-open-runtime-export.sh` should
   end with `all declarations resolve`.

Note: fixing the boundary does not remove already-published files from the
public repo's history. That needs a separate decision (history rewrite vs.
deleting them going forward).

---

## Sync Workflow

### Manual Sync

```bash
# Sync both repos
pnpm run sync:repos

# Sync only open-runtime
pnpm run sync:repos -- --open

# Sync only control-plane
pnpm run sync:repos -- --control

# Preview without pushing
pnpm run sync:repos -- --dry-run
```

### What Happens During Sync

1. **Control-plane**: Clones `fuse-control-plane`, copies latest proprietary
   content from monorepo HEAD, commits, pushes.
2. **Open-runtime**: Builds a stripped tree, clones existing `The-New-Fuse`,
   commits **on top of current public HEAD**, and force-pushes only
   `sync/open-runtime`, then opens a PR into `main`. It does **not** `git init`
   and does **not** `git push origin main --force` unless `--replace-history`
   (forbidden in GitHub Actions).

### When to Sync

- After merging significant work to monorepo `main`
- Before releases (tag first: `git tag vX.Y.Z`)
- Never as an automatic force-push of public `main`

Recommended cadence:

1. Merge → monorepo `main`
2. `pnpm run sync:repos:dry-run`
3. Dispatch **TNF Repo Separation Sync** manually (`workflow_dispatch` only — it
   must not run on every monorepo push). Merge the resulting `sync/open-runtime`
   PR on public `The-New-Fuse`.
4. Tag release on the monorepo and on `The-New-Fuse` after that PR lands

---

## The Proprietary Boundary

The definitive list of what is proprietary lives in `scripts/sync-repos.sh` in
these arrays:

- `PROPRIETARY_FILES` — Individual files to extract/stub
- `PROPRIETARY_DIRS` — Directories to extract/remove
- `PROPRIETARY_SCRIPTS` — Top-level scripts to extract/remove
- `ALWAYS_EXCLUDE` — Files that should never appear in any public repo

### Rules

1. **Every proprietary file must leave a stub** in the **open-runtime publish
   tree** (`The-New-Fuse`)
2. **Public code must never import private source** — only contracts
3. **`packages/control-plane-contracts/` is always public** — it defines the API
   boundary between open and closed source; stubs import
   `@the-new-fuse/control-plane-contracts`
4. **The control-plane repo may consume public packages** as library
   dependencies

### Adding New Proprietary Content

When you create new proprietary code:

1. Add the path to the appropriate array in `scripts/sync-repos.sh`
2. Create a corresponding stub in the sync script's stub section
3. Run `pnpm run sync:repos -- --dry-run` to verify
4. Update this document if the category is new

---

## Split History

| Date       | Event                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-20 | Initial control-plane extraction plan created                                                                                                                             |
| 2026-03-21 | Control-plane services bootstrapped (master-clock, broker-agent, etc.)                                                                                                    |
| 2026-03-23 | Open-runtime branch created with ~61K files (unfiltered)                                                                                                                  |
| 2026-03-24 | **Final separation**: sync script created, both repos pushed clean                                                                                                        |
| 2026-08-13 | Public `main` orphaned by sync `git init` + force-push; restored to `655c84aa`. Sync now PRs `sync/open-runtime`. Each TNF-Extensions app is its own private GitHub repo. |

---

## FAQ

**Q: Why not use git subtree or git filter-repo?** A: The 90/10 split with stubs
doesn't map cleanly to subtree semantics. A simple script that clones, filters,
and pushes is more transparent and debuggable.

**Q: Can I commit directly to The-New-Fuse?** A: No. Develop in `tnf-monorepo`.
Public `The-New-Fuse` is a publication target. Direct commits there diverge from
the export and get overwritten by the next sync PR.

**Q: What if I need to add a new proprietary component?** A: Add code to the
monorepo, add its path to `scripts/sync-repos.sh`, add a stub, run a dry-run
sync, then dispatch the workflow.

**Q: Is the monorepo public?** A: No. `whodaniel/tnf-monorepo` is private.
`whodaniel/The-New-Fuse` is the public open-runtime publication. See
`docs/lineage/REPO_LINEAGE.md` for historical slugs.

**Q: Are TNF-Extensions one GitHub repo?** A: No. Each satellite is its own
private repo (`tnf-ai-arcade`, `tnf-nexus-orchestrator`, …). The
`TNF-Extensions/` directory is a local workspace of those clones.

**Q: Should I delete `fuse`, `fuse-mirror`, or `fuse-master`?** A: No. Leave
them GitHub-archived. Do not add write remotes (`old-fuse`, `private-origin`,
`split-mirror`). Canonical history is `tnf-monorepo`. GitHub deletion is
irreversible and needs an explicit operator "delete" — archive is the default.
