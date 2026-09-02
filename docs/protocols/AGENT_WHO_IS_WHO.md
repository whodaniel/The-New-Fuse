# Agent Who-Is-Who

Human-friendly running record of **what people call an agent** vs **what it actually is**.

_Last refreshed: **2026-09-01 19:41:16 EDT**_

Refresh anytime:

```bash
python3 scripts/system/tnf-agent-who-is-who.py --write
# or: tnf agents who
```

## Name cheat sheet

| When you say… | Also called | Family | What it is |
|---|---|---|---|
| **Inky** | Enki, front door | TNF Voice | Audio front door / TTS persona — not a coding agent tty |
| **Cursor** | Cursor Agent, cursor-agent | Cursor | Cursor’s terminal agent (this chat when voice-anchored here) |
| **Claude** | Claude Code, claude-code | Anthropic | Claude Code CLI coding agent |
| **Hermes** | Hermes Agent | Hermes | Hermes Agent CLI (tools, sessions, optional TNF boot step) |
| **OpenClaw** | Open Claw, Claw, openclaw | OpenClaw | Optional OpenClaw operator surface routed through TNF |
| **TNF** | TNF CLI, TNF TUI, TNF Agent | The New Fuse | Native TNF interactive agent (`tnf tui` / `tnf boot` attach) |
| **Codex** | codex CLI | OpenAI | OpenAI Codex CLI coding agent |
| **Gemini** | Gemini CLI | Google | Gemini CLI coding agent |
| **Pi** | pi coding agent | Pi | Pi terminal coding agent |
| **Aider** | — | Aider | Aider pair-programming CLI |
| **Kilo** | kilo-cli | Kilo | Kilo CLI agent |
| **OpenCode** | opencode | OpenCode | OpenCode CLI agent |

### Easy mix-ups

- **Claude** ≠ **OpenClaw** — Claude is Anthropic’s coding CLI; OpenClaw is a separate operator surface.
- **Hermes** ≠ **Claude** / **OpenClaw** — Hermes is its own agent runtime (`hermes`).
- **TNF TUI** ≠ **Cursor Agent** — both can take voice, but they are different windows/ttys.
- **Inky** is the voice front door / speaker, not a coding agent.

## Live right now

| Name                      | Window (tty) | PID   | Note |
| ------------------------- | ------------ | ----- | ---- |
| **Hermes** (`hermes`)     | `ttys002`    | 87450 | —    |
| **OpenCode** (`opencode`) | `ttys003`    | 28125 | —    |
| **Pi** (`pi`)             | `ttys000`    | 49262 | —    |
| **Pi** (`pi`)             | `ttys001`    | 7036  | —    |
| **TNF** (`tnf-cli`)       | `ttys002`    | 87250 | —    |

## Voice beam anchor

Speech inject goes to **`tnf-cli`** on **`ttys012`** (locked).

## How to aim voice

- **Cmd+Option+Click** a Terminal tab — retarget beam
- `voice-target-agent --prefer claude|hermes|cursor-agent|tnf|…`
- Ask Inky to move the anchor

