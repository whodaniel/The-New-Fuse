# TNF Memories - Persistent Wisdom

> **Purpose**: Accumulated knowledge across all sessions.
>
> This file persists learnings, patterns, and solutions discovered during TNF
> development. It is injected into new sessions to provide historical context.
>
> **Update Rule**: Add entries after significant discoveries or solved problems.

---

## 🏗️ Codebase Patterns

### Architecture

| Pattern                  | Where It Applies             | Notes                              |
| ------------------------ | ---------------------------- | ---------------------------------- |
| NestJS modular structure | `apps/backend/`, `packages/` | Service-based architecture         |
| Monorepo with Turborepo  | Root level                   | `pnpm` workspaces, shared packages |
| Drizzle for database      | `packages/database/`         | PostgreSQL with generated types    |
| Redis for caching/pubsub | Agent inbox, heartbeat       | Used for real-time coordination    |

### Conventions

| Convention                     | Example                                | Reason                     |
| ------------------------------ | -------------------------------------- | -------------------------- |
| Skill files named `SKILL.md`   | `.agent/skills/*/SKILL.md`             | Consistent discovery       |
| Planning files in project root | `task_plan.md`, `findings.md`          | Easy access during work    |
| Handoff notes in `.agent/`     | `.agent/handoff_notes.txt`             | Persistent across sessions |
| BMAD phase markers             | `Status: pending/in_progress/complete` | Track workflow state       |

---

## 🧠 Architectural Decisions

| Decision                              | Rationale                                       | Date    |
| ------------------------------------- | ----------------------------------------------- | ------- |
| Use file-based planning (Manus-style) | Context window is volatile; filesystem persists | 2025-12 |
| BMAD 4-phase workflow                 | Prevents coding before planning                 | 2025-12 |
| Ralph Wiggum "Fresh Context"          | Reliability through re-reading                  | 2026-01 |
| Multi-agent federation via Relay      | Enables inter-LLM communication                 | 2025-12 |
| Agent Inbox system                    | Per-agent task queues with Redis                | 2025-12 |
| Context frontloading                  | Ensures every session starts aware              | 2026-01 |

---

## 🔧 Recurring Solutions (Fixes)

### Common Errors & Fixes

| Error                              | Cause                            | Fix                                   |
| ---------------------------------- | -------------------------------- | ------------------------------------- |
| `Module not found` in monorepo     | Package not built                | Run `pnpm build` in package directory |
| CORS errors from extension         | Origin not whitelisted           | Add extension ID to CORS config       |
| Type errors after schema change    | Drizzle types stale               | Run `pnpm drizzle generate`            |
| Service worker registration failed | Syntax error in background.js    | Check for duplicate declarations      |
| Context window exhaustion          | Too much info stuffed in context | Use planning files, write to disk     |

### Build & Deploy Fixes

| Issue                       | Solution                                    |
| --------------------------- | ------------------------------------------- |
| Railway deploy fails        | Check environment variables are set         |
| Chrome extension won't load | Validate manifest.json, check for JS errors |
| TypeScript compile errors   | Run `npx tsc --noEmit` to see all errors    |

---

## 📊 Project Context

### Key Directories

| Path        | Purpose                                                      |
| ----------- | ------------------------------------------------------------ |
| `apps/`     | Deployable applications (frontend, backend, extension, etc.) |
| `packages/` | Shared libraries and core functionality                      |
| `.agent/`   | AI agent infrastructure, skills, workflows                   |
| `docs/`     | Documentation and guides                                     |
| `tools/`    | Development utilities                                        |

### Important Packages

| Package                    | Purpose                     |
| -------------------------- | --------------------------- |
| `@the-new-fuse/core`       | Core utilities and types    |
| `@the-new-fuse/database`   | Drizzle schema and client    |
| `@the-new-fuse/relay-core` | WebSocket relay server      |
| `@the-new-fuse/agent`      | Agent framework             |
| `@the-new-fuse/mcp-core`   | MCP protocol implementation |

### Deployment

| Environment      | Platform         | URL            |
| ---------------- | ---------------- | -------------- |
| Production       | Railway          | thenewfuse.com |
| Chrome Extension | Chrome Web Store | Published      |
| Local Dev        | Docker/Native    | localhost:3000 |

---

## 🔄 Workflow Discoveries

### What Works Well

1. **Planning before coding** — BMAD phases prevent wasted effort
2. **Fresh context each iteration** — Ralph technique ensures reliability
3. **Handoff notes** — Critical for multi-session work
4. **Skill-based organization** — Easy to find and load capabilities
5. **Jules delegation** — Good for long-running async tasks

### What To Avoid

1. ❌ Starting complex tasks without `task_plan.md`
2. ❌ Stuffing too much into context window
3. ❌ Repeating failed actions without mutation
4. ❌ Forgetting to update handoff notes
5. ❌ Assuming previous work — always verify

---

## 🎯 Active Focus Areas

| Area                        | Status              | Priority |
| --------------------------- | ------------------- | -------- |
| Context frontloading        | Implementing        | HIGH     |
| Chrome extension v6         | In development      | HIGH     |
| Multi-agent federation      | Foundation complete | MEDIUM   |
| Perpetual improvement cycle | Active              | MEDIUM   |

---

## 📝 Session Notes Archive

### 2026-01-22

- Integrated OthmanAdi planning-with-files skill
- Created unified Manus + BMAD planning system (v3.0.0-tnf)
- Implemented Ralph Wiggum context frontloading
- Created SYSTEM_PROMPT.md for global injection

### 2026-01-21

- Fixed Chrome extension build issues
- Resolved circular dependency in frontend
- Merged 23 open PRs

### Prior Sessions

- See `.agent/session-logs/` for detailed history

---

## ❓ Open Questions

| Question                                         | Context                            | Status             |
| ------------------------------------------------ | ---------------------------------- | ------------------ |
| How to auto-inject SYSTEM_PROMPT in Antigravity? | Need seamless frontloading         | Researching        |
| Optimal memory file size?                        | Balance between context and tokens | Testing            |
| Session continuity across AI backends?           | Cross-platform federation          | Active development |

---

**Last Updated:** 2026-01-22  
**Format:** Living document — update after significant discoveries

---

_Memories persist. Context is power. Fresh starts are reliable._
