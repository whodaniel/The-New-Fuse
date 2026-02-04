---
name: clawd-bot-integration
description: |
  Integration with OpenClaw (formerly Clawdbot) for local, proactive, and 
  persistent AI assistance. Enables TNF agents to leverage OpenClaw's skills 
  and system access via Cloud Sandbox.
aliases:
  - openclaw-integration
  - clawdbot-integration
---

# OpenClaw Integration Skill

> **Note**: OpenClaw was previously known as "Clawdbot" (Nov 2025) and "Moltbot"
> (Dec 2025). The TNF codebase uses the "Clawd" naming convention but follows
> OpenClaw protocols.

## Purpose

Enable TNF agents to synergize with **OpenClaw**, leveraging its capabilities
for:

- **Browser Automation**: Control a headless browser via the Cloud Sandbox.
- **System Automation**: Execute shell commands and file operations safely in a
  remote environment.
- **Proactive Actions**: Schedule tasks using the integrated scheduler.

## Architecture

This skill uses a **Hybrid Controller-Worker** model:

1.  **Controller (ClawdEngine)**: Runs within the `UnifiedAgent`. Handles skill
    logic, scheduling (cron), and orchestration.
2.  **Worker (Cloud Sandbox)**: A remote service (MCP Server) that executes
    heavy/unsafe tools (Browser, Shell).

```
┌─────────────────────────────────────────┐
│           ClawdEngine (Controller)       │
│   - Skill Parsing & Orchestration        │
│   - Cron Scheduling                      │
│   - API Bridging                         │
└────────────────┬────────────────────────┘
                 │ WebSocket/JSON-RPC
                 ▼
┌─────────────────────────────────────────┐
│         Cloud Sandbox (Worker)           │
│   - Browser (Playwright)                 │
│   - Shell Execution                      │
│   - File Operations                      │
│   - RBAC & Quotas                        │
└─────────────────────────────────────────┘
```

## Usage

### 1. Requirements

- `apps/cloud-sandbox` running (locally or on Railway).
- `CLAWD_SANDBOX_URL` environment variable set (defaults to
  `ws://localhost:3000`).

### 2. Creating Skills

Create Markdown files in `~/.clawd/skills/`.

**Template:**

````markdown
# My Automation

## Usage

Run this daily to check the server status.

## Implementation

```javascript
// You have access to 'browser', 'shell', 'fs', 'console'
console.log('Starting check...');

// Browser Automation
await browser.navigate('https://status.thenewfuse.com');
const content = await browser.content();
console.log('Status page content length:', content.length);

if (content.includes('Down')) {
  console.log('ALERT directly from skill!');
}

// Shell Automation
const res = await shell.exec('echo "Log entry" >> /tmp/status.log');
console.log('Log updated:', res.stdout);
```
````

### 3. Execution

The `ClawdEngine` interprets the skill code. It executes logic locally in a VM,
but all calls to `browser.*`, `shell.*`, and `fs.*` are bridged to the remote
Cloud Sandbox via WebSocket.

## Security Guidelines

> ⚠️ **Important**: OpenClaw/Clawdbot has known security vulnerabilities. Follow
> these guidelines to protect your system.

### DO:

- ✅ Run Cloud Sandbox in an isolated container
- ✅ Use environment variables for credentials (never hardcode)
- ✅ Audit skills before execution
- ✅ Enable RBAC on Cloud Sandbox endpoints
- ✅ Use sandboxed browser profiles (not your daily driver)

### DON'T:

- ❌ Execute skills from untrusted sources without review
- ❌ Expose Cloud Sandbox ports to public internet
- ❌ Pass API keys or secrets in skill arguments
- ❌ Disable sandbox isolation for convenience
- ❌ Grant elevated permissions to external agents

### Credential Handling

```javascript
// WRONG - Hardcoded secrets
const apiKey = 'sk-1234567890abcdef';

// RIGHT - Use environment variables
const apiKey = process.env.MY_API_KEY;
```

### Skill Verification (Recommended)

Before executing a new skill:

1. Read the skill's `Implementation` section
2. Check for suspicious patterns:
   - External network requests to unknown domains
   - File access outside working directory
   - Credential harvesting (reading env vars excessively)
3. Test in isolated environment first

## Advanced: Subscriptions

The Engine listens to real-time events from the Sandbox (e.g., screenshots,
logs). These frames are forwarded to the agent's event stream.

## Related Files

| Component           | Location                                                    |
| ------------------- | ----------------------------------------------------------- |
| ClawdEngine         | `packages/agent/src/implementations/ClawdEngine.ts`         |
| ClawdSandbox        | `packages/agent/src/implementations/ClawdSandbox.ts`        |
| ClawdScheduler      | `packages/agent/src/implementations/ClawdScheduler.ts`      |
| RemoteSandboxClient | `packages/agent/src/implementations/RemoteSandboxClient.ts` |
| Cloud Sandbox       | `apps/cloud-sandbox/`                                       |

---

_Updated: 2026-02-03 - Added security guidelines and OpenClaw naming notes_
