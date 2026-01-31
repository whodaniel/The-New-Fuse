# Production Deployment Guide: The New Fuse Marketplace

## 1. Overview

This guide covers the deployment of the Unified AI Assets Marketplace, including
the Backend API (Monetization, Registry), Frontend (PromptBuilder, Storefront),
and Database Schema updates.

## 2. Prerequisites

Ensure the following environment variables are set in your deployment platform
(e.g., Railway).

### Backend (apps/api)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication (if using)
JWT_SECRET=your_jwt_secret

# PayPal (Monetization)
# For Sandbox:
PAYPAL_CLIENT_ID=AT...
PAYPAL_CLIENT_SECRET=E...
# For Production:
NODE_ENV=production
# PAYPAL_CLIENT_ID=... (Live Credentials)
# PAYPAL_CLIENT_SECRET=... (Live Credentials)

# Base URLs
API_URL=https://api.thenewfuse.com
FRONTEND_URL=https://marketplace.thenewfuse.com
```

### Frontend (apps/frontend)

```env
VITE_API_URL=https://api.thenewfuse.com
# Firebase Credentials (if using auth)
VITE_FIREBASE_API_KEY=...
```

## 3. Database Migration

The database schema has been updated to include `marketplace_assets`, `skills`,
and `prompt_packs`. You must run the migrations against your production
database.

**Option A: Manual Migration (Recommended for first run)**

1.  Connect to your production database URL locally.
2.  Run the generation script (if not already done):
    ```bash
    cd packages/database
    pnpm drizzle:generate
    ```
3.  Apply the migration:
    ```bash
    # Set DATABASE_URL env var to your production DB before running this
    export DATABASE_URL="postgresql://user:pass@host:5432/db"
    pnpm drizzle:migrate
    ```

**Option B: CI/CD Migration** Ensure your build pipeline runs
`pnpm drizzle:migrate` before starting the application.

## 4. Deploying Backend

- **Service Name**: `api-server`
- **Root Directory**: `apps/api` (or Monorepo Root if using root `Dockerfile`)
- **Command**: `pnpm start:prod` (or `node dist/main.js`)
- **Port**: `3000` (or injected `PORT`)

## 5. Deploying Frontend

- **Service Name**: `frontend-app`
- **Root Directory**: `apps/frontend`
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start` (or `serve dist`)
- **Domain**: Map `marketplace.thenewfuse.com` to this service in Railway
  settings.

## 6. DNS Configuration (Porkbun)

1.  Log in to Porkbun.
2.  Navigate to DNS Management for `thenewfuse.com`.
3.  Add a **CNAME** record:
    - **Host**: `marketplace`
    - **Answer**: `[your-railway-frontend-domain].up.railway.app` (or whatever
      domain Railway assigns).
4.  Add a **CNAME** record for the API (if separate subdomain):
    - **Host**: `api`
    - **Answer**: `[your-railway-backend-domain].up.railway.app`.

## 7. Verification

1.  Visit `https://marketplace.thenewfuse.com`.
2.  Open **Prompt Builder**.
3.  Click **Publish** -> Login/Auth check -> Submit.
4.  Verify the asset appears in the search index
    (`GET /api/marketplace/assets`).
