# TNF Cloud Terminal & Super Director Deployment Guide

## 1. Overview
The **Super Director** (Agent TNF) now has the capability to run a live, interactive terminal in the cloud (CloudRuntime). This enables the use of **Cline CLI** for **Nvidia API** (NIM) access and **OAuth** authentication directly from the cloud environment.

## 2. Infrastructure
The Cloud Terminal is built into the `tnf-cloud-sandbox` service:
- **PTY Engine**: `node-pty` (Native C++ module).
- **WebSocket Bridge**: Exposed at `/ws/terminal`.
- **Tools**: `cline` CLI is pre-installed in the container.

## 3. Deployment Steps

### Step 1: Update CloudRuntime Environment
Ensure the following variables are set in your CloudRuntime `tnf-cloud-sandbox` service:
- `JWT_SECRET`: (Existing)
- `DATABASE_URL`: (Existing)
- `CLOUD_RUNTIME_PUBLIC_DOMAIN`: Your service's public URL (e.g., `tnf-cloud-sandbox-production.thenewfuse.com`).
- `CLINE_API_KEY`: (Optional) Your Nvidia NIM API key if not using OAuth.

### Step 2: Build and Deploy
Trigger a new deployment. The `Dockerfile.cloud_runtime` will automatically:
1. Install build tools (`make`, `g++`, `gcc`).
2. Build the `node-pty` native module.
3. Install the `cline` CLI globally.

### Step 3: Connect
The Super Director can now use the `get_terminal_access` tool to get the WebSocket URL. 

## 4. Headless OAuth Flow (For Nvidia/Cline)
If you need to use OAuth in the cloud terminal:
1. Open the terminal via WebSocket (or `cloud_runtime exec`).
2. Run `cline auth`.
3. The CLI will print an OAuth URL.
4. **Copy** that URL and open it in your **local browser**.
5. Complete the login.
6. The cloud-resident `cline` will detect the success and save the session in `/home/app-user/.config/cline`.

## 5. Running Directives
The Super Director can now pulse the swarm autonomously:
```bash
cline -y "BROADCAST: [Mission] All Claw agents must verify resource availability in local lanes."
```
