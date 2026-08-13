# Frontload Contract (TNF)

## Terms

- `Frontload`: deterministic startup protocol that ensures context awareness.
- `StatusBanner`: fast, human-readable startup summary.
- `ContextPack`: structured machine-readable context used by agents.

## StatusBanner Contract

Inputs:

- `~/.tnf/handoff-current.json` (preferred)

Renderer:

- `~/.tnf/tnf-status` (preferred)

Rules:

- Run at most once per interactive shell session.
- Fail soft: never abort shell startup if cache is missing or malformed.
- Never print secrets, tokens, or full raw JSON by default.
- Avoid network calls and long-running work in shell init.

## ContextPack Contract

Goal:

- Provide enough context for an agent to reliably resume work.

Recommended contents:

- Session key, timestamp, and state items.
- Immediate tasks list with completed/pending markers.
- Paths to handoff packets and relevant repo roots.
- Optional: architecture diagram pointers.

Rules:

- Store on disk; do not spam terminal output.
- Require explicit request to print full details.

