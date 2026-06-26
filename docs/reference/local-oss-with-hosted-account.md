# Local Open Source + thenewfuse.com Account

> How to use the **locally installed open-source codebase** together with a
> **thenewfuse.com / app.thenewfuse.com account** (optional but common).

## The two layers

| Layer | What it is | Where it lives |
| ----- | ---------- | -------------- |
| **Open runtime (OSS)** | Code you clone, build, and run on your machine | `fuse-open-runtime` or dev monorepo `the-new-fuse-next-gen` |
| **Hosted account (SaaS)** | Login, agents, cloud relay, production API | [thenewfuse.com](https://thenewfuse.com) · [app.thenewfuse.com](https://app.thenewfuse.com) |

These are **complementary**, not either/or. Most contributors run **local tooling + a hosted account**.

```
┌─────────────────────────────────────────────────────────────┐
│  Your Mac (open source)                                     │
│  ├── git clone → pnpm install → pnpm run dev                │
│  ├── ./tnf CLI, voice bridge, local relay (optional)        │
│  └── apps/api + postgres when testing auth locally          │
└──────────────────────────┬──────────────────────────────────┘
                           │  same email/password (when configured)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Hosted (thenewfuse.com)                                    │
│  ├── app.thenewfuse.com  — logged-in app UI                 │
│  ├── api.thenewfuse.com  — production API + your user row   │
│  └── relay / KWS cloud     — optional cloud services          │
└─────────────────────────────────────────────────────────────┘
```

## Which repo to clone

| Audience | Clone | Notes |
| -------- | ----- | ----- |
| **OSS users / contributors** | [github.com/whodaniel/fuse-open-runtime](https://github.com/whodaniel/fuse-open-runtime) | Public ~90%; no proprietary control-plane code |
| **Core TNF development** | [github.com/whodaniel/the-new-fuse-next-gen](https://github.com/whodaniel/the-new-fuse-next-gen) | Full monorepo; private |

Do **not** commit to `fuse-open-runtime` directly — changes flow from the monorepo via `pnpm run sync:repos` (see [REPO_SEPARATION.md](../REPO_SEPARATION.md)).

## Three common workflows

### 1. Hosted app only (no local install)

- Sign up / log in at [app.thenewfuse.com/auth/login](https://app.thenewfuse.com/auth/login)
- Use the product in the browser
- No local clone required

### 2. Local OSS only (no hosted account)

For hacking on the platform offline or in a clean room:

```bash
git clone https://github.com/whodaniel/fuse-open-runtime.git
cd fuse-open-runtime
pnpm install
cp .env.example .env
touch .tnf.local.env
# Set DATABASE_URL, JWT_SECRET, Redis, etc. in .env
pnpm run dev
```

- Auth is **your local API** (`http://localhost:3001` or proxied `/api`)
- Users exist only in **your local Postgres**
- A thenewfuse.com account is **not required**

### 3. Hybrid — local OSS + thenewfuse.com account (recommended)

Use local code for CLI, voice, agents, and development; use your **hosted account** for production identity and cloud edges.

**A. Local stack, local API (default dev)**

```bash
# .tnf.local.env (gitignored)
TNF_ROOT=/path/to/fuse-open-runtime
TNF_RELAY_URL=ws://127.0.0.1:3000/ws
```

```bash
pnpm run dev          # frontend :5173, API :3001, relay local
./tnf ports preflight
./tnf voice up --with-listen   # optional voice bridge
```

Register/login against **localhost** — separate from production users unless you point at the same database (don't do that casually).

**B. Local frontend, hosted API (same account as production)**

Use when you want the **same login** as app.thenewfuse.com while running UI from source:

```bash
# apps/frontend/.env.local (gitignored)
VITE_API_URL=https://api.thenewfuse.com
```

Then `pnpm --filter frontend dev` — the Vite proxy talks to production API; your existing thenewfuse.com credentials apply.

**C. Local tools + cloud voice/KWS**

Voice bridge can forward transcripts to the hosted KWS gateway (see `apps/audio-trigger-kws-mvp/docs/voice-integration-notes.md`). Your account/API key gates cloud ingest; STT runs locally.

## What the account is for

| Needs account | Does not need account |
| ------------- | --------------------- |
| app.thenewfuse.com logged-in UI | Reading OSS source |
| Production API user / JWT | Local-only `pnpm run dev` with local DB |
| Hosted relay / cloud workers (when configured) | `./tnf` CLI against local relay |
| Billing / entitlements (when enabled) | Voice bridge fully local |

The account is **optional** for open-source development; it is **required** for the hosted product experience.

## Domain map

| URL | Role |
| --- | ---- |
| `thenewfuse.com` | Marketing, docs, some public routes |
| `app.thenewfuse.com` | Authenticated app (login, dashboard) |
| `api.thenewfuse.com` | Production REST API |
| `relay.thenewfuse.com` | Hosted WebSocket relay (when used) |
| `localhost:5173` / `:3001` | Local dev frontend / API |

Auth routes use `/api/auth/*` (not `/api/v1/auth/*`) on the current production path.

## Local config files (gitignored)

| File | Purpose |
| ---- | ------- |
| `.env` | Shared local secrets template from `.env.example` |
| `.env.local` | Machine overrides |
| `.tnf.local.env` | `TNF_ROOT`, relay URL, port allowances |
| `.voicebridge/` | Voice stream, targets, cloud KWS env (in repo or project root) |

Precedence: `exported env > .tnf.local.env > .env.local > .env` (see [local-runtime-profile.md](./local-runtime-profile.md)).

## Voice + local OSS + account

1. Install from repo: `scripts/system/` (canonical), not ad-hoc `~/app` or `~/apps`
2. `pnpm run voice:drift-audit` — confirm no path drift
3. `./tnf voice up --with-listen` — local STT + bridge
4. Optional cloud KWS: `.voicebridge/voice_bridge_cloud.env` (ingest URL + API key)
5. For Cursor chat: use longer idle flush or `--no-enter` to avoid follow-up queue spam:

```bash
export VOICE_IDLE_FLUSH_SECONDS=4.5
export VOICE_MAX_FLUSH_SECONDS=15.0
bash scripts/system/voice-target-pick --profile main --delay 5 --no-enter
```

See [voice-system-status.md](../voice-system-status.md).

## Quick verification

```bash
# Local API healthy
curl -s http://localhost:3001/health

# Hosted API healthy
curl -s https://api.thenewfuse.com/health

# CLI + ports
./tnf ports status
./tnf voice status
```

## Related docs

- [REPO_SEPARATION.md](../REPO_SEPARATION.md) — monorepo vs fuse-open-runtime
- [local-runtime-profile.md](./local-runtime-profile.md) — `TNF_ROOT`, ports, relay
- [voice-system-status.md](../voice-system-status.md) — voice stack checklist
- [README.md](../../README.md) — clone and `pnpm run dev`
