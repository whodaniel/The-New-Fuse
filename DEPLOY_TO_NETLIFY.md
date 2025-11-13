# Deploy The New Fuse to Netlify - Complete Guide

This guide provides step-by-step instructions for deploying The New Fuse AI Agent orchestration framework to Netlify.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Deployment Options](#deployment-options)
4. [Option A: Automatic Deployment via GitHub](#option-a-automatic-deployment-via-github)
5. [Option B: Manual Deployment via CLI](#option-b-manual-deployment-via-cli)
6. [Environment Variables Setup](#environment-variables-setup)
7. [Netlify Functions](#netlify-functions)
8. [Testing the Deployment](#testing-the-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Post-Deployment](#post-deployment)

---

## Prerequisites

Before deploying to Netlify, ensure you have:

- **A Netlify account** - Sign up at [https://www.netlify.com](https://www.netlify.com)
- **A GitHub account** with this repository (whodaniel/fuse)
- **Node.js** v22.21.1 installed (check with `node --version`)
- **pnpm** v10.20.0+ installed (check with `pnpm --version`)
- **Your backend API deployed** somewhere (Railway, Render, Heroku, etc.) - you'll need the URL

---

## Project Overview

This monorepo contains:

- **Frontend App** (`apps/frontend`) - React + Vite application
- **Netlify Functions** (`netlify/functions`) - Serverless API endpoints
- **Backend API** (`apps/api`) - NestJS API (deploy separately to Railway/Render)

The Netlify deployment will serve:
1. The static frontend application
2. Serverless functions at `/.netlify/functions/*`

---

## Deployment Options

### Option A: Automatic Deployment via GitHub

This is the **recommended approach** for production deployments.

#### Step 1: Connect Repository to Netlify

1. **Log in to Netlify**
   - Go to [https://app.netlify.com](https://app.netlify.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click **"Add new site"** → **"Import an existing project"**
   - Select **"GitHub"** as your Git provider
   - Authorize Netlify to access your GitHub account
   - Find and select the `whodaniel/fuse` repository

3. **Configure Build Settings**

   Netlify should auto-detect the `netlify.toml` file, but verify these settings:

   - **Base directory**: `.` (root)
   - **Build command**: `pnpm install --frozen-lockfile && pnpm run build:frontend`
   - **Publish directory**: `apps/frontend/dist`
   - **Functions directory**: `netlify/functions`

4. **Set Environment Variables** (Critical!)

   Before deploying, click **"Show advanced"** and add the following environment variables:

   ```
   NODE_ENV=production
   NODE_VERSION=22.21.1
   NODE_OPTIONS=--max-old-space-size=4096
   VITE_API_URL=https://your-backend-api.railway.app
   VITE_WS_URL=wss://your-backend-api.railway.app
   ```

   ⚠️ **Important**: Replace `your-backend-api.railway.app` with your actual backend API URL!

5. **Deploy**
   - Click **"Deploy site"**
   - Netlify will start building your site
   - Watch the build logs for any errors
   - Once complete, you'll get a URL like `https://your-app-name.netlify.app`

6. **Configure Custom Domain** (Optional)
   - Go to **Site settings** → **Domain management**
   - Click **"Add custom domain"**
   - Follow the instructions to configure DNS

---

### Option B: Manual Deployment via CLI

Use this for quick tests or if you prefer command-line deployment.

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login to Netlify

```bash
netlify login
```

This will open a browser window for authentication.

#### Step 3: Link Your Site

From the repository root:

```bash
netlify init
```

Follow the prompts to:
- Create a new site or link to an existing one
- Configure build settings (use the values from netlify.toml)

#### Step 4: Set Environment Variables

```bash
netlify env:set NODE_ENV production
netlify env:set NODE_VERSION 22.21.1
netlify env:set NODE_OPTIONS "--max-old-space-size=4096"
netlify env:set VITE_API_URL "https://your-backend-api.railway.app"
netlify env:set VITE_WS_URL "wss://your-backend-api.railway.app"
```

#### Step 5: Deploy

**For a test deploy:**
```bash
netlify deploy
```

**For a production deploy:**
```bash
netlify deploy --prod
```

---

## Environment Variables Setup

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `NODE_VERSION` | Node.js version | `22.21.1` |
| `NODE_OPTIONS` | Node memory limit | `--max-old-space-size=4096` |
| `VITE_API_URL` | Backend API URL | `https://api.thenewfuse.com` |
| `VITE_WS_URL` | WebSocket URL | `wss://api.thenewfuse.com` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSy...` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `my-project` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJh...` |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | `true` / `false` |

> **Note**: All variables prefixed with `VITE_` are exposed to the client-side code. Never put secrets in `VITE_` variables!

See `.env.netlify.example` for the complete list of environment variables.

---

## Netlify Functions

Serverless functions are located in `netlify/functions/`. These run as AWS Lambda functions and are accessible at:

```
https://your-site.netlify.app/.netlify/functions/[function-name]
```

### Available Functions

1. **hello.ts**
   - Endpoint: `/.netlify/functions/hello`
   - Method: `GET`
   - Description: Simple hello world test function

2. **api.ts**
   - Endpoint: `/.netlify/functions/api/*`
   - Methods: `GET`, `POST`, `PUT`, `DELETE`
   - Description: Main API router with the following sub-routes:
     - `/status` - Get API status
     - `/users` - User management endpoints
     - `/health` - Health check endpoint

### Testing Functions Locally

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Start local development server
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse
netlify dev
```

This will:
- Start the frontend dev server
- Start the functions server
- Proxy functions at `http://localhost:8888/.netlify/functions/`

### Adding New Functions

1. Create a new `.ts` file in `netlify/functions/`
2. Export a `handler` function:

```typescript
import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello!" }),
  };
};
```

3. Deploy - Netlify will automatically detect and deploy the new function

---

## Testing the Deployment

### 1. Test the Frontend

After deployment, visit your Netlify URL:

```
https://your-app-name.netlify.app
```

Check that:
- The page loads without errors
- Client-side routing works (navigate to different routes and refresh)
- API calls to your backend are working

### 2. Test Netlify Functions

**Test the hello function:**
```bash
curl https://your-app-name.netlify.app/.netlify/functions/hello
```

Expected response:
```json
{
  "message": "Hello from Netlify Functions!",
  "timestamp": "2025-11-13T...",
  "path": "/.netlify/functions/hello",
  "method": "GET"
}
```

**Test the API function:**
```bash
curl https://your-app-name.netlify.app/.netlify/functions/api/status
```

Expected response:
```json
{
  "status": "operational",
  "timestamp": "2025-11-13T...",
  "version": "1.0.0"
}
```

### 3. Check Build Logs

If something isn't working:
1. Go to **Netlify Dashboard** → **Deploys**
2. Click on the latest deploy
3. Review the **Deploy log** for errors

---

## Troubleshooting

### Build Fails with "Module not found"

**Problem**: Missing workspace dependencies

**Solution**: The build command in `netlify.toml` should be:
```toml
command = "pnpm install --frozen-lockfile && pnpm run build:frontend"
```

This ensures all monorepo packages are installed before building.

---

### Build Fails with "Out of Memory"

**Problem**: Node.js running out of memory during build

**Solution**: Increase memory limit in environment variables:
```
NODE_OPTIONS=--max-old-space-size=8192
```

---

### 404 Errors on Page Refresh

**Problem**: Client-side routing not working after page refresh

**Solution**: Verify the `[[redirects]]` section in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### API Calls Failing

**Problem**: Frontend can't reach the backend API

**Solutions**:
1. Verify `VITE_API_URL` is set correctly in Netlify environment variables
2. Check CORS settings on your backend API
3. Ensure your backend is deployed and accessible
4. Check browser console for CORS errors

---

### Functions Return 500 Error

**Problem**: Netlify function is crashing

**Solutions**:
1. Check function logs: **Netlify Dashboard** → **Functions** → **[Function Name]** → **Logs**
2. Test locally with `netlify dev`
3. Ensure all dependencies are listed in `netlify/functions/package.json`

---

### Build Takes Too Long / Times Out

**Problem**: Build exceeds Netlify's time limit (15 minutes on free tier)

**Solutions**:
1. Optimize your build by removing unnecessary dependencies
2. Use build caching (Netlify does this automatically)
3. Consider upgrading to a paid Netlify plan for longer build times

---

## Post-Deployment

### 1. Set Up Continuous Deployment

With GitHub integration, Netlify automatically deploys when you push to your repository:

- **Production**: Pushes to `main` branch → Auto-deploy to production
- **Preview**: Pull requests → Auto-deploy to preview URLs

### 2. Configure Deploy Notifications

1. Go to **Site settings** → **Build & deploy** → **Deploy notifications**
2. Add notifications for:
   - Deploy succeeded
   - Deploy failed
   - Deploy started

### 3. Monitor Performance

- **Netlify Analytics**: Site settings → Analytics (paid feature)
- **Function Logs**: Functions tab → View real-time logs
- **Build Performance**: Review build times and optimize as needed

### 4. Set Up Custom Domain

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic with Let's Encrypt)

### 5. Optimize for Production

- **Enable Asset Optimization**: Site settings → Build & deploy → Post processing
- **Configure Headers**: Already set in `netlify.toml`
- **Set up Form Handling**: If using Netlify Forms
- **Configure Redirects**: For legacy URLs or URL shortening

---

## Quick Reference Commands

```bash
# Install dependencies
pnpm install

# Build frontend locally
pnpm run build:frontend

# Test production build locally
cd apps/frontend && pnpm run preview

# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Test locally with functions
netlify dev

# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod

# View function logs
netlify functions:log [function-name]

# List environment variables
netlify env:list
```

---

## Next Steps

1. ✅ Deploy backend API to Railway/Render (if not done already)
2. ✅ Set up Netlify deployment (you're here!)
3. ✅ Configure environment variables
4. ✅ Test deployment
5. ⬜ Set up custom domain
6. ⬜ Configure monitoring and analytics
7. ⬜ Set up CI/CD optimizations

---

## Support & Resources

- **Netlify Documentation**: [https://docs.netlify.com](https://docs.netlify.com)
- **Netlify Functions Docs**: [https://docs.netlify.com/functions/overview/](https://docs.netlify.com/functions/overview/)
- **Project Repository**: [https://github.com/whodaniel/fuse](https://github.com/whodaniel/fuse)
- **Netlify Community**: [https://answers.netlify.com](https://answers.netlify.com)

---

**Happy Deploying! 🚀**
