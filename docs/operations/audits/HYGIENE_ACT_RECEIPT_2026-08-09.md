# Hygiene Act Receipt — 2026-08-09 (Full Enchilada P0)

**Mode**: Gated emergency hygiene (operator-approved)  
**Repo**: `<TNF_ROOT>`

## Actions performed

1. **Stopped swarm-context history writes**
   (`scripts/runtime/tnf-swarm-context-bridge.cjs`)
   - Default `TNF_SWARM_CONTEXT_HISTORY_KEEP=0` → canonical
     `~/.tnf/swarm-context.md` only
   - Optional keep-N + prune helper if env keep &gt; 0
2. **One-time reclaim**: deleted **76,932** `swarm-context-*.md` files (**160.3
   MiB**); canonical preserved
3. **Rotated journals** to last 2000 lines:
   - autopilot history **151.9 → 7.0 MiB**
   - authority audit **52.2 → 0.5 MiB**
4. **PEM scrub**: removed private key bodies from
   `local-subdirector-heartbeat.json`; keep key **file paths** + configured
   flags only
5. **Runtime fix**: `scripts/runtime/local-subdirector-runtime.cjs` no longer
   dumps PEMs into heartbeat (`publicHeartbeatConfig()`); synced to
   `~/.tnf/local-subdirector/bin/` + service restart
6. **Retention**: extended `scripts/operations/swarm-disk-retention.sh` for
   swarm-context history, autopilot/authority truncate, heartbeat PEM scrub; ran
   successfully

## Verify (post-restart)

| Check                                  | Result                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `swarm-context-*.md` count             | **0**                                                                                                                                                |
| Canonical `swarm-context.md`           | present                                                                                                                                              |
| Heartbeat `BEGIN PRIVATE`              | **absent** after restart cycle                                                                                                                       |
| `signingKeyFile` / `encryptionKeyFile` | pointed at `~/.tnf/local-subdirector/*.pkcs8.pem`                                                                                                    |
| Disk free                              | **~741 MiB → ~6.3 GiB** on `/System/Volumes/Data` after reclaim + hermes-state retention (still ~99% capacity numerically; usable headroom restored) |

## Residual risk

Volume remains near capacity. Next hygiene (separate approval): growth-audit
capacity% severity, optional `pnpm store prune` already attempted inside
retention, deeper cursor/opencode cache triage.
