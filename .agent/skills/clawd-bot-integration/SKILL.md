---
name: clawd-bot-integration
description:
  Integration with Clawdbot for local, proactive, and persistent AI assistance.
  Enables TNF agents to leverage Clawdbot's skills and system access via Cloud
  Sandbox.
---

# Clawdbot Integration Skill

## Purpose

Enable TNF agents to synergize with **Clawdbot**, leveraging its capabilities
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

```

### 3. Execution

The `ClawdEngine` interprets the skill code. It executes logic locally in a VM,
but all calls to `browser.*`, `shell.*`, and `fs.*` are bridged to the
remote Cloud Sandbox via WebSocket.

## Advanced: Subscriptions

The Engine listens to real-time events from the Sandbox (e.g., screenshots, logs).
These frames are forwarded to the agent's event stream.

---
```
