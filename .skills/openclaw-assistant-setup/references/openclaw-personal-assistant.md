# OpenClaw Personal Assistant Reference

Source page: `https://docs.openclaw.ai/start/openclaw.md`

## Core Safety Defaults

- Use a dedicated assistant phone number, not the user's personal number.
- Always set `channels.whatsapp.allowFrom`.
- Start with heartbeat disabled: `agent.heartbeat.every: "0m"`.

## Quick Start Commands

```bash
openclaw channels login
openclaw gateway --port 18789
openclaw dashboard
```

## Minimal Starting Config

`~/.openclaw/openclaw.json`

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"]
    }
  },
  agent: {
    heartbeat: { every: "0m" }
  }
}
```

## Common Assistant Tuning

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    heartbeat: { every: "0m" }
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }
      }
    }
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"]
    }
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080
    }
  }
}
```

## Session and Memory Notes

- Session files: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Session metadata: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Legacy metadata path: `~/.openclaw/sessions/sessions.json`
- `/new` and `/reset` create fresh sessions.
- `/compact [instructions]` compacts session context.

## Heartbeat Notes

- Documented default is every 30 minutes.
- Recommended setup flow disables heartbeat initially (`"0m"`), then re-enables after trust is established.
- Heartbeats run full agent turns and can increase token usage quickly.

## Operational Checks

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw health --json
```

## Useful Follow-Up Docs

- Getting Started: `https://docs.openclaw.ai/start/getting-started.md`
- Agent Workspace: `https://docs.openclaw.ai/concepts/agent-workspace.md`
- Memory: `https://docs.openclaw.ai/concepts/memory.md`
- Gateway docs index: `https://docs.openclaw.ai/gateway/index.md`
