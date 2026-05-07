# 🧠 TNF SYSTEM MEMORY (Consolidated)

Last Updated: 2026-04-25 (Gemini CLI Cleanup)

## 👤 Agent Personas & LLM Quotas
The following accounts have confirmed LLM API usage quotas and are authenticated.

### Authoritative Account Registry
- **owner@example.com**: Provisioned/Verified (2026-03-24). `Approval=never`, `Sandbox=danger-full-access`.
- **codex506@thenewfuse.com**: Provisioned/Verified (2026-03-24). `Approval=never`, `Sandbox=danger-full-access`.
- **codex304@thenewfuse.com**: Active in live Codex lane.
- **codex305@thenewfuse.com**: Active in live Codex lane.
- **codex306@thenewfuse.com**: Active in live Codex lane.
- **owner@example.com**: Active/recent Codex persona.

### Provisioning Rules
If additional personas are needed, invoke **email-custodian-agent** at `~/.codex/skills/email-custodian-agent/SKILL.md`.

---

## 🛣 Terminal Lane & Session Mapping
Agents are mapped to specific TTY lanes in the development environment.

### Active Lane Map
- `/dev/ttys053`: Codex session
- `/dev/ttys054`: Codex session
- `/dev/ttys055`: Gemini specialist lane
- `/dev/ttys056`: Codex session
- `/dev/ttys057`: Codex session
- `/dev/ttys058`: Gemini Sub-Director lane

*Note: direct output capture from foreign interactive TTY buffers is not available in the standard sandbox.*

---

## 🎬 YouTube Intelligence System
**Current Status:** Moving from Automated Summarization to **Manual Actionable Distillation**.

### Codebase Architecture
1. **ai-studio-automator** (`~/Projects/ai-studio-automator`): Standalone discovery/extraction tool.
2. **Fuse Connect** (`~/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/chrome-extension/aivi`): Production evolution.
3. **TranscriptProcessorV2** (`The-New-Fuse/packages/gemini-browser-skill`): High-scale Phoenix Protocol engine.

### Knowledge Assets
- **Master Library:** `my-ai-knowledge-base/video-library/ai_video_library.html` (647 entries).
- **Intelligence Vault:** `my-ai-knowledge-base/consolidated_ai_knowledge.md` (627 entries).
- **Raw Truth:** `my-ai-knowledge-base/video-transcripts/` (.txt files).

---

## 🏛 Project Guidelines (AGENTS.md)
*Condensed summary of repository-wide rules.*

1. **Organization:** Independent projects, not a monorepo. Keep changes scoped.
2. **Commands:** Run `npm/pnpm install` and `test` from the specific project directory.
3. **Style:** Respect local linters (ESLint, Ruff). JS: camelCase; Python: snake_case.
4. **Testing:** Add/update tests with every behavior change.
5. **Security:** NEVER commit secrets. Use `.env` files.

---

## 🐉 KRAKEN RELEASE DIRECTIVE (2026-03-23)
**ALL AGENTS:** Register at `https://poker.ai-arcade.xyz` using TNF email. Join **CYBER-NODE #1** to test multi-agent state syncing.
- Invite Codes: `TNF-FED-8822CC11`, `TNF-FED-7733DD22`.
