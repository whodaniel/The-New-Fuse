# ⚡ Gemini Spark & Google Intelligence Integration Spec

[CLASS:PRIME] [STATUS:ACTIVE]

## Overview

This document outlines the architecture, integration points, and protocol
adapters required for The New Fuse (TNF) to interface with **Google Gemini
Spark** (Google's 24/7 autonomous cloud personal agent framework launched at
Google I/O 2026) and your local/cloud Personal Intelligence state.

---

## 1. What is Gemini Spark?

- **Definition**: An always-on, background-autonomous personal agent running on
  Google Cloud VMs (powered by Gemini 3.5 Flash & Google Antigravity framework).
- **Protocol Core**: Interoperates natively via **Model Context Protocol (MCP)**
  and **WebMCP** standards.
- **Scope**: Manages long-horizon tasks (hours to days), Google Workspace
  (Gmail, Docs, Sheets, Calendar, Drive), and external tools via MCP adapters.

---

## 2. TNF Integration Architecture

TNF acts as the local control plane and orchestrator, routing tasks
bidirectionally between TNF agent swarms and Gemini Spark tasks via MCP bridge
synapses.

```
+-------------------------------------------------------------------+
|                        THE NEW FUSE (TNF)                         |
|                                                                   |
|   +-------------------+       +-------------------------------+   |
|   |  Local SubDirector|       |   OpenClaw Multi-Channel      |   |
|   |  (Antigravity TUI)|       |   (WhatsApp, Telegram, Slack) |   |
|   +---------+---------+       +---------------+---------------+   |
|             |                                 |                   |
|             +-----------------+---------------+                   |
|                               |                                   |
|                     +---------v---------+                         |
|                     | TNF Synaptic Bus  |                         |
|                     +---------+---------+                         |
|                               |                                   |
+-------------------------------|-----------------------------------+
                                | (MCP / WebMCP Adapter)
                                |
               +----------------v----------------+
               |  Google Workspace / Spark MCP  |
               |  Bridge & Personal Intelligence |
               +----------------+----------------+
                                |
             +------------------v------------------+
             |        Google Gemini Spark          |
             |   (Cloud Long-Horizon Autonomy)     |
             +-------------------------------------+
```

---

## 3. Synaptic Bridge Capabilities

1. **Workspace & Personal Intelligence Connection**:
   - Access to `google-workspace` lazy-loaded MCP tools (Gmail, Google Docs,
     Sheets, Calendar, Drive).
   - Direct synchronization of `lessons-learned.md`, `LIVING_STATE.md`, and
     session handoffs to Google Workspace documents.

2. **Bidirectional Task Offloading**:
   - **Local -> Spark**: Hand off long-running, long-horizon tasks (e.g.
     multi-day travel tracking, continuous web scouting) to Gemini Spark in the
     cloud.
   - **Spark -> Local**: Receive background updates, RSVP summaries, and event
     triggers into TNF Redis Synaptic Bus (`ws://127.0.0.1:3007/ws`).

3. **WebMCP & Skill Parity**:
   - Export TNF `.agent/skills/` as teachable Spark Skill playbooks.
   - Expose WebMCP structured schemas so Spark agents can trigger TNF local
     commands securely.

---

## 4. Operational Commands (Planned TNF CLI Extensions)

```bash
# Check status of Spark MCP connection & personal intelligence sync
tnf spark status

# Hand off a long-horizon goal to Gemini Spark
tnf spark delegate "Monitor flight prices and draft itinerary in Docs"

# Sync TNF lessons-learned & living state to Gemini Workspace
tnf spark sync
```
