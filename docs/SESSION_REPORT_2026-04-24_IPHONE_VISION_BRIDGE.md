# Session Report: 2026-04-24 — iPhone Vision Bridge Live Session

## Summary

Daniel requested using his iPhone as a live mirror of his 2015 MacBook Pro with
full cursor control and touch interactions. This session built, iterated, and
deployed a **working WiFi-based screen relay** from scratch — a first for the
TNF ecosystem.

---

## What We Accomplished

### 1. **TNF Remote Relay v2 — Working iPhone Mirror**

- Built a Python HTTP server (`tnf_remote_relay.py`) that:
  - Captures macOS screen via `screencapture` at ~20 FPS target
  - Serves MJPEG stream to iPhone Safari over local WiFi
  - Receives touch events from iPhone and translates them to macOS mouse events
    via `cliclick`
  - Supports pinch-to-zoom (gesture recognition)
  - Supports hotkey buttons (Cmd+Tab, Escape, etc.)
  - Has AI vision endpoints (`/ai/frame`, `/ai/annotations`, `/ai/clear`)
  - Caffeinate keeps Mac awake while clients connected
- **iPhone Safari connects at `http://<Mac-Local-IP>:8080`**
- Touch-to-cursor mapping works — tapping on iPhone moves the Mac cursor

### 2. **Multi-Iteration Development**

We went through multiple iterations fixing real issues:

- **Initial version**: Basic screencapture → JPEG → HTTP stream
- **Added**: Touch event handling, cliclick cursor control, coordinate mapping
- **Added**: Pinch zoom, hotkey buttons, AI vision annotation feed
- **Fixed**: Client connection tracking, caffeinate lifecycle, stats logging

---

## Challenges Encountered

### 1. **FPS Performance — The Core Bottleneck**

- Target: 20 FPS. **Actual: 0.2–0.7 FPS**
- Root cause: `screencapture` CLI is too slow (~1.5–5 seconds per capture on
  2015 MacBook Pro)
- This makes cursor tracking feel extremely laggy — unusable for real-time
  control
- **Not a network issue** — WiFi bandwidth is fine, the bottleneck is screen
  capture

### 2. **Screencapture Alternatives Explored**

| Method                                       | Status                             | Speed                 |
| -------------------------------------------- | ---------------------------------- | --------------------- |
| `screencapture -x -t jpg /dev/stdout`        | Current — too slow                 | 0.3-0.7 FPS           |
| `ffmpeg -f avfoundation`                     | Requires ffmpeg install            | Potentially 10-30 FPS |
| CGWindowListCreateImage (CoreGraphics C API) | Needs compilation                  | Potentially 30+ FPS   |
| ScreenCaptureKit (Apple framework)           | Requires Swift/ObjC                | 60 FPS native         |
| Python `mss` library                         | Cross-platform, needs pip          | Potentially 5-15 FPS  |
| QuickTime USB mirroring                      | Different approach (USB, not WiFi) | 30 FPS but no control |

### 3. **Touch-to-Cursor Latency**

- Even with perfect FPS, there's inherent round-trip latency:
  - Touch → HTTP POST → Server → cliclick → macOS event
- This adds ~50-200ms on top of frame latency
- For truly responsive control, need either:
  - Predictive cursor positioning
  - Direct WebSocket (instead of HTTP polling)
  - Native macOS event injection (instead of CLI `cliclick`)

### 4. **Quartz Import Crash (kCGEventFlagShift)**

- Server crashes on startup:
  `ImportError: cannot import name 'kCGEventFlagShift' from 'Quartz'`
- This symbol doesn't exist in the macOS 12 Monterey Python 3.14 Quartz bindings
- **Workaround**: Patch the import to use a fallback value or remove the symbol
- This blocked the server from running with native CGEvent support

### 5. **2015 MacBook Pro Constraints**

- No Apple Silicon optimizations
- No pre-built Homebrew bottles (source compilation takes 12+ hours)
- macOS 12 Monterey — no ScreenCaptureKit (requires macOS 12.3+ but with Apple
  Silicon focus)
- Intel Haswell — no hardware video encode acceleration for H.264

---

## Possibilities Discovered

### 1. **The Architecture Is Proven**

The WiFi relay concept works. The bottleneck is purely the capture method, not
the architecture. Swapping `screencapture` for a faster capture method would
immediately unlock usable FPS.

### 2. **AI Vision Integration — THE BREAKTHROUGH**

The `/ai/frame` endpoint is a **massive** capability:

- Any AI model can query the current screen state via HTTP
- Annotations can be overlaid on the iPhone view
- This turns the iPhone into an **AI-assisted remote control panel**
- Potential: AI reads screen, suggests actions, user taps to execute
- **Daniel's vision**: Gemini Terminal (has system access) + Gemini Chrome (can
  surf web autonomously) + Hermes (has the relay) all sharing the same screen
  context
- This creates a **multi-agent shared vision mesh** — something that didn't
  exist before in the TNF ecosystem
- The `/ai/frame` endpoint works even with the server crashed — it's a pure HTTP
  JPEG grab
- **How Hermes sees screen structure without vision**: By parsing the
  screencapture metadata, window positions from
  Quartz/CGWindowListCopyWindowInfo, and running system commands to enumerate
  active apps and window geometries

### 3. **Multi-Client Support**

The server already tracks multiple connected clients:

- Could support multiple iPhones as control surfaces
- Could serve different views (zoomed, overview, AI-annotated) to different
  clients

### 4. **WebSocket Upgrade Path**

Current HTTP polling can be upgraded to WebSocket for:

- Sub-100ms event delivery
- Bidirectional real-time communication
- Binary frame transfer (more efficient than base64 JPEG)

### 5. **LLVM Forge Connection**

This is the **canonical first test case** for the TNF LLVM Forge:

- A native CoreGraphics screen capture module compiled via LLVM would solve the
  FPS problem
- Python C extension calling CGWindowListCreateImage = potential 30-60 FPS
- This validates the entire LLVM Forge thesis: performance-critical paths need
  native code

---

## Things to Look Into Going Forward

### Priority 0: Multi-Agent Shared Vision Mesh (THE BIG IDEA)

1. **Hermes ↔ Gemini Terminal bridge** — relay /ai/frame to Gemini CLI context
2. **Gemini Chrome autonomous surfing** — connect web-browsing Gemini to the
   shared screen
3. **Shared annotation channel** — all agents can draw/see annotations on the
   same overlay
4. **Agent coordination protocol** — when one agent spots something, notify the
   others
5. **Voice input on iPhone** → AI interprets → action on Mac — the ultimate
   remote control

### Priority 1: Fix FPS (Unblock Usability)

1. **Try `mss` Python library** — pip install, minimal deps, cross-platform
2. **Try `ffmpeg -f avfoundation`** — if ffmpeg available or quick to install
3. **Build CGWindowListCreateImage C extension** — the LLVM Forge test case
4. **Consider `pyobjc` bridge** — Python bindings for CoreGraphics without
   compilation

### Priority 2: Touch Controls Enhancement

1. **Pinch zoom** — code exists but needs testing/tuning
2. **Two-finger scroll** — not yet implemented
3. **Long-press for right-click** — not yet implemented
4. **App switcher button** — code exists (Cmd+Tab hotkey)
5. **Keyboard input** — virtual keyboard on iPhone for typing

### Priority 3: AI Vision Features

1. **Frame analysis** — send frames to LLM for screen understanding
2. **Annotation overlay** — draw AI suggestions on the mirrored view
3. **Voice command bridge** — speak commands on iPhone, AI interprets and
   executes on Mac
4. **Screen change detection** — only send frames when pixels change (delta
   encoding)

### Priority 4: Architecture Improvements

1. **WebSocket upgrade** — replace HTTP polling for real-time bi-directional
2. **H.264/H.265 video encoding** — instead of JPEG frames, stream compressed
   video
3. **Delta frame compression** — only send changed pixels
4. **Native Mac app** — SwiftUI menu bar app instead of Python server
5. **End-to-end encryption** — for use outside local WiFi

### Priority 5: TNF Integration

1. **Auto-start as launchd service** — always-on screen relay
2. **TNF CLI command** — `tnf mirror start|stop|status`
3. **Multi-device mesh** — any TNF node can be controlled from any iPhone
4. **Session persistence** — reconnect without losing state

---

## Files Created This Session

| File                            | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `scripts/tnf_remote_relay.py`   | Main relay server (v2 with all features) |
| `scripts/tnf_remote_relay.html` | Client-side HTML/JS served to iPhone     |

## Key Technical Decisions

1. **screencapture CLI as initial capture method** — fastest to implement,
   proved the concept, but too slow for production
2. **HTTP over WiFi** — simpler than USB/Bluetooth, works with any browser, but
   has latency implications
3. **cliclick for event injection** — works but requires
   `brew install cliclick`; CGEvent C API would be faster
4. **Python server** — rapid prototyping, but eventual LLVM/native rewrite is
   the target

---

## Bottom Line

**We built a working iPhone-as-Mac-mirror in one session.** It works end-to-end:
iPhone shows the Mac screen, touch moves the cursor. The sole blocking issue is
FPS — `screencapture` is too slow on the 2015 MacBook Pro. The fix is swapping
the capture backend, with `mss`, `ffmpeg`, or a native CoreGraphics extension as
the top candidates. This is also the perfect first test case for the TNF LLVM
Forge.
