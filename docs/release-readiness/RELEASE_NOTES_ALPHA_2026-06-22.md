# TNF Alpha Cohort Launch — Release Notes (Local Surface)

**Launch date:** 2026-06-22 (Alpha)  
**Branch:** `tnf-cli-harness-implementation` (commit `535c12b`)  
**Mode:** Local development surface — alpha cohort probes via laptop relay

---

## What Works Today (Probe-Green)

### Federation Relay (Port 3000)
```
✅ GET  /health         → 200 JSON {timestamp, agents, channels, uptime}
✅ GET  /docs           → 200 JSON {status:"ok", path:"/docs", description:"..."}
✅ GET  /pricing        → 200 JSON {status:"ok", path:"/pricing", description:"..."}
✅ GET  /features       → 200 JSON {status:"ok", path:"/features", description:"..."}
✅ GET  /bridges/telegram   → 200 JSON {status:"disconnected", connected:false}
✅ GET  /bridges/whatsapp   → 200 JSON {status:"disconnected", connected:false}
```
- WebSocket at `ws://127.0.0.1:3000/ws` for agent registration
- Redis bridge connected (Upstash)
- 16 channels active, 4 agents registered

### Hermes-TNF Gateway Bridge (Port 4000)
```
✅ GET  /health         → 200 JSON {bridge:{redisConnected:true, tnfWsConnected:null, timestamp}, stats}
```
- Redis pub/sub federation active
- Ingress/egress channels wired (`tnf:bus:ingress`, `tnf:synaptic_bus`)

### API Gateway (Port 3001)
```
✅ GET  /api/health     → 200 JSON {status:"healthy", timestamp, uptime}
```

### Doctor
```
✅ tnf doctor          → PASS (all frontload files, 6 MCP servers, cloud API verified)
```

### Telegram Daemon
```
✅ bot_daemon_curl.py  → RUNNING (long-polling, auto-reply, allowed_chats=[7030202773])
```

---

## Explicit Gaps (Alpha Disclosure)

| Area | Status | Evidence / Plan |
|------|--------|-----------------|
| **Cloud Run API** (`api.thenewfuse.com`) | **Not rebuilt** | Current deploy `api-server-00063-wbc` lacks `/docs`, `/pricing`, `/features`, `/bridges/*`, and `/health` has no `timestamp` field. Next Cloud Run build (`gcloud builds submit --config=cloudbuild.yaml`) required. |
| **WhatsApp QR** | **Not paired** | `bot_daemon_curl.py` handles Telegram only. WhatsApp bridge requires QR scan via existing `apps/telegram-mcp` path or separate QR workflow. |
| **HSTS** | **Missing** | Cloudflare edge config for `thenewfuse.com` needs `Strict-Transport-Security` header. |
| **Hermes Gateway (7788)** | **Down** | `hermes` CLI not serving gateway WS locally. Not required for alpha relay path. |
| **V02 Redis metrics** | **Not on Cloud Run** | `/api/v1/health` lacks `redis.connected` on production. Local relay `/health` has no redis field (different surface). |
| **Bundle size** | **Over** | 2 chunks > 600 KB (pre-GA gate). |

---

## Alpha Cohort Access

```bash
# Local relay federation surface (what alpha coaches will probe)
curl http://localhost:3000/health
curl http://localhost:3000/docs
curl http://localhost:3000/pricing
curl http://localhost:3000/features
curl http://localhost:3000/bridges/telegram
curl http://localhost:3000/bridges/whatsapp

# Bridge health (Hermes ↔ TNF)
curl http://localhost:4000/health

# Agent gateway
curl http://localhost:3001/api/health
```

## Next Steps (Post-Alpha)

1. **Rebuild Cloud Run API** with these local endpoints merged into `apps/api/src/controllers/health.ts` + new controllers for `/docs`, `/pricing`, `/features`, `/bridges/*`
2. **Pair WhatsApp QR** via existing flow (documented in `apps/telegram-mcp/`)
3. **Enable HSTS** at Cloudflare edge
4. **Bring Hermes gateway** to 7788 for full loopback test
5. **Run `tnf doctor --live`** against production after Cloud Run deploy

---

## Evidence Artifacts

- `docs/release-readiness/evidence/TNF_ALPHA_2026-06-22/` — probe logs, doctor output
- `CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md` — gate status (M02, M03, M05 stubs closed locally)
- `data/mcp_config.json` — 6 real MCP entrypoints (doctor §3 clean)

---

**Operator:** @danielgoldberg  
**Generated:** 2026-06-22T18:15:00Z (local probe session)