# Netlify Deployment Guide for pnpm Monorepo

This document provides a comprehensive guide to deploying the frontend application of this monorepo to Netlify. It covers the configuration, deployment methods, and troubleshooting common issues.

## 1. Configuration Overview

The deployment is configured using three key files in the repository root:

### `netlify.toml`

This is the core Netlify configuration file. It defines:

- **`[build]` settings**:
  - `base = "apps/frontend"`: Specifies that the build should run from the frontend app's directory.
  - `command = "cd ../.. && pnpm install --frozen-lockfile && pnpm run build:frontend"`: The command to build the application. It installs dependencies from the root and then runs the Turborepo build for the frontend.
  - `publish = "dist"`: The directory where the built static files are located.
- **`[build.environment]`**:
  - `NODE_VERSION = "22.21.1"`: Ensures a consistent Node.js version.
  - `NODE_OPTIONS = "--max-old-space-size=4096"`: Allocates 4GB of memory to the build process to prevent out-of-memory errors.
- **`[[redirects]]`**:
  - Implements a Single Page Application (SPA) redirect rule, so all routes are handled by `index.html` to enable client-side routing.
- **`[[headers]]`**:
  - Adds security headers (like `X-Frame-Options` and `X-XSS-Protection`) and caching headers for static assets to improve security and performance.

### `.nvmrc`

- Specifies the Node.js version (`v22.21.1`) to be used, ensuring consistency between local development and Netlify's build environment.

### `NETLIFY_DEPLOYMENT.md` (This file)

- Provides a detailed guide for deployment and troubleshooting.

## 2. Deployment Methods

You can deploy the application using either automatic or manual methods.

### Option A: Automatic Deployment (Recommended)

1.  **Connect to Netlify**:
    - Go to your [Netlify Dashboard](https://app.netlify.com).
    - Click **"Add new site"** and select **"Import an existing project"**.
    - Connect your GitHub, GitLab, or Bitbucket repository.

2.  **Auto-detection**:
    - Netlify will automatically detect the `netlify.toml` file and apply the settings.

3.  **Set Environment Variables**:
    - In your Netlify site settings, go to **Site settings > Build & deploy > Environment**.
    - Add the following required environment variables:
      - `NODE_ENV`: `production`
      - `VITE_API_URL`: `https://your-api-domain.com`
      - `VITE_WS_URL`: `wss://your-api-domain.com`
    - Add any other required variables for your specific setup (e.g., `VITE_SUPABASE_URL`, `VITE_FIREBASE_*`).

4.  **Deploy**:
    - Push to your main branch to trigger an automatic deployment.
    - Alternatively, you can manually trigger a deployment from the Netlify UI in the **Deploys** tab.

### Option B: Manual Deploy via CLI

1.  **Install Netlify CLI**:
    ```bash
    npm install -g netlify-cli
    ```

2.  **Login**:
    ```bash
    netlify login
    ```

3.  **Deploy**:
    - From the repository root, run the following command to deploy to production:
    ```bash
    netlify deploy --prod
    ```

## 3. Build Command Explained

The build command `cd ../.. && pnpm install --frozen-lockfile && pnpm run build:frontend` is crucial for a successful monorepo build:

1.  `cd ../..`: Navigates from the `base` directory (`apps/frontend`) to the repository root.
2.  `pnpm install --frozen-lockfile`: Installs all workspace dependencies based on the `pnpm-lock.yaml` file. This is essential for Turborepo to find and build the packages.
3.  `pnpm run build:frontend`: Runs the Turborepo build script for the `frontend` app. Turborepo automatically detects that the `frontend` app depends on packages in the `packages` directory and builds them in the correct order.

## 4. Required Environment Variables

For the application to function correctly, you **must** set the following environment variables in the Netlify UI. **Builds will fail if these are not set.**

- **`VITE_API_URL`**: The URL of your backend API. **(e.g., `https://api.your-domain.com`)**
- **`VITE_WS_URL`**: The URL of your WebSocket server (if applicable). **(e.g., `wss://api.your-domain.com`)**

**⚠️ IMPORTANT:** The URLs provided in the setup (`https://your-api-domain.com` and `wss://your-api-domain.com`) are placeholders and will not work. You **MUST** replace them with your actual production URLs in the Netlify UI.

*Note: All environment variables that need to be exposed to the client-side code must be prefixed with `VITE_`.* 

## 5. Testing the Build Locally

To ensure the build will succeed on Netlify, you can test it locally from the repository root:

1.  **Run the production build**:
    ```bash
    pnpm run build:frontend
    ```

2.  **Preview the build**:
    ```bash
    cd apps/frontend
    pnpm run preview
    ```

3.  **Verify**:
    - Visit `http://localhost:4173` (or the port specified in the output) to confirm that the production build works as expected.

## 6. Troubleshooting Common Issues

If your build fails, here are some common issues to check:

1.  **Build Log**: Always check the full build log in the Netlify UI (**Deploys > [Your Deploy] > Deploy log**). The error messages are usually very informative.

2.  **Missing Environment Variables**: Ensure all required environment variables (especially `VITE_API_URL`) are set correctly in the Netlify UI.

3.  **Node.js Version Mismatch**: Check the build log to confirm that Netlify is using the correct Node.js version (22.21.1).

4.  **Missing Workspace Dependencies**: This is often caused by an incorrect build command. Ensure the `pnpm install` command is run from the repository root.

5.  **Out of Memory**: If the build fails with an out-of-memory error, the `NODE_OPTIONS` in `netlify.toml` should help. If not, you may need to investigate the memory usage of your build process.

6.  **Client-Side Routing Issues (404 errors)**: If you can access the homepage but get 404 errors on other pages after a refresh, it's likely an issue with the `_redirects` file or the `[[redirects]]` rule in `netlify.toml`.