# HostMaria Legacy Autonomous Ops

This runbook keeps legacy HostMaria projects alive 24/7 while you scale
marketing and sales operations.

## What gets installed

- Continuous preservation checks (HTTP + DNS + TLS expiry):
  - `scripts/runtime/hostmaria-preservation-check.cjs`
- Daily public archive snapshots (homepage/robots/sitemap):
  - `scripts/runtime/hostmaria-daily-archive.cjs`
- Cron-backed autonomous poll jobs with lock/backoff/jitter:
  - `scripts/runtime/hostmaria-autonomous-bootstrap.sh`

## Bootstrap now

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
./scripts/runtime/hostmaria-autonomous-bootstrap.sh install
```

This creates:

- Targets file: `~/.tnf/hostmaria/projects.txt`
- Reports: `~/.tnf/hostmaria/reports/`
- Archives: `~/.tnf/hostmaria/archive/`

## Add all legacy project domains

Edit:

```bash
nano ~/.tnf/hostmaria/projects.txt
```

One domain or URL per line.

Example:

```txt
hostmaria.com
project-a.com
https://project-b.com
```

## Status and control

Show status:

```bash
./scripts/runtime/hostmaria-autonomous-bootstrap.sh status
```

Uninstall jobs:

```bash
./scripts/runtime/hostmaria-autonomous-bootstrap.sh uninstall
```

## Auth workflows

For login-required tasks:

- Use profile autotype:
  - `scripts/auth/keychain_account_login_autotype.sh --profile "hostmaria-main"`
- Or authenticate once via phone/email magic link and export session:
  - `scripts/auth/browser_session_to_playwright_state.sh --url "https://hostmaria.com"`

## TNF Workspace Sync

HostMaria automation artifacts can be synced directly into TNF workspace
Projects + Tasks.

- API route: `POST /api/workspaces/:workspaceId/hostmaria/sync`
- Access policy:
  - Workspace owner must match `HOSTMARIA_OWNER_EMAILS` (default:
    `owner@example.com`)
  - Access is limited to owner account + delegated workspace agent members
  - HostMaria tasks are always written under the workspace owner account
- Optional UI operator allowlist: `VITE_HOSTMARIA_AGENT_EMAILS`
  (comma-separated)
- Sync source files:
  - `~/.tnf/hostmaria/projects.txt`
  - `~/.tnf/hostmaria/reports/hostmaria-preservation-latest.json`
  - `~/.tnf/hostmaria/archive/latest-archive-summary.json`

The sync operation will:

- Upsert workspace project: `HostMaria Legacy Ops`
- Upsert DB-backed tasks (`HOSTMARIA_LEGACY_OPS`) for monitor, archive, and each
  target
  - Supports both TNF task schemas:
    - modern Drizzle task columns (`user_id`, `data`, `deleted_at`)
    - legacy task columns (`createdBy`, `updatedAt`, no `data`)
- Mirror those tasks into Unified Ledger task records for the `/tasks` UI

You can run this from the Hosting UI using **Sync HostMaria** in the selected
workspace panel.

### Auto-sync loop (API runtime)

The API now runs a built-in HostMaria workspace sync loop using `setInterval`
(no Nest `ScheduleModule` dependency).

- `HOSTMARIA_AUTO_SYNC_ENABLED` (default: `true`)
- `HOSTMARIA_AUTO_SYNC_INTERVAL_MS` (default: `600000`, minimum `60000`)
- `HOSTMARIA_AUTO_SYNC_RUN_ON_START` (default: `true`)

Behavior:

- Reads HostMaria artifacts from `~/.tnf/hostmaria/*`
- Finds workspaces whose owner email is in `HOSTMARIA_OWNER_EMAILS`
- Syncs project/tasks/ledger for those owner workspaces
- Writes HostMaria tasks under workspace owner account identity
