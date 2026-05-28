---
name: tnf-frontend-deploy
description:
  Procedural guide for building and deploying The New Fuse frontend to
  Cloudflare Pages. Use when you need to sync the codebase and push the newest
  version to thenewfuse.com and app.thenewfuse.com.
---

# TNF Frontend Deployment

This skill documents the verified pipeline for building, syncing, and deploying
the TNF React application.

## 1. Prerequisites

- **Directory**: `apps/frontend`
- **Environment**: Cloudflare Pages (`thenewfuse-main`)
- **Credentials**: `CLOUDFLARE_API_TOKEN` (found in
  `Desktop/A1-Inter-LLM-Com/The-New-Fuse/.env`)

## 2. Core Workflow

### Build & Deploy

Always build before deploying to ensure the latest assets are included.

```bash
cd apps/frontend
pnpm build
npx wrangler pages deploy dist --project-name thenewfuse-main --branch main --commit-dirty=true
```

### Git Synchronization

Sync all remotes to maintain codebase integrity.

```bash
git -C Desktop/A1-Inter-LLM-Com/The-New-Fuse add .
git -C Desktop/A1-Inter-LLM-Com/The-New-Fuse commit -m "feat: build and deploy sync"
git -C Desktop/A1-Inter-LLM-Com/The-New-Fuse push next-gen main
git -C Desktop/A1-Inter-LLM-Com/The-New-Fuse push origin main
```

## 3. Configuration Context

### Subdomain Routing

The system distinguishes between `thenewfuse.com` and `app.thenewfuse.com`. For
detailed routing logic and redirect rules, see
[routing.md](references/routing.md).

### Cache Management

- **Automatic**: `wrangler` deployment automatically triggers a Cloudflare edge
  cache purge.
- **Manual**: Use the Cloudflare API or Dashboard to purge specific zones if
  changes are not immediately visible.

### Vite Mode

Ensure `import.meta.env.MODE === 'production'` is used for all
environment-specific logic in the frontend to avoid runtime errors on
Cloudflare.
