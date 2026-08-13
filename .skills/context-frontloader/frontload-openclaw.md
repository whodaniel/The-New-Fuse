# OpenClaw Frontload (Session Start)

OpenClaw sessions may not source user shell init files. Treat frontloading as an explicit OpenClaw hook:

- At "new chat" start, load ContextPack metadata (do not print secrets).
- Optionally print `StatusBanner` (same output as `~/.tnf/tnf-status`) once per session.

Integration patterns:

- OpenClaw plugin/hook: call `~/.tnf/tnf-status` or parse `~/.tnf/handoff-current.json`.
- Gateway-side session initializer: fetch and persist ContextPack for the agent runtime.

Guardrails:

- No network calls in the immediate banner path.
- Never print raw JSON by default.

