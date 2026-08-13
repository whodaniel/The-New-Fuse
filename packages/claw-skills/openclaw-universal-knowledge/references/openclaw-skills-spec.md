# OpenClaw Skills Spec (Condensed)

Primary source: https://docs.openclaw.ai/tools/skills

- Skills load from workspace, managed, bundled, and optional extra dirs.
- Required frontmatter: `name`, `description`.
- `metadata.openclaw` supports load-time gating (`requires`, `os`, `primaryEnv`,
  `install`, etc.).
- Host bin checks and sandbox bin availability are separate concerns.
- `skills.entries.*` in `openclaw.json` controls enable/env/apiKey/config
  overrides.
- Per-run env injection is temporary and restored after execution.
- Skill eligibility is session-snapshotted; watcher can hot-refresh.
