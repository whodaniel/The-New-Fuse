# Launch Epoch — Post-Restart Playbook

**Created:** 2026-06-21  
**Trigger:** Pre-launch dev environment reset + machine restart  
**Authority:** `docs/protocols/TURN_ZERO_MANDATE.md` → `LIVING_STATE.md` →
`AGENT_STATUS_LEDGER.md` → `SESSION_HANDOFF_LATEST.json`

---

## What Was Cleared (Pre-Restart)

| Target                                              | Action                                 | Preserved                                       |
| --------------------------------------------------- | -------------------------------------- | ----------------------------------------------- |
| `/tmp/tnf-repo-sync-*`                              | Deleted (~1.9 GB failed sync checkout) | —                                               |
| `~/.tnf/gemini-wrapper-home`                        | Deleted (~733 MB)                      | `handoff-*.json`, `runtime-state.json`, configs |
| `~/.tnf/{logs,wrapper-logs,terminal-heartbeat,...}` | Deleted                                | `green-coordinator/` session logs               |
| Repo `.turbo`, `dist/`, root build artifacts        | Cleared                                | Source, `.env*`, protocols                      |
| TNF runtime processes                               | Stopped                                | —                                               |
| `/tmp` logs                                         | Truncated                              | —                                               |

**Disk after cleanup:** ~2.8 GB free (was 20 MB / ENOSPC).

---

## Boot Sequence (Run in Order After Restart)

### 1. Turn Zero (Cursor / any agent)

```bash
cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse
tnf onboard
tnf state show
tnf protocol gate
```

### 2. Infrastructure

```bash
./tnf ports preflight
bash scripts/runtime/green-channel-coordinator-service.sh start
node packages/relay-core/dist/standalone-relay.js &   # or tnf boot path
node scripts/gemini-redis-wrapper.cjs &
curl -s http://127.0.0.1:3007/handoff-lineage | head -c 200
```

### 3. Rebuild (caches were cleared)

```bash
pnpm install          # only if node_modules corrupted
pnpm run build        # or targeted: pnpm --dir packages/tnf-cli run build
pnpm run release:gate
```

### 4. Chrome Extension

Reload from `apps/chrome-extension/dist-v7` in `chrome://extensions`.

---

## Full Swarm Delegation — Launch Epoch

**Operator directive:** Use entire TNF swarm. Do not work solo when parallel
agents exist.

### Orchestrator Entry

```bash
# Primary control plane
tnf boot
tnf mapreduce --help

# Full-auto unattended loops (requires TNF_SUPER_ADMIN_TOKEN)
tnf full-auto provision
tnf full-auto once --base-url https://thenewfuse.com --api-url https://api.thenewfuse.com
tnf full-auto status
```

### Parallel Workstreams (delegate to swarm)

| Stream              | Agent / Command              | Deliverable                                                      |
| ------------------- | ---------------------------- | ---------------------------------------------------------------- |
| **A: Open Runtime** | `forge-agent` + `sync:repos` | Public `fuse-open-runtime`, working install script               |
| **B: Release Gate** | `local-subdirector`          | `release:gate:strict` pass, TelegramService env paths            |
| **C: API Health**   | API team agent               | `/health` timestamp, `/api/v1/health` 200 JSON                   |
| **D: Legal/SEO**    | `content-writer-agent`       | Static privacy/terms/about (not SPA dupes)                       |
| **E: Marketing**    | `orchestrator-agent`         | Execute `docs/marketing/PUBLIC_LAUNCH_MARKETING_PLAN.md` Phase 0 |
| **F: Verification** | `historian` + live probes    | Re-run checklist rows M01–M05 with evidence                      |

### Cursor Harness (this session)

```bash
tnf assimilate link cursor
pnpm run tnf:start:cursor
# Or paste Turn Zero prompt from tnf-harness-protocol skill
```

### MCP + Fleet

```bash
tnf doctor
tnf fleet status          # if available
tnf registry list         # agent inventory
```

---

## Launch Blockers (P0 — Swarm Must Close)

1. Publish `whodaniel/fuse-open-runtime` (currently private)
2. Fix CLI install: `curl … install-tnf-cli.sh | bash` on clean machine
3. `pnpm run release:gate` — no personal paths in production tree
4. Static legal pages on thenewfuse.com
5. API `/api/v1/health` + RFC3339 `timestamp` on `/health`
6. HSTS on Cloudflare edge

Reference: `docs/release-readiness/CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md`  
Marketing: `docs/marketing/PUBLIC_LAUNCH_MARKETING_PLAN.md`

---

## Post-Restart Prompt (Paste into Cursor)

```text
Launch Epoch — Full Swarm Mode.

1. Execute Turn Zero from docs/protocols/TURN_ZERO_MANDATE.md
2. Read SESSION_HANDOFF_LATEST.json and docs/operations/LAUNCH_EPOCH_RESTART_PLAYBOOK.md
3. Boot TNF infrastructure (relay, BROKER-Green, gemini wrapper)
4. Delegate launch blockers A–F to the TNF swarm via mapreduce/full-auto — do NOT work sequentially when parallel agents are available
5. Target: Release-Candidate on checklist, then public launch per marketing plan Phase 0
6. Verify every action; attach evidence to checklist rows

Operator confirmation: proceed with full swarm delegation.
```

---

## Success Criteria (End of Launch Epoch)

- [ ] `df -h /` ≥ 5 GB free sustained
- [ ] `pnpm run release:gate:strict` PASS
- [ ] `tnf protocol gate` PASS
- [ ] CLI install works on clean machine
- [ ] `fuse-open-runtime` public with tagged release
- [ ] Checklist M01–M05 all green
- [ ] Marketing Phase 0 complete → soft launch ready
