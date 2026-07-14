# The New Fuse 2.0 — Public Release Notes

**Release date:** 2026-06-21 (Release-Candidate)  
**Image:** `api-server:launch-health-20260621`  
**Open runtime:**
[github.com/whodaniel/fuse-open-runtime](https://github.com/whodaniel/fuse-open-runtime)

---

## What's New

### Platform

- **The New Fuse 2.0** landing and hosted app at
  [thenewfuse.com](https://thenewfuse.com) and
  [app.thenewfuse.com](https://app.thenewfuse.com)
- MCP + A2A agent federation via Redis Synaptic Bus
- Turn Zero harness protocol for agent session continuity
- Chrome extension federation (dist-v7)

### API

- `GET /health` — returns RFC3339 `timestamp`
- `GET /api/v1/health` — canonical health probe (200 JSON)
- Deployed to Cloud Run `api-server-00063-wbc`

### Open Source

- **90% open runtime** published at `whodaniel/fuse-open-runtime` (public)
- One-line CLI install:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/whodaniel/fuse-open-runtime/main/scripts/install-tnf-cli.sh | bash
  ```

### Frontend

- Legal pages (`/legal/privacy`, `/legal/terms`) serve distinct React content
- Marketing routes on landing domain route to SPA (`X-TNF-Routing: SPA-Landing`)

---

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/whodaniel/fuse-open-runtime/main/scripts/install-tnf-cli.sh | bash
tnf onboard
```

Or clone:

```bash
git clone https://github.com/whodaniel/fuse-open-runtime.git
cd fuse-open-runtime
pnpm install
pnpm run dev
```

---

## Known Gaps (pre-GA)

- HSTS header not yet enabled on `thenewfuse.com` (Cloudflare edge)
- `/api/v1/health` lacks Redis metrics (V02)
- Telegram/WhatsApp bridge health endpoints (M05)
- Bundle size strict gate (2 chunks > 600 KB)

---

## Links

- Site: https://thenewfuse.com
- App: https://app.thenewfuse.com
- API: https://api.thenewfuse.com
- Docs: https://thenewfuse.com/docs
- GitHub: https://github.com/whodaniel/fuse-open-runtime
- Security: security@thenewfuse.com
