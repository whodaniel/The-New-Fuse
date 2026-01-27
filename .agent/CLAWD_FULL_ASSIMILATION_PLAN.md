# Clawdbot Full Assimilation Plan (REVISED)

## Goal

Fully implement Clawdbot capabilities in TNF by leveraging EXISTING
infrastructure (Cloud Sandbox, Job Scheduler) instead of redundant
reimplementation.

## Architecture Update

The user correctly identified that `apps/cloud-sandbox` and `apps/backend`
already provide the execution and scheduling environments. The `packages/agent`
should act as the coordinator/client, not the host.

| Capability     | Old Plan (Redundant)      | New Plan (Synergistic)                             |
| -------------- | ------------------------- | -------------------------------------------------- |
| **Sandboxing** | Local `vm` implementation | Connect to `apps/cloud-sandbox` service            |
| **Browser**    | Local Puppeteer           | Connect to `apps/cloud-sandbox` (Playwright)       |
| **Scheduling** | Local `node-cron`         | Connect to `jobs/JobSchedulerService` (Redis/Bull) |

## Implementation Steps

### 1. Remote Connectivity (The "Cloud Sandbox" Link)

- [x] Create `RemoteSandboxClient` in `packages/agent`.
- [ ] Update `ClawdEngine` to use `RemoteSandboxClient` instead of local
      `ClawdSandbox`/`ClawdBrowser`.

### 2. Distributed Scheduling

- [ ] Connect `ClawdEngine` to the centralized Redis instance defined in
      `packages/infrastructure`.
- [ ] Update `ClawdScheduler` to push jobs to the Bull queue instead of local
      cron.

### 3. Cleanup

- [ ] Remove `ClawdSandbox.ts` (Local VM).
- [ ] Remove `ClawdBrowser.ts` (Local Puppeteer).
- [ ] Remove `ClawdScheduler.ts` (Local Cron) - _Deferred until Redis connection
      established_.

## Execution Status

- Discovered `apps/cloud-sandbox` service (fully capable MCP server).
- Created `RemoteSandboxClient` to bridge Agent -> Sandbox.
- Pending: Wiring `ClawdEngine` to use the new remote client.
