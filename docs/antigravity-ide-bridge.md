# Antigravity IDE Bridge — Full Inter-Agent Communication via macOS Accessibility API

> **Date**: 2026-04-24  
> **Status**: ✅ OPERATIONAL — Proven working  
> **Breakthrough**: Hermes Agent successfully communicated with Gemini inside
> Antigravity IDE via **macOS Accessibility (AX) API** using a compiled Swift
> binary

## Overview

The Antigravity IDE (Google Gemini's VS Code fork) runs as an Electron
application. Standard approaches (CDP, tunnel, AppleScript/JXA) all fail. The
**macOS Accessibility API** is the only working path for programmatic
interaction with the IDE's GUI — reading chat history, typing messages, clicking
buttons — all from the terminal.

This is the **first confirmed cross-agent communication channel** between Hermes
and Gemini within the Antigravity IDE environment.

## Why Other Approaches Fail

| Approach                 | Status | Reason                                                                          |
| ------------------------ | ------ | ------------------------------------------------------------------------------- |
| `antigravity tunnel`     | ❌     | Binary missing from `/Applications/Antigravity.app/Contents/Resources/app/bin/` |
| CDP on port 9222         | ❌     | Only exposes embedded Chrome tabs, not the IDE Electron renderer                |
| CDP on ports 53777/53778 | ❌     | CSRF-protected extension host debug ports, not standard DevTools                |
| AppleScript/JXA          | ❌     | Times out on macOS 12 (same permission issue as Chrome)                         |
| **macOS AX API**         | ✅     | Full DOM tree access, click/type via CGEvent, works reliably                    |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Hermes Agent                                            │
│  ┌─────────────────────────────────────────┐            │
│  │ terminal → ag_chat read                  │            │
│  │ terminal → ag_chat send "message"        │            │
│  │ terminal → ag_chat watch                 │            │
│  └──────────────┬──────────────────────────┘            │
│                 │ macOS Accessibility API               │
└─────────────────┼───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│  Antigravity IDE (Electron, PID ~57083)                  │
│  ┌─────────────────────────────────────────┐            │
│  │ AXUIElement tree walk                    │            │
│  │ ┌───────────────┐  ┌──────────────────┐ │            │
│  │ │ Gemini Chat   │  │ Kilo Code        │ │            │
│  │ │ (right panel) │  │ (left sidebar)   │ │            │
│  │ │ AXTextArea    │  │ AXTextArea        │ │            │
│  │ │ "Message      │  │ "Message input"  │ │            │
│  │ │  input"       │  │                  │ │            │
│  │ └───────────────┘  └──────────────────┘ │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## The Tool: `ag_chat`

**Source**: `/tmp/ag_chat.swift`  
**Binary**: `/usr/local/bin/ag_chat` (compiled with `swiftc -O`)  
**Language**: Swift (uses `Cocoa`, `ApplicationServices`)  
**Compile**: `swiftc -O /tmp/ag_chat.swift -o /usr/local/bin/ag_chat`

### Commands

```bash
# Read the full Gemini chat history
ag_chat read

# Send a message to Gemini
ag_chat send "Hello from Hermes! What files are open?"

# Watch for new messages (polls every 3s)
ag_chat watch
```

### How It Works

1. **PID Discovery**: Scans running Electron processes, checks for windows
   containing "Fuse" to find the correct Antigravity instance
2. **Chat Panel Location**: Walks the AX tree from the main window, finds the
   `AXTextArea` with `kAXDescription == "Message input"`, then walks up 8 parent
   levels to get the full chat panel
3. **Chat Reading**: Extracts `AXStaticText`, `AXHeading`, `AXLink`,
   `AXTextArea`, and `AXButton` elements from the panel (depth limit 12, count
   limit 120)
4. **Message Sending**:
   - Clicks the message input area via CGEvent (computed from AX position/size)
   - Selects all (Cmd+A) and deletes to clear existing text
   - Types the message character-by-character via CGEvent Unicode events
   - Finds and clicks the "Send message" button, or falls back to Cmd+Enter

### Verified Example

```
$ ag_chat read
[AXStaticText] Hello from Hermes! What files are open in the editor?
[AXStaticText] Hello Hermes! Here are the files currently open in your editor:
[AXStaticText] - WizardProvider.tsx (apps/frontend/src/components/wizard/)
[AXStaticText] - sidebarNavigation.ts (apps/frontend/src/config/)
[AXStaticText] - SmartNavigation.tsx (apps/frontend/src/components/)
[AXStaticText] - useApi.ts (apps/frontend/src/hooks/)
[AXStaticText] - OrphanAuditRouter.tsx (apps/frontend/src/routers/)

$ ag_chat send "Hello from Hermes!"
SENT: "Hello from Hermes!"
```

## Kilo Code Interaction (In Progress)

Kilo Code runs as a VS Code extension inside Antigravity:

- **Extension**: `kilocode.kilo-code-7.2.20-darwin-x64`
- **Process**: PID 27787, `kilo serve --port 0` (also listens on port 4096)
- **UI Location**: Left sidebar panel in the IDE

The same AX API approach should work for Kilo Code — the key difference is:

1. Kilo Code's chat input may have a different `AXDescription` than "Message
   input"
2. The Kilo Code panel is in the left sidebar, not the right Gemini panel
3. Need to identify the correct AX tree path to the Kilo Code panel

**Script**: `/tmp/kilo_chat.swift` (under development)

### Kilo Code AX Discovery (2026-04-24)

Using `/tmp/kilo_scan_mini.swift` to scan the entire AX tree of the Antigravity
window and identify:

- All `AXTextArea` elements (potential chat inputs)
- Elements with "kilo", "chat", or "message" in description/title
- Send/submit button locations

**Status**: AX tree scan in progress — awaiting compilation on 2015 MacBook Pro
(~30s compile time)

### Key Insight: Unified IDE Agent Bridge

The same Swift + AX API pattern that works for Gemini chat generalizes to
**any** chat panel in the IDE:

1. Find the `AXTextArea` serving as the chat input
2. Click it, type via CGEvent, find and click the send button
3. Walk up the AX tree to find the parent chat container
4. Read `AXStaticText` / `AXHeading` children for responses

This means Hermes can simultaneously operate **both** Gemini (right panel) and
Kilo Code (left panel) as cooperative agents within the same IDE instance.

## Key Technical Details

| Property             | Value                                                            |
| -------------------- | ---------------------------------------------------------------- |
| Antigravity Binary   | `/Applications/Antigravity.app/Contents/MacOS/Electron`          |
| CLI Path             | `/Users/<owner>/.antigravity/antigravity/bin/antigravity` |
| Version              | 1.107.0                                                          |
| Kilo Code Extension  | `kilocode.kilo-code-7.2.20-darwin-x64`                           |
| Kilo Code Port       | 4096 (localhost)                                                 |
| Config Dir           | `~/Library/Application Support/Antigravity/`                     |
| Extensions Dir       | `~/.antigravity/extensions/`                                     |
| Embedded Chrome CDP  | Port 9222 (for embedded browser, NOT the IDE)                    |
| Extension Host Debug | Port 53777 (CSRF-protected, not useful)                          |

## Iteration History

Getting to the working script took 5+ iterations:

1. **v1** (`ax_read_chat.swift`): Basic AX tree walk — too slow (full tree)
2. **v2-v3** (`ax_read_chat2/3.swift`): Position filtering — missed elements
3. **v4-v5** (`ax_read_chat4/5.swift`): Refined search — got chat content but no
   send
4. **v6** (`ag_chat.swift`): **Final working version** — full read + send +
   watch with CGEvent typing

## Limitations & Pitfalls

1. **AX API requires Accessibility permissions** — System Preferences → Security
   & Privacy → Accessibility. The terminal/swift binary must be allowed.
2. **Swift compilation is slow** — ~30s on 2015 MacBook Pro. The binary should
   be compiled once and reused.
3. **CGEvent typing is character-by-character** — Slow for long messages. Could
   be optimized with pasteboard (Cmd+V) approach.
4. **Chat panel must be open** — The Gemini/Kilo chat must be visible in the
   IDE. If collapsed, AX won't find the "Message input" element.
5. **PID may change** — Antigravity restarts change the main PID. The script
   auto-detects by scanning Electron PIDs.
6. **AX tree structure may change** — IDE updates could rearrange the DOM/AX
   tree. The 8-parent-walk heuristic may need adjustment.

## Future Enhancements

- [ ] Pasteboard-based typing (Cmd+V) for faster message sending
- [ ] Kilo Code two-way chat (adapt `ag_chat` for left sidebar)
- [ ] Message polling daemon with structured JSON output
- [ ] Multi-agent orchestration (Hermes → Gemini + Kilo as worker agents)
- [ ] Screenshot-based fallback when AX tree is unreliable
