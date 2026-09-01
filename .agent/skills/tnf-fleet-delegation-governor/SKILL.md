---
name: tnf-fleet-delegation-governor
category: tnf-platform
department: tech
description:
  Enforces Core Tenet 1 (Fleet Delegation) across the TNF harness framework.
  Instructs agents how to discover live fleet targets, partition multi-stage
  tasks across peer swarms, conduct 3-pass terminal window sweeps using
  AppleScript permanent window IDs and physical Return key events, and verify
  handoff delivery.
---

# TNF Fleet Delegation & Swarm Governor Skill

> **Core Tenet 1:** Maximize available compute by delegating work to specialized
> fleet peers and subagents — single-threaded execution during multi-stage tasks
> is a protocol anti-pattern.

## 1. Fleet Target Discovery Protocol

Before executing heavy or multi-domain work, discover live target agents:

```bash
# Option A: Query active terminal agent runtimes
tnf agents who --json

# Option B: Inspect Redis agent registry
redis-cli hgetall tnf:agent-registry

# Option C: Inspect local registry snapshot
cat ~/.tnf/agent-registry-snapshot.json
```

## 2. Dispatch Channels & Precedence

1. **Direct Peer Channel**: `tnf send "<message>" --to <agentId>`
2. **Durable Handoff Packet**:
   `tnf handoff emit --owner <me> --targets <a,b> --next-actions "<act1>||<act2>"`
3. **Redis Realtime Task Queue**:
   `redis-cli LPUSH tnf:master:tasks:realtime '<QueueTask JSON>'`
4. **Subagent Invocation**: `invoke_subagent` (pro/flash models for parallel
   diagnostics)

## 3. Hardened 3-Pass Terminal Window Sweep (TWIP §6)

When managing or unblocking active terminal UI agents (Codex, Claude, Hermes,
Minimax):

### Pass 1: Pre-Target Inventory (Permanent ID Mapping)

Query all windows by **permanent AppleScript `id`**, NOT z-index ordinal array
indices:

```applescript
tell application "Terminal"
    set resList to {}
    repeat with w in windows
        set wID to (id of w) as integer
        set wName to (name of w) as string
        set hText to (history of selected tab of w) as string
        set end of resList to wID & "|||" & wName & "|||" & (text -500 thru -1 of hText)
    end repeat
    return resList
end tell
```

### Pass 2: Targeted Execution (Hardware Virtual Key Codes)

Target `window id N` directly and submit inputs using physical virtual key
codes:

- **`key code 49`**: Space bar (for toggling interactive multi-choice menus)
- **`key code 36`**: Return/Enter (for submitting prompts and commands)

```applescript
tell application "Terminal"
    activate
    set frontmost of (first window whose id is TARGET_WIN_ID) to true
    delay 0.3
end tell
tell application "System Events"
    tell process "Terminal"
        keystroke "PROMPT_TEXT_HERE"
        delay 0.3
        key code 36 -- Hardware Return
    end tell
end tell
```

### Pass 3: Post-Submission Verification Sweep

Re-query `window id N` history to confirm that the text was ingested and the
process transitioned to `Thinking...` or `Working...`.

## 4. Verification & Delivery Ack

Never assume a dispatch succeeded without checking the ack token:

- Check `tnf:handoff:v1:ack:<packetId>` in Redis.
- Verify subagent completion via `manage_subagents` status checks.
