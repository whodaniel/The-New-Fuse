# TNF Repository Separation Architecture

> **Status**: Active — This is the canonical reference for how TNF code is
> distributed across repositories.
>
> **Last Updated**: 2026-03-24

---

## TL;DR for AI Agents

**TNF uses a single combined monorepo for development, with two downstream
publication repos.**

```
whodaniel/fuse  (COMBINED MONOREPO — you develop here)
    │
    ├──► whodaniel/fuse-open-runtime   (90% open-source, read-only target)
    └──► whodaniel/fuse-control-plane  (10% proprietary, read-only target)
```

- **NEVER commit directly to `fuse-open-runtime` or `fuse-control-plane`.**
- **ALL development happens in `whodaniel/fuse`.**
- Run `pnpm run sync:repos` to push changes to both downstream repos.
- The proprietary boundary is defined in `scripts/sync-repos.sh` (the
  `PROPRIETARY_*` arrays).

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

---

## Repository Map

### `whodaniel/fuse` — Combined Monorepo (Development)

This is where you work. It contains everything.

```
The-New-Fuse/
├── apps/                       # Applications
│   ├── api/                    # 🟢 NestJS API server
│   ├── api-gateway/            # 🟢 NestJS gateway
│   ├── backend/                # 🟢 Backend (orchestrator module is stub)
│   │   └── src/modules/
│   │       └── orchestrator/   # 🔴 PROPRIETARY (full impl here, stubbed in open-runtime)
│   ├── frontend/               # 🟢 React frontend
│   ├── relay-server/           # 🟢 WebSocket relay
│   ├── nexus-orchestrator/     # 🔴 PROPRIETARY
│   ├── picoclaw-overseer/      # 🔴 PROPRIETARY
│   ├── electron-desktop/       # 🟢
│   ├── vscode-extension/       # 🟢
│   ├── chrome-extension/       # 🟢
│   └── ...                     # 🟢 (all others are open)
├── packages/
│   ├── relay-core/
│   │   └── src/
│   │       ├── master-clock.ts # 🔴 PROPRIETARY (stubbed in open-runtime)
│   │       ├── broker-agent.ts # 🔴 PROPRIETARY (stubbed in open-runtime)
│   │       └── index.ts        # 🟢
│   ├── control-plane-contracts/# 🟢 PUBLIC API surface for control-plane
│   ├── agent-coordination/     # 🔴 PROPRIETARY
│   └── ...                     # 🟢 (all others are open)
├── cloudflare-sharedstate/     # 🔴 PROPRIETARY
├── orchestrate-*.js            # 🔴 PROPRIETARY scripts
├── tnf-orchestrator*.js        # 🔴 PROPRIETARY scripts
├── tnf-master-orchestrator.ts  # 🔴 PROPRIETARY
├── scripts/
│   └── sync-repos.sh           # ⚙️ THE SYNC SCRIPT
└── docs/
    └── REPO_SEPARATION.md      # 📖 THIS FILE
```

🟢 = Open source (goes to `fuse-open-runtime`) 🔴 = Proprietary (goes to
`fuse-control-plane`, stubbed in `fuse-open-runtime`)

### `whodaniel/fuse-open-runtime` — Open Source (Read-Only)

Published automatically by `sync-repos.sh`. Contains everything from the
monorepo MINUS proprietary content. Where proprietary code was removed, contract
stubs are placed that:

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
2. **Open-runtime**: Clones monorepo, removes all proprietary paths, creates
   stub files, force-pushes to `fuse-open-runtime`.

### When to Sync

- After merging significant PRs to `main`
- Before releases
- Whenever you want the public/private repos to reflect latest state

---

## The Proprietary Boundary

The definitive list of what is proprietary lives in `scripts/sync-repos.sh` in
these arrays:

- `PROPRIETARY_FILES` — Individual files to extract/stub
- `PROPRIETARY_DIRS` — Directories to extract/remove
- `PROPRIETARY_SCRIPTS` — Top-level scripts to extract/remove
- `ALWAYS_EXCLUDE` — Files that should never appear in any public repo

### Rules

1. **Every proprietary file must leave a stub** in `fuse-open-runtime`
2. **Public code must never import private source** — only contracts
3. **`packages/control-plane-contracts/` is always public** — it defines the API
   boundary between open and closed source
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

| Date       | Event                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| 2026-03-20 | Initial control-plane extraction plan created                          |
| 2026-03-21 | Control-plane services bootstrapped (master-clock, broker-agent, etc.) |
| 2026-03-23 | Open-runtime branch created with ~61K files (unfiltered)               |
| 2026-03-24 | **Final separation**: sync script created, both repos pushed clean     |

---

## FAQ

**Q: Why not use git subtree or git filter-repo?** A: The 90/10 split with stubs
doesn't map cleanly to subtree semantics. A simple script that clones, filters,
and pushes is more transparent and debuggable.

**Q: Can I commit directly to fuse-open-runtime?** A: No. It will be overwritten
on next sync. All changes go through the monorepo.

**Q: What if I need to add a new proprietary component?** A: Add code to the
monorepo, add its path to `scripts/sync-repos.sh`, add a stub, run sync.

**Q: Is the monorepo public?** A: Yes, `whodaniel/fuse` is currently public. It
contains proprietary code because it's the development workspace. The separation
exists so that `fuse-open-runtime` is a clean public release without proprietary
internals.
