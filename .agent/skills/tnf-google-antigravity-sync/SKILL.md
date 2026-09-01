---
name: tnf-google-antigravity-sync
description: >-
  Bridge, synchronize, and expose Google Gemini, Google Antigravity, and Google
  AI ecosystem sessions, projects, and personal intelligence artifacts into TNF
  local registries (~/.tnf/sessions) and cloud dashboards (app.thenewfuse.com).
  Use when syncing sessions, verifying Google accounts/projects, running
  conversation audits, or streaming personal intelligence to the TNF network.
primary_type: protocol
category: intelligence/sync
department: tech
risk_tier: low
harmful_pattern_detection: false
---

# TNF Google Gemini & Antigravity Personal Intelligence Sync

Synchronizes local Google Gemini and Antigravity CLI assets (conversations,
brain runs, project maps, and memory) with TNF local stores (`~/.tnf/sessions`,
`~/.local/share/tnf/sessions`) and cloud synchronization endpoints
(`app.thenewfuse.com`).

## Capabilities & Scope

1. **Automated Session Ingestion:** Reads from
   `~/.gemini/antigravity-cli/conversation_summaries.db` and normalizes records
   into TNF's canonical `Session` schema.
2. **Brain Artifact Linking:** Maps session brain directories in
   `~/.gemini/antigravity-cli/brain/<cid>` with full trajectories and
   transcripts.
3. **Ecosystem State Auditing:** Validates active Google accounts, registered
   projects in `~/.gemini/projects.json`, and Google Workspace MCP server
   availability.
4. **Cloud-Ready Concordance:** Generates
   `~/.tnf/personal-intelligence/google_ai_session_concordance.json` and
   human-readable digests in `google_ai_ecosystem_state.md`.

## Execution Workflow

### 1. Check Ecosystem Status

```bash
python3 scripts/google-ai/tnf_gemini_antigravity_bridge.py --status
```

Outputs active accounts, database connection status, conversation count, and
brain folder count.

### 2. Synchronize Sessions into TNF Registries

```bash
python3 scripts/google-ai/tnf_gemini_antigravity_bridge.py --sync
```

Populates:

- `~/.tnf/sessions/sessions.json`
- `~/.local/share/tnf/sessions/index.json`
- `~/.tnf/personal-intelligence/google_ai_session_concordance.json`
- `~/.tnf/personal-intelligence/google_ai_ecosystem_state.md`

### 3. Run Durable Intake Forwarder (Gauntlet Scrub & Promote)

```bash
python3 scripts/autonomy/tnf_intake_forwarder.py --input-dir ~/.tnf/personal-intelligence --stage
```

### 4. Verify in TNF CLI

```bash
tnf session list
```

All synchronized Google Gemini / Antigravity sessions will be immediately
listed, searchable, and exportable.
