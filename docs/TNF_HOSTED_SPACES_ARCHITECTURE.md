# TNF Hosted Spaces — Architecture Proposal

> **Equivalent to Target platform spaces** — managed hosting for React pages and
> API routes, zero setup, instant deploy.

## Status

**GAP IDENTIFIED** by CTO Agent (Alternative AI Computer + MiniMax 2.7)
**Date:** 2026-03-23 **Priority:** P0 — Platform Parity with Alternative AI
Computer

---

## Executive Summary

TNF excels at multi-agent orchestration and federation, but lacks a **managed
hosting layer** for user-facing web assets. Alternative AI Computer systems
solve this with a zero-config platform where users deploy React pages and API
routes that are instantly live.

**TNF should build the same.**

---

## What is TNF Hosted Spaces?

A managed web hosting platform built into TNF where users can:

- Write **React page routes** (like Next.js `app/` router)
- Write **API routes** (Hono/Fastify style)
- Upload **static assets** (images, files)
- Get a **public URL** instantly (`https://username.thenewfuse.com/route`)
- Connect **custom domains**

**No git push, no Dockerfile, no cloud config.** Just write code and it's live.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    TNF HOSTED SPACES PLATFORM                     │
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐  │
│  │  Route       │   │  Asset       │   │  Preview Server       │  │
│  │  Editor      │   │  Manager     │   │  (localhost:3099)     │  │
│  │  (Code UI)   │   │  (upload)    │   │  Fast refresh        │  │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘  │
│         │                   │                       │              │
│         └─────────────────┬───────────────────────┘              │
│                           ▼                                       │
│              ┌────────────────────────┐                          │
│              │   Route Sync Service   │                          │
│              │   (writes to TNF FS)  │                          │
│              └───────────┬────────────┘                          │
│                          ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    TNF File System                          │  │
│  │  spaces/{userId}/{spaceId}/routes/{path}/                   │  │
│  │  spaces/{userId}/{spaceId}/assets/{...}                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                          │                                        │
│                          ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Bun + Hono Runtime (per user space)            │  │
│  │  • Route compilation (JSX → JS)                             │  │
│  │  • API handler execution                                    │  │
│  │  • Static asset serving                                      │  │
│  │  • JWT auth for private routes                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                          │                                        │
│                          ▼                                        │
│              ┌────────────────────────┐                          │
│              │   nginx/cf-radius     │                          │
│              │   (SSL termination,   │                          │
│              │    routing by host)   │                          │
│              └───────────┬────────────┘                          │
└──────────────────────────┼──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   https://user.thenewfuse.com   https://custom.com
```

---

## Core Features

### 1. Route System

**Page Routes** (`route_type="page"`):

```tsx
// Path: /about
import { useState } from 'react';

export default function About() {
  const [count, setCount] = useState(0);
  return (
    <div className="p-8 bg-zinc-900 min-h-screen text-white">
      <h1 className="text-4xl font-bold">About</h1>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="mt-4 px-4 py-2 bg-blue-600 rounded"
      >
        Clicked {count} times
      </button>
    </div>
  );
}
```

**API Routes** (`route_type="api"`):

```typescript
// Path: /api/hello
import type { Context } from 'hono';

export default (c: Context) => {
  return c.json({
    message: 'Hello from TNF Spaces!',
    timestamp: new Date().toISOString(),
  });
};
```

**Built-in capabilities:**

- React 18 with hooks
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- `lucide-react` icons (pre-installed)
- Request body parsing, JSON responses, SSE streams

### 2. Asset Management

```typescript
// Upload workspace file as public asset
update_space_asset(source_file: "/path/to/logo.png", asset_path: "/images/logo.png")
// → Available at: https://user.thenewfuse.com/images/logo.png

// List all assets
list_space_assets()
// → [{ asset_path: "/images/logo.png", size: 10234, uploaded_at: "..." }]

// Delete asset
delete_space_asset(asset_path: "/images/logo.png")
```

### 3. Authentication

**Private routes** (default, requires auth):

```typescript
// Pages default to private — only the owner can access
export default function Dashboard() { ... }
```

**Public routes** (explicit opt-in):

```typescript
update_space_route(path: "/landing", route_type: "page", code: "...", public: true)
// → Accessible to anyone at https://user.thenewfuse.com/landing
```

**Securing API routes with bearer tokens:**

```typescript
import { timingSafeEqual } from 'node:crypto';
import type { Context } from 'hono';

export default async (c: Context) => {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = auth.slice(7);
  const secret = process.env.MY_API_SECRET;
  if (!timingSafeEqual(Buffer.from(token), Buffer.from(secret || ''))) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  return c.json({ data: 'secret' });
};
```

### 4. Preview Mode (Agent Debugging)

TNF agents get a **local preview server** at `localhost:3099` for any space
route — no auth, no deploy, instant feedback during development.

```bash
# Agent-side debugging
agent-browser open http://localhost:3099/route-path
sleep 3
agent-browser screenshot /tmp/preview.png --full-page
```

### 5. Custom Domains

```
Settings → Spaces → mysite.com → CNAME → user.thenewfuse.com
```

SSL is auto-provisioned via Let's Encrypt.

---

## Data Model

```typescript
interface Space {
  id: string;
  userId: string;
  name: string;
  subdomain: string; // "user" → user.thenewfuse.com
  customDomains: string[];
  plan: 'free' | 'basic' | 'pro' | 'ultra';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'suspended';
}

interface SpaceRoute {
  id: string;
  spaceId: string;
  path: string; // "/about", "/api/hello"
  routeType: 'page' | 'api';
  code: string; // Full source code
  public: boolean; // Default: false (private)
  createdAt: string;
  updatedAt: string;
}

interface SpaceAsset {
  id: string;
  spaceId: string;
  assetPath: string; // "/images/logo.png"
  fileSize: number;
  mimeType: string;
  storageKey: string; // S3/R2 key
  uploadedAt: string;
}
```

---

## TNF CLI Integration

```bash
# List all spaces
tnf spaces list

# Create a new space
tnf spaces create my-site --plan pro

# Deploy route
tnf spaces route create /about --type page --public

# Upload asset
tnf spaces asset upload ./logo.png /images/logo.png

# View logs
tnf spaces logs my-site --follow

# Set custom domain
tnf spaces domain add mysite.com
```

---

## Security

| Concern                  | Mitigation                                                |
| ------------------------ | --------------------------------------------------------- |
| Arbitrary code execution | Sandboxed Bun runtime, no filesystem access outside space |
| SSRF from API routes     | Network isolation, allowlist outbound IPs                 |
| Token theft              | Secure cookie + short-lived JWT, HttpOnly flags           |
| Asset injection          | MIME type validation, no execution of uploaded assets     |
| Rate limiting            | Per-route rate limits via nginx/Upstash                   |

---

## Implementation Plan

### Phase 1 — Core Runtime (Week 1)

- [ ] `SpaceService` in API — CRUD for spaces + routes
- [ ] Bun/Hono runtime process per user (supervisor-managed)
- [ ] Route compilation pipeline (JSX → JS → handler)
- [ ] Asset storage (S3 or Cloudflare R2)

### Phase 2 — Networking (Week 2)

- [ ] nginx config for multi-tenant routing by subdomain
- [ ] SSL auto-provision via Let's Encrypt (certbot or lego)
- [ ] Custom domain validation (DNS check + TLS handshake)
- [ ] Private route auth middleware

### Phase 3 — DX & Polish (Week 3)

- [ ] Route editor UI in frontend
- [ ] Asset upload UI
- [ ] `tnf spaces` CLI commands
- [ ] Preview server for agents (`localhost:3099`)
- [ ] Logs viewer in dashboard

---

## Why This Closes the Gap

| Feature               | Target Platform | TNF Before | TNF After |
| --------------------- | --------------- | ---------- | --------- |
| Managed React hosting | ✅              | ❌         | ✅        |
| API routes            | ✅              | ❌         | ✅        |
| Zero-config deploy    | ✅              | ❌         | ✅        |
| Public/private routes | ✅              | ❌         | ✅        |
| Custom domains        | ✅ (paid)       | ❌         | ✅        |
| Agent preview server  | ✅              | ❌         | ✅        |
| Static asset hosting  | ✅              | ❌         | ✅        |

---

## Pre-installed Packages (in Space runtime)

```
react, react-dom, lucide-react
hono, @hono/node-server, @hono/cloudflare-workers
tailwindcss, @tailwindcss/vite
zod, json-schema-to-zod
stripe (for commerce routes)
ws, server-sent-events
```

**No `npm install` inside spaces** — fixed dependency set, like other managed
runtimes.

---

_Proposal by: CTO Agent (Alternative AI Computer + MiniMax 2.7)_ _Date:
2026-03-23_
