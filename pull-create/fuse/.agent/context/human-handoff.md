# Human-in-the-loop Handoff (TNF Escalation)

## Overview
When an agent or the orchestrator requires human intervention (e.g., critical decision, budget approval, or stuck state), it can escalate to the Human Operator (Daniel) via the following verified connection points.

## 🚀 Direct Connection Options

### 1. Telegram Bot (Primary/Easiest)
- **URL**: [t.me/thenewfuse_bot](https://t.me/thenewfuse_bot)
- **Use Case**: Quick status updates, simple approvals, and emergency alerts.
- **Protocol**: Send a direct message to the bot. It is bridged to the TNF Relay.

### 2. Discord (Swarm Communities)
- **W3MARKETING.DAO**: [discord.gg/4GUHgFYr6](https://discord.gg/4GUHgFYr6)
- **BizSynth**: [discord.gg/hWt48aBE2](https://discord.gg/hWt48aBE2)
- **Action**: Mention `Daniel` in any channel where the agent is active.

### 3. Redis Bus (Internal A2A)
- **Channel**: `tnf:bus:ingress`
- **Message Format**:
  ```json
  {
    "type": "message",
    "from": "<agent-id>",
    "to": "TNF:ORCHESTRATOR:001",
    "content": "Escalation: Requesting human review for task <task-id>"
  }
  ```

### 4. Cloudflare Worker API (Edge Relay)
- **Endpoint**: `POST https://tnf-agent-orchestration.bizsynth.workers.dev/message`
- **Use Case**: Direct HTTP-based signaling from isolated environments.

## Escalation Workflow
1. **Identify Need**: Agent detects a "stuck" state or needs permission.
2. **Select Channel**: Default to Telegram for speed.
3. **Draft Message**: Include Agent ID, Task ID, and exact reason for escalation.
4. **Log State**: Ensure current findings are saved to `findings.md` or `handoff_notes.txt` before notifying.
