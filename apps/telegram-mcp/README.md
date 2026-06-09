# TNF Telegram MCP Integration

Real-time Telegram bot integration with **agent push notifications** for The New
Fuse.

## Architecture

```
┌─────────────┐     ┌────────────────┐     ┌──────────────────┐
│  Telegram   │────▶│   Bot Daemon   │────▶│  messages.jsonl  │
│  @tnf_kilo  │     │  (polls TG API)│     │   (log file)     │
└─────────────┘     └────────────────┘     └────────┬─────────┘
                                                     │
                                            ┌────────▼─────────┐
                                            │ AgentPushService │
                                            │  (watches log)   │
                                            └────────┬─────────┘
                                                     │
                            ┌────────────────────────┼────────────────────────┐
                            │                        │                        │
                   ┌────────▼────────┐      ┌───────▼───────┐      ┌────────▼────────┐
                   │  Agent Registry │      │  Push Queue   │      │ Handoff Packets │
                   │  (active agents)│      │ (per-agent)   │      │ (TNF protocol)  │
                   └─────────────────┘      └───────────────┘      └─────────────────┘
                                                     │
                            ┌────────────────────────┼────────────────────────┐
                            │                        │                        │
                   ┌────────▼────────┐      ┌───────▼───────┐      ┌────────▼────────┐
                   │   Kilo Agent    │      │   MCP Tool    │      │  Stall-Defense  │
                   │   (polls MCP)   │      │ get_pushed_   │      │  (can inject)   │
                   │                 │      │   messages    │      │                 │
                   └─────────────────┘      └───────────────┘      └─────────────────┘
```

## Components

### 1. Bot Daemon (`bot_daemon.py`)

- Polls Telegram Bot API for new messages
- Logs to `data/telegram/messages.jsonl`
- Pushes to agent queues in `data/telegram/push/{agent_id}.jsonl`

### 2. MCP Server (`server.py`)

- Provides MCP tools for Kilo
- Subscription-based push system
- Tools:
  - `register` - Register agent to receive push notifications
  - `unregister` - Unregister agent
  - `heartbeat` - Keep registration alive (call every 60s)
  - `get_pushed_messages` - Poll for new messages
  - `send_message` - Send Telegram message
  - `get_bot_info` - Get bot info
  - `get_updates` - Get recent Telegram API messages
  - `get_logged_messages` - Get all logged messages

### 3. Agent Push Service (`agent-push-service.ts`)

- Watches `messages.jsonl` for new messages
- Reads active agents from `data/telegram/registry/`
- Pushes messages to agent queues
- Creates TNF handoff packets for integration with stall-defense

### 4. Agent Registry

- Located at `data/telegram/registry/{agent_id}.json`
- Tracks: agent_id, registered_at, last_heartbeat, session_key, channel_id
- Agents must heartbeat every 60s to stay active
- Stale registrations (5min+ without heartbeat) are auto-removed

## Setup

### Prerequisites

```bash
pip3 install python-telegram-bot
```

### Environment

```bash
export TELEGRAM_BOT_TOKEN="<telegram-bot-token-from-botfather>"
```

### Start All Services

```bash
cd /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/telegram-mcp

# Start bot daemon
python3 bot_daemon.py &

# Start push service
npx ts-node agent-push-service.ts &
```

## Agent Registration Flow

### 1. Register

Agent calls MCP tool `register`:

```json
{
  "name": "register",
  "arguments": {
    "agent_id": "kilo-glm5-session"
  }
}
```

Response:

```json
{
  "status": "registered",
  "agent_id": "kilo-glm5-session"
}
```

### 2. Keep Alive (heartbeat every 60s)

```json
{
  "name": "heartbeat",
  "arguments": {
    "agent_id": "kilo-glm5-session"
  }
}
```

### 3. Poll for Messages

```json
{
  "name": "get_pushed_messages",
  "arguments": {
    "agent_id": "kilo-glm5-session",
    "clear": true
  }
}
```

Response:

```json
{
  "messages": [
    {
      "message_id": 15,
      "chat_id": 7030202773,
      "text": "Hello from Telegram!",
      "from_user": "Daniel_Who",
      "date": "2026-04-17T15:45:00Z"
    }
  ],
  "count": 1
}
```

### 4. Unregister (when done)

```json
{
  "name": "unregister",
  "arguments": {
    "agent_id": "kilo-glm5-session"
  }
}
```

## Integration with TNF Stall-Defense

The Agent Push Service creates TNF handoff packets in `data/handoff/`:

- Follows TNF handoff protocol with gate decisions
- Can be picked up by stall-defense recovery mechanism
- Enables message injection into stalled conversations

## File Structure

```
data/telegram/
├── messages.jsonl          # All received messages
├── config.json             # Bot configuration
├── daemon.log              # Bot daemon log
├── push-service.log        # Push service log
├── registry/               # Agent registrations
│   └── {agent_id}.json     # Per-agent registration
└── push/                   # Agent message queues
    └── {agent_id}.jsonl    # Per-agent pending messages

data/handoff/
└── {agent_id}-{timestamp}.json  # TNF handoff packets
```

## Current Status

- **Bot**: configured with `TELEGRAM_BOT_TOKEN`
- **Daemon**: Running (PID: check with `pgrep -f bot_daemon`)
- **Push Service**: Running (PID: check with `pgrep -f agent-push-service`)
- **MCP**: Connected to Kilo
- **Agent Registration**: register each agent with the `register` tool

## Usage in Kilo

Ask me to:

- "check telegram" - Poll for new messages
- "send telegram message to {chat_id}: {text}" - Send a message
- "register for telegram" - Register this session
- "show telegram messages" - Show recent messages
