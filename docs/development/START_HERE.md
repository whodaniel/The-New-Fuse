# 🚀 Deploy The New Fuse to CloudRuntime - START HERE

> ⚠️ **RETIRED DEPLOYMENT PATH — do not run these commands.** This guide targets
> Railway. The `cloud_runtime` spelling is the result of a blind `railway` →
> `cloud_runtime` string-replace (commit 62b2a3e2f); no `cloud_runtime` CLI has
> ever existed, so every such command below will fail. TNF deploys on **GCP
> Cloud Run + Cloudflare + Supabase + Upstash**: use
> `scripts/deployment/gcp-deploy.sh` for services (via
> `scripts/deployment/cloudbuild.yaml`) and
> `npx wrangler pages deploy dist --project-name=thenewfuse-main --branch=main`
> for the frontend. Retained for historical reference only.

## Quick 3-Step Process

### Step 1: Create Services in Dashboard (5 min)

Visit: https://thenewfuse.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1

Create 4 empty services:

- Click "+ New" → "Empty Service" → Name: `api`
- Click "+ New" → "Empty Service" → Name: `backend`
- Click "+ New" → "Empty Service" → Name: `api-gateway`
- Click "+ New" → "Empty Service" → Name: `frontend`

### Step 2: Run Deployment Script (60-80 min)

```bash
cd .
./deploy-to-services.sh
```

### Step 3: Configure Variables (10 min)

While builds run, add environment variables in CloudRuntime dashboard.

**Generate JWT Secret first:**

```bash
openssl rand -base64 32
```

Then add variables for each service (see FINAL_DEPLOYMENT_STEPS.md for details).

## 📚 Documentation

- **DEPLOYMENT_SUMMARY.md** - Quick overview
- **FINAL_DEPLOYMENT_STEPS.md** - Detailed guide
- **CLOUD_RUNTIME_DEPLOYMENT_INSTRUCTIONS.md** - Complete reference

## 🆘 Need Help?

Check the logs:

```bash
cloud_runtime logs --service <service-name>
```

Visit dashboard:
https://thenewfuse.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1

## ✅ When You're Done

All 4 services will be live and running!

- Frontend: Your app UI
- API Gateway: Request router
- API: Main backend
- Backend: Additional services

**Questions?** Read FINAL_DEPLOYMENT_STEPS.md
