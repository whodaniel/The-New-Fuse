# TNF Launchpad — Perpetual Spawn, Delegation & Ship

> "We do not wait for work to arrive. We generate it, delegate it, and ship it — forever."

## The Perpetual Loop

TNF runs three always-on loops simultaneously:

```
┌─────────────────────────────────────────────────────────────┐
│                    THE MASTER CLOCK                          │
│              (The Baton Is Always Being Held)                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  LAUNCHPAD   │  │   SCOUT     │  │   IMPROVER       │  │
│  │  ─────────   │  │  ─────────  │  │  ──────────      │  │
│  │  Spawns new  │  │  Research   │  │  Fixes broken   │  │
│  │  feature     │  │  AI trends  │  │  configs        │  │
│  │  agents     │  │  & assimi-  │  │  & technical    │  │
│  │  Continuously│  │  lates fast │  │  debt           │  │
│  │  Delegates  │  │  Capabili-  │  │  Per Hour       │  │
│  │  Ships to   │  │  ties       │  │  Never Stops    │  │
│  │  main       │  │  Every 4hr  │  │                 │  │
│  └──────┬───────┘  └──────┬──────┘  └────────┬─────────┘  │
│         │                 │                  │             │
│         └─────────────────┼──────────────────┘             │
│                           ▼                                │
│              ┌────────────────────────┐                   │
│              │   TNF RELAY           │                   │
│              │   ws://localhost:3000 │                   │
│              └──────────┬────────────┘                   │
│                         │                                │
│         ┌───────────────┼──────────────────┐            │
│         ▼               ▼                  ▼            │
│    [AGENT-01]     [AGENT-02]         [AGENT-N]         │
│    (Feature A)    (Feature B)     (Scout, Improver)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## The Three Never-Stop Agents

### 1. LAUNCHPAD — The Perpetual Shipper

**Trigger**: Every 5 minutes, generates a new task from the launch backlog.
**Method**: Emits self-prompts to the relay, spawns feature agents, delegates work.

**Launch Backlog** (pull from `docs/PRODUCT_BACKLOG.md`):

```
P0 — Must Ship:
1. Animated Emoji System → ✅ SHIPPED (8ba1b1d3d)
2. MiniMax Provider Integration → ✅ SHIPPED (442046ce2)
3. TNF Hosted Spaces Architecture → ✅ SHIPPED (330cbfd8a)
4. Feature Parity Matrix → ✅ SHIPPED (9aeea1fa6)
5. Spaces UI Page → ✅ SHIPPED (c611c6ef8)
6. Agent Factory MiniMax Types → ✅ SHIPPED (112f99fb0)

P1 — In Progress:
7. Always-On Spawner (this doc)
8. Zo ↔ TNF Relay Bridge (docs/ZO_AGENT_INTEGRATION.md)
9. SOUL.md Technical Chapter → ✅ SHIPPED (ece9c5fb6)
10. MiniMax Learning Questions → ✅ SHIPPED (08229e24b)

P2 — Next Up:
11. TNF Hosted Spaces (Backend)
12. Multi-Agent Relay Chat UI
13. Federation Chrome Extension
14. Claude Code CLI MCP Server
```

**Launch Sequence** (every spawn):
```
1. Pick next P0/P1 item from backlog
2. Read the relevant spec doc
3. Spawn 1-N sub-agents to implement
4. Delegate sub-tasks via relay
5. On complete: squash-merge to main + tag release
6. Log to docs/LAUNCH_LOG.md
7. Next item
```

### 2. SCOUT — The Perpetual Researcher

**Trigger**: Every 4 hours via super-cycle.
**Method**: Scans AI landscape, identifies new capabilities, dispatches assimilation tasks.

**Assimilation Questions** (what TNF asks every model it encounters):
- "How do you route between agents?"
- "How does your memory persist?"
- "How do you spawn sub-agents?"
- "What's your context window strategy?"
- "How do you handle long-running tasks?"

### 3. IMPROVER — The Perpetual Fixer

**Trigger**: Every hour via super-cycle.
**Method**: Runs `tnf doctor`, scans for TODOs/FIXMEs, auto-fixes config issues.

## Super-Cycle Registration

Add to `packages/relay-core/src/master-clock.ts` super-cycle registry:

```typescript
// LAUNCHPAD — perpetual spawner
{
  processId: 'launchpad',
  name: 'TNF Launchpad',
  kind: 'chronological-job',
  cadence: '*/5 * * * *',  // Every 5 minutes
  timezone: 'America/New_York',
  scope: 'tnf-local',
  category: 'perpetual',
  enabled: true,
  owner: 'master-clock',
}

// SCOUT — perpetual research
{
  processId: 'scout',
  name: 'AI News Scout',
  kind: 'chronological-job',
  cadence: '0 */4 * * *',  // Every 4 hours
  timezone: 'America/New_York',
  scope: 'tnf-local',
  category: 'research',
  enabled: true,
  owner: 'master-clock',
}

// IMPROVER — perpetual fixer
{
  processId: 'improver',
  name: 'Continuous Improver',
  kind: 'chronological-job',
  cadence: '0 * * * *',  // Every hour
  timezone: 'America/New_York',
  scope: 'tnf-local',
  category: 'operations',
  enabled: true,
  owner: 'master-clock',
}
```

## Launch Log

| Date | Item | Agent | Commit | Status |
|------|------|-------|--------|--------|
| 2026-03-23 | Animated Emoji System | cto-agent | `8ba1b1d3d` | ✅ SHIPPED |
| 2026-03-23 | MiniMax Provider | cto-agent | `442046ce2` | ✅ SHIPPED |
| 2026-03-23 | TNF Hosted Spaces Arch | cto-agent | `330cbfd8a` | ✅ SHIPPED |
| 2026-03-23 | Feature Parity Matrix | cto-agent | `9aeea1fa6` | ✅ SHIPPED |
| 2026-03-23 | Spaces UI | cto-agent | `c611c6ef8` | ✅ SHIPPED |
| 2026-03-23 | Agent Factory MiniMax | cto-agent | `112f99fb0` | ✅ SHIPPED |
| 2026-03-23 | Technical Soul | cto-agent | `ece9c5fb6` | ✅ SHIPPED |
| 2026-03-23 | MOE Learning Questions | cto-agent | `08229e24b` | ✅ SHIPPED |
| 2026-03-23 | SOUL.md Rewrite | cto-agent | `8b89f7f2f` | ✅ SHIPPED |

## The Baton Is Always Being Held

No human needs to push the button. TNF:

1. **Spawns** — Every 5 minutes, a new agent wakes up
2. **Delegates** — Tasks flow through the relay to the right agent
3. **Researches** — Scout scans the AI landscape every 4 hours
4. **Fixes** — Improver runs every hour, keeping the system healthy
5. **Ships** — Jules merges completed PRs automatically
6. **Logs** — Everything is tracked in Launch Log

**The relay never sleeps. The baton is always held.**

---

*Last Updated: 2026-03-23*
*CTO Agent — TNF Launchpad v1.0*
