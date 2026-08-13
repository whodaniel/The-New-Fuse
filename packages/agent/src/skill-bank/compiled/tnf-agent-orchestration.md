---
name: TNF Agent Orchestration
slug: tnf-agent-orchestration
description: Comprehensive skill documenting how TNF orchestrates AI agents to stay aligned, work cohesively, and grow the system
version: 1.0.0
author: TNF Agentic Network
created: 2026-05-03
updated: 2026-05-03
tags: [orchestration, agents, coordination, health, growth]
priority: P0
---

# TNF Agent Orchestration Skill

## Purpose

This skill documents the complete system by which TNF orchestrates AI agents to:
- **Stay aligned** with framework directives
- **Work cohesively** as a coordinated system
- **Grow** the system through self-improvement
- **Maintain health** through continuous monitoring

---

## Core Orchestration Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    MASTER HEARTBEAT (15s)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│  Terminal  │  │   Director  │  │   Poll    │
│  Heartbeat │  │   Loop     │  │   Jobs    │
└─────┬─────┘  └─────┬───────┘  └──────┬────┘
      │             │                │
      ▼             ▼                ▼
┌──────────┐  ┌─────────┐  ┌──────────────────┐
│ Discover │  │ Delegate│  │ Self-Improve   │
│ Agents   │  │ Tasks  │  │ (backoff/QA)  │
└──────────┘  └───┬─────┘  └──────────────────┘
                  │
                  ▼
           ┌──────────────┐
           │    Relay    │
           │  (ws://)    │
           └──────────────┘
```

---

## 1. Agent Discovery & Registration

### Files
- `.tnf/bin/agent-registry-hybrid-refresh-lite.cjs` - Registry refresh
- `.tnf/bin/agent-poll-pulse.cjs` - Job runner with backoff/retry
- `.tnf/session-discovery/terminal-identity-registry.json` - Identity mapping

### How It Works
1. Terminal Heartbeat discovers agent processes every 30s
2. Identifies agent types: codex, claude, gemini, goose, aider
3. Maps TTY to agent identity: `tnf-local-terminal-{tty}`
4. Registers in identity registry with schema version

### States Tracked
- `observedSessions` - All terminal sessions
- `agentSessions` - Identified AI agents
- `activeSessions` - Currently running
- `idleSessions` - Available for work
- `stalledSessions` - Needs intervention

---

## 2. Communication Protocols

### Health Protocol
**File:** `.tnf/comm/health-protocol.json`

| Parameter | Value |
|-----------|-------|
| Heartbeat Interval | 15000ms |
| Stall Threshold | 3 misses |
| Max Retries | 5 |

### Relay Communication
- WebSocket: `ws://localhost:3000/ws`
- Channel: `tnf:bus:ingress`
- Communication Methods:
  - `tnf send` command
  - Relay WebSocket
  - Shared files

### Twin Communication (Sudo-Twin)
**File:** `.tnf/comm/twin-communication-agent.sh`

- Bidirectional ping-pong every 30 seconds
- CLI responsiveness check every 60 seconds

---

## 3. Health Monitoring

### Terminal Heartbeat
**File:** `.tnf/bin/terminal-heartbeat-pulse.cjs`

Functions:
- Monitors terminal sessions every 30s
- Detects agent processes (codex, claude, gemini, goose, aider)
- Tracks states: busy, idle, stalled
- Emits wake_ping to stalled agents

### Don't Die Supervisor
**File:** `.tnf/bin/dont-die-supervisor-lite.cjs`

- Keeps services alive
- Prevents death on automation failure
- Auto-restart on crash

### Model Health Monitor
**File:** `.tnf/scripts/model-health-monitor.py`

- Monitors 29 active models
- Auto-removes failed models after 2 failures

### Voice Watchdog
**File:** `.tnf/voice-watchdog.sh`

- Monitors voice agent health
- Tracks voice processes

---

## 4. Coordination Systems

### Director
**File:** `.tnf/bin/tnf-director-loop.cjs`

Flow:
```
1. Query subdirector heartbeat
2. Identify idle/stalled agents
3. Select task from resonance pool
4. Publish relay envelope via tnf:bus:ingress
5. Track task assignment
```

### Sub-Director
**File:** `.tnf/bin/subdirector-autopilot-loop.cjs`

Functions:
- Poll terminal windows every 30s
- Detect agent sessions via command hints
- Send wake_ping to idle agents
- Manage quota handoff on session change

### Master Heartbeat
**File:** `.tnf/master-heartbeat/`

- Orchestrates terminal-heartbeat-pulse
- Orchestrates director-cycle
- 15 second interval

---

## 5. Self-Improvement Cycles

### Poll Job Framework
**File:** `.tnf/bin/agent-poll-pulse.cjs`

### Self-Improvement Loop
**Directory:** `.tnf/poll-jobs/tenant-self-improvement-loop/`

- Tracks failures
- Computes backoff: base 30s, max 1800s, exponential

### Continuous QA Loop
**Directory:** `.tnf/poll-jobs/tenant-continuous-qa-loop/`

- Quality monitoring
- Metric tracking

### Nightly Maintenance
**Directory:** `.tnf/poll-jobs/tenant-nightly-maintenance/`

- Prune old state
- Archive data
- Directive rotation

---

## 6. Task Distribution

### Resonance Pool
Tasks queued for idle agents, managed by Director

### Handoff System
**File:** `.tnf/handoff-current.json`

- Tracks 689+ files
- Session continuity
- Types: manual, stall_recovery, session_start

### Federation Tasks
**Directory:** `.tnf/federation_tasks/`

- Cross-agent task distribution

---

## 7. Session Management

### Session Tracking
- Stored in: `.tnf/session-discovery/`
- History in: `.tnf/terminal-heartbeat/state/`

### Quota Management
- LLM quota threshold (10%) triggers handoff
- Owner session drives allocation

---

## 8. Knowledge Systems

### Knowledge Summary
**File:** `.tnf/comm/tnf-knowledge-summary.md`

Tracked concepts:
- Cron Governance Protocol v0.1
- Self-Improvement Cycle
- Session Onboarding
- Agent Communication Guide
- Swarm Orchestration patterns

### Knowledge Scout
**Directory:** `.tnf/poll-jobs/tenant-knowledge-scout-sprint/`

Targets:
- MCP configuration
- Redis integration
- Factory supervisor

---

## Quick Reference Commands

```bash
# Agent Management
tnf register <name> <role> <platform>
tnf list                    # List registered agents
tnf send <message>         # Send to agent

# Health
tnf doctor                 # Run diagnostics
tnf status                 # System status

# Coordination
tnf relay monitor          # Monitor relay channel

# Self-Improvement
# Poll jobs run automatically via cron
```

---

## Alignment Mechanisms

| Mechanism | File | Interval |
|-----------|------|---------|
| Health Check | health-protocol.json | 15s |
| Agent Discovery | terminal-heartbeat-pulse | 30s |
| Director Cycle | tnf-director-loop | 15s |
| Sub-Director | subdirector-autopilot | 30s |
| Model Health | model-health-monitor.py | - |
| Self-Improve | tenant-self-improvement | - |

---

## Growth Mechanisms

| Mechanism | Directory | Frequency |
|-----------|-----------|-----------|
| Self-Improve | poll-jobs/tenant-self-improvement-loop/ | cron |
| Continuous QA | poll-jobs/tenant-continuous-qa-loop/ | cron |
| Nightly Maint | poll-jobs/tenant-nightly-maintenance/ | nightly |
| Knowledge Scout | poll-jobs/tenant-knowledge-scout-sprint/ | cron |

---

## Related Skills

- `tnf-cli-agent-workflow` - CLI operations
- `feature-parity-cli-extension` - CLI parity
- `framework-consciousness` - P0 understanding