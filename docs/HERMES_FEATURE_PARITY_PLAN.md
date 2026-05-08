# TNF-Hermes Feature Parity Configuration Plan
## Generated: 2026-05-05

---

## Part 1: Analysis of Hermes vs TNF Feature Gaps

### Hermes Commands (Full Set) vs TNF Implementation

| # | Hermes Command | Status in TNF | Priority | Notes |
|---|----------------|---------------|----------|-------|
| 1 | `chat` | PARTIAL (via `tnf ai`) | HIGH | TNF has `tnf ai` for chat, but lacks the full interactive TUI |
| 2 | `model` | NOT IMPLEMENTED | HIGH | Model/provider selection and switching |
| 3 | `fallback` | NOT IMPLEMENTED | MEDIUM | Fallback provider chain management |
| 4 | `gateway` | PARTIAL | HIGH | TNF has WebSocket relay, lacks Telegram/Discord/WhatsApp gateway |
| 5 | `setup` | NOT IMPLEMENTED | HIGH | Interactive setup wizard |
| 6 | `whatsapp` | NOT IMPLEMENTED | MEDIUM | WhatsApp integration setup |
| 7 | `slack` | NOT IMPLEMENTED | MEDIUM | Slack integration setup |
| 8 | `login` / `logout` | NOT IMPLEMENTED | MEDIUM | Provider authentication management |
| 9 | `auth` | NOT IMPLEMENTED | MEDIUM | Pooled provider credentials (credentials.json) |
| 10 | `status` | NOT IMPLEMENTED | LOW | Component status check |
| 11 | `cron` | IMPLEMENTED | DONE | Wired to CronService |
| 12 | `webhook` | IMPLEMENTED | DONE | Wired to WebhookService |
| 13 | `kanban` | IMPLEMENTED | DONE | Wired to KanbanService |
| 14 | `hooks` | NOT IMPLEMENTED | LOW | Shell hook management |
| 15 | `doctor` | NOT IMPLEMENTED | MEDIUM | Configuration and dependency check |
| 16 | `dump` | NOT IMPLEMENTED | LOW | Setup summary for support |
| 17 | `debug` | NOT IMPLEMENTED | LOW | Debug log sharing |
| 18 | `backup` | NOT IMPLEMENTED | MEDIUM | Backup to zip |
| 19 | `import` | NOT IMPLEMENTED | MEDIUM | Restore from zip |
| 20 | `config` | PARTIAL | HIGH | TNF has `config` but lacks full config management |
| 21 | `pairing` | NOT IMPLEMENTED | LOW | DM pairing codes for user auth |
| 22 | `skills` | NOT IMPLEMENTED | HIGH | Skill search/install/configure (40+ skills) |
| 23 | `plugins` | IMPLEMENTED | DONE | Wired to PluginsService |
| 24 | `curator` | NOT IMPLEMENTED | LOW | Background skill maintenance |
| 25 | `memory` | IMPLEMENTED | DONE | Wired to MemoryProviderService |
| 26 | `tools` | IMPLEMENTED | DONE | Wired to ToolsService |
| 27 | `mcp` | PARTIAL | HIGH | TNF has mcp command but needs full MCP server management |
| 28 | `sessions` | PARTIAL | HIGH | TNF has session command, needs full management |
| 29 | `insights` | NOT IMPLEMENTED | MEDIUM | Usage analytics and reporting |
| 30 | `claw` | NOT IMPLEMENTED | LOW | OpenClaw migration tools |
| 31 | `version` | IMPLEMENTED | DONE | Built-in |
| 32 | `update` | NOT IMPLEMENTED | MEDIUM | Auto-update mechanism |
| 33 | `uninstall` | NOT IMPLEMENTED | LOW | Uninstaller |
| 34 | `acp` | NOT IMPLEMENTED | LOW | Agent Client Protocol server |
| 35 | `profile` | NOT IMPLEMENTED | MEDIUM | Multi-profile isolated instances |
| 36 | `completion` | NOT IMPLEMENTED | LOW | Shell completion scripts |
| 37 | `dashboard` | NOT IMPLEMENTED | MEDIUM | Web UI dashboard |
| 38 | `logs` | NOT IMPLEMENTED | MEDIUM | Log viewing and filtering |

---

## Part 2: Deep Hermes Features That Need Porting

### 2.1 Messaging Gateway
 Hermes supports: Telegram, Discord, Slack, WhatsApp, Signal, Email
 TNF needs: Full gateway with platform adapters

### 2.2 Skills Hub
 Hermes has 40+ skills, searchable hub, GitHub/ClawHub integration
 TNF needs: Skills directory, install/update/remove, configuration

### 2.3 Memory Providers
 Hermes supports: honcho, openviking, mem0, hindsight, holographic, retaindb
 TNF has: Basic config exists, needs full integration

### 2.4 Scheduled Automations (Cron)
 Hermes has: Full cron scheduler with platform delivery
 TNF has: CronService with basic scheduling

### 2.5 Terminal Backends
 Hermes supports: local, Docker, SSH, Daytona, Singularity, Modal
 TNF needs: Backend abstraction layer

### 2.6 Multi-Profile
 Hermes has: Isolated profiles (`hermes profile create/list/switch`)
 TNF needs: Profile management system

---

## Part 3: Recommended Next Steps

### Phase 1: Critical Path (Core missing features)
1. `tnf model` — Model/provider selection (maps to existing TNF model config)
2. `tnf setup` — Interactive setup wizard for new users
3. `tnf skills` — Skills hub integration (browse, install, inspect)
4. `tnf gateway` — Full messaging gateway with platform adapters
5. `tnf sessions` — Complete session management (list, rename, export, prune, delete)
6. `tnf logs` — Log viewing and filtering
7. `tnf insights` — Usage analytics

### Phase 2: User Experience
8. `tnf doctor` — Configuration and dependency check
9. `tnf backup` / `tnf import` — Backup/restore system
10. `tnf profile` — Multi-profile support
11. `tnf dashboard` — Web UI
12. `tnf update` — Auto-updater

### Phase 3: Power User Features
13. `tnf fallback` — Fallback provider chain
14. `tnf auth` — Provider credential pooling
15. `tnf mcp` — Full MCP server management
16. `tnf webhook` — Webhook subscription management (DONE)

### Phase 4: Nice to Have
17. `tnf completion` — Shell completion
18. `tnf dump` — Support debug dump
19. `tnf debug` — Debug log sharing
20. `tnf pairing` — DM pairing codes
21. `tnf curator` — Background skill maintenance
22. `tnf acp` — ACP server

---

## Configuration Action Items

### Goals (/goals equivalent for TNF)
Create `~/.tnf/goals.yaml` with:
```yaml
# TNF Goals - Auto-derived from Hermes feature analysis
goals:
  - name: "feature-parity"
    description: "Achieve full feature parity with Hermes Agent"
    priority: critical
    progress: 6/38
  - name: "gateway-completion"
    description: "Complete messaging gateway with all platforms"
    priority: high
  - name: "skills-hub"
    description: "Implement skills hub with 40+ skills"
    priority: high
  - name: "setup-wizard"
    description: "Interactive first-time setup for new users"
    priority: high
  - name: "multi-profile"
    description: "Support isolated multi-profile instances"
    priority: medium
```

### Tools Configuration
Create `~/.tnf/tools.yaml` with all toolsets from Hermes:
```yaml
toolsets:
  - name: web
    enabled: true
    platforms: [cli, telegram, discord, slack]
  - name: terminal
    enabled: true
    platforms: [cli]
  - name: file
    enabled: true
    platforms: [cli, telegram]
  - name: browser
    enabled: true
    platforms: [cli, telegram]
  - name: memory
    enabled: true
    platforms: all
  - name: mcp
    enabled: true
    platforms: [cli]
  # Add remaining 20+ toolsets...
```

### Session Management
Extend existing `SessionManagerService` to support:
- `tnf sessions list` — List past sessions
- `tnf sessions browse` — Interactive session picker
- `tnf sessions rename <id> <title>` — Rename/title a session
- `tnf sessions export <id>` — Export session to JSON
- `tnf sessions prune` — Remove old sessions
- `tnf sessions delete <id>` — Delete specific session

### Insight / Analytics
Track per-session:
- Total turns
- Tool usage frequency
- Model/provider used
- Cost estimates
- Session duration
- Platform (CLI vs Gateway)

---

## References

- Hermes Docs: https://hermes-agent.nousresearch.com/docs/
- Hermes CLI Reference: https://hermes-agent.nousresearch.com/docs/reference/cli-commands
- Hermes Skills: ~/.hermes/hermes-agent/README.md
- TNF Docs: ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/
