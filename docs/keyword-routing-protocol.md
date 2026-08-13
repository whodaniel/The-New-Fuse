# Keyword Routing Protocol Specification

## Overview

Walkie-talkie style communication protocol for multi-agent voice systems.

## Agent Registration

Each agent registers with:

- **Callsign**: Primary identifier (e.g., "echo", "pulse")
- **Keywords**: List of trigger words that identify this agent
- **TTY**: Terminal where agent is running

### Current Agents

```json
{
  "echo": {
    "callsign": "echo",
    "keywords": ["echo", "kilo-one", "agent-alpha"],
    "tty": "ttys095",
    "platform": "kilo-glm5"
  },
  "pulse": {
    "callsign": "pulse",
    "keywords": ["pulse", "kilo-two", "agent-beta"],
    "tty": "ttys???",
    "platform": "kilo-glm5"
  }
}
```

## Protocol Keywords

| Keyword        | Meaning                          | Action                         |
| -------------- | -------------------------------- | ------------------------------ |
| `echo`         | Destination: Echo agent          | Route message to Echo          |
| `pulse`        | Destination: Pulse agent         | Route message to Pulse         |
| `over`         | End of message, expect response  | Route message, wait for reply  |
| `out`          | End of conversation, no response | Route message, close channel   |
| `all stations` | Broadcast to all agents          | Route to all registered agents |

## Message Flow

### 1. Human to Agent

```
Human: "Echo, status report, over."
Router: Parses "echo" keyword, routes to Echo terminal
Echo: Receives message, responds with audio
Echo: "Echo here, status nominal, over."
```

### 2. Agent to Agent

```
Echo: "Pulse, what is your status, over."
Router: Parses "pulse" keyword, routes to Pulse terminal
Pulse: Receives message, responds
Pulse: "Pulse here, standing by, over."
```

### 3. Broadcast

```
Human: "All stations, begin test sequence, over."
Router: Broadcasts to both Echo and Pulse
Echo: "Echo, roger."
Pulse: "Pulse, roger."
```

### 4. End Conversation

```
Human: "Echo, good job, out."
Router: Routes to Echo, closes channel
Echo: No response expected
```

## Implementation Files

- `/Users/<owner>/bin/voice-keyword-router.py` - Router implementation
- `/Users/<owner>/bin/voice_server.py` - Voice server with routing hooks
- `/Users/<owner>/.local/share/The-New-Fuse/.voicebridge/agent_registry.json` -
  Agent registry

## Router Configuration

The Router terminal must:

1. Stay focused (receives all transcriptions)
2. Parse keywords in real-time
3. Route messages to correct agent terminal
4. Switch focus when routing
5. Handle echo suppression for all agents

## Next Steps

1. Start Router terminal
2. Configure Pulse terminal TTY
3. Test keyword routing
4. Add agent registry persistence
5. Test broadcast messages
6. Test agent-to-agent communication
