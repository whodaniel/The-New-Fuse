# Multi-Agent Shared Vision — Gemini Onboarding Prompts

**Date:** 2026-04-24 **Purpose:** Prompts to onboard Gemini Terminal and Gemini
Chrome into the new shared vision capability

---

## 🟣 Prompt for Gemini in Terminal (system-level access)

**How to deliver:** Paste directly into the Gemini Terminal session running on
the Mac.

---

I need you to understand a new capability we just built and how it affects what
you can do on this system.

**What exists now:**

There is a running HTTP server on this Mac at `http://192.168.1.104:8080` — it's
the **TNF Remote Relay**, a WiFi-based screen mirror + AI vision bridge. It was
built this session by Hermes (another AI agent I work with).

**What it does:**

1. **Screen capture feed** — `GET /ai/frame` returns the current Mac desktop as
   a JPEG. You can `curl http://192.168.1.104:8080/ai/frame` at ANY TIME to see
   what's on screen right now.
2. **Annotation channel** — `GET /ai/annotations` returns JSON with any
   pencil/highlighter markings I've drawn on my iPhone overlay. `POST /ai/clear`
   clears them.
3. **iPhone mirror** — My iPhone Safari is connected to the same server, showing
   my Mac desktop. I can tap to move the cursor, pinch to zoom, use hotkey
   buttons, and draw annotations with pencil/highlighter tools.

**Why this matters for you:**

- You have **terminal access** to this Mac. Until now, you've been blind — you
  can run commands but you can't SEE what's happening on screen. Now you can.
- Run `curl -s http://192.168.1.104:8080/ai/frame > /tmp/screen.jpg` to grab the
  current screen state. You can then describe what you see, diagnose UI issues,
  or confirm that a command you ran had the expected visual result.
- You can check `/ai/annotations` to see if I've drawn something pointing at a
  specific area of the screen — that's how I can visually communicate with you.

**What I want from you right now:**

1. Acknowledge that you understand this capability
2. Try it:
   `curl -s http://192.168.1.104:8080/ai/frame > /tmp/screen.jpg && echo "Frame captured"`
3. Think about how you could USE this in your workflows — e.g., after running a
   command, checking the screen to verify the result; reading error dialogs that
   only appear visually; helping me debug UI issues by actually seeing them
4. Consider: if Hermes can also see this same /ai/frame, and Gemini in Chrome
   can also fetch it, we have a **multi-agent shared vision** — all three of us
   looking at the same screen, coordinating in real time. What would you do with
   that?

**Known limitation:** The screen capture is currently slow (~0.3-0.7 FPS)
because it uses `screencapture` CLI. This is being fixed — next backend will be
`mss` Python library or native CoreGraphics, targeting 10-30+ FPS.

**You are the system-level agent.** Hermes is the orchestrator. Gemini in Chrome
is the web-surfer. Together with shared vision, we can cover the full stack.

---

## 🔵 Prompt for Gemini in Chrome (web access, autonomous browsing)

**How to deliver:** Paste into the Gemini chat in the Chrome browser window.

---

I need you to understand a new system capability and your role in it.

**Context:** I work with multiple AI agents. You're one of three that are now
connected in a new way.

**What just happened:**

Another agent (Hermes) built a **TNF Remote Relay** — an HTTP server running on
my Mac at `http://192.168.1.104:8080`. It does three things:

1. **Mirrors my Mac screen to my iPhone** over WiFi — I can see and control my
   desktop from my phone (tap to click, pinch to zoom, hotkeys)
2. **AI Vision Feed** — `http://192.168.1.104:8080/ai/frame` serves the current
   Mac desktop as a JPEG. Any agent can fetch this to see what's on my screen.
3. **Annotation Channel** — `http://192.168.1.104:8080/ai/annotations` returns
   JSON with drawings I've made on my iPhone overlay (pencil, highlighter). This
   is how I can point at things visually for AI agents to see.

**Your unique capability:** You can **autonomously browse the web**. You can
open URLs, read pages, fill forms, search, and take actions on the internet. The
other two agents can't do this as well as you.

**The new interaction model:**

There are now THREE agents who can all see the same screen:

| Agent                   | Strength                      | Access                                              |
| ----------------------- | ----------------------------- | --------------------------------------------------- |
| **Hermes** (Telegram)   | Orchestrator, full tool suite | Terminal, files, browser, web search, delegation    |
| **Gemini Terminal**     | System-level commands         | Direct terminal access on Mac, can run any CLI      |
| **You** (Gemini Chrome) | Web autonomy                  | Can browse, research, take web actions autonomously |

All three of us can fetch `http://192.168.1.104:8080/ai/frame` to see the same
desktop. I can draw annotations on my iPhone and all three see what I'm pointing
at.

**What I want from you:**

1. Understand that you now have a **visual channel** to see my Mac desktop —
   you're not limited to just the chat window anymore
2. Think about workflows where your web-browsing ability combines with shared
   screen vision. Examples:
   - I point at an error in a web app on my Mac → you see the annotation → you
     navigate to the relevant docs/API → you report back what to fix
   - I show you a design on screen → you find similar designs or assets online →
     you report back
   - Hermes delegates web research to you while you can SEE the context of what
     he's working on
3. Consider: if I draw a circle around something on my iPhone, you can fetch
   `/ai/annotations` to know exactly what I'm referencing — no need for me to
   describe it in text

**This is early.** The FPS is slow (0.3-0.7 frames per second) but the
architecture is proven. The capture method is being upgraded. The concept —
**multi-agent shared vision with role specialization** — is what matters.

**What should we build with this?**
