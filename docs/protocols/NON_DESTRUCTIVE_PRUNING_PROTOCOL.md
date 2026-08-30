# 🛡️ Non-Destructive Pruning & Cloud Logic Offloading Protocol

`[CLASS:PRIME] [STATUS:LOCKED] [SCOPE:SYSTEM-WIDE]`

## 1. Core Mandate: Zero Data Loss Through Tiered Offloading

In The New Fuse, **pruning is NEVER destructive deletion of knowledge**. Pruning
is the controlled transition of data across operational tiers:

```
[Active Memory / Hot Context]
       │
       ▼ (Distill Core Logic & Action Points)
[Cloud Logic Log / Durable Ledger]  <─── Lightweight Core Facts & Proven Insights
       │
       ▼ (Offload Heavy Raw Situational Data)
[Cold Storage Archive / MemPalace Vault]  <─── 100% Verbatim Retained Locally / Cloud Object
```

1. **Hot Tier (Local Active Workspace)**:
   - Contains only concise, current, and active logical chains required for
     immediate task execution.
   - Kept strictly within context budget to eliminate Out-Of-Memory (OOM) errors
     and model confusion.

2. **Warm Tier (Cloud Logic Log / Durable Ledger)**:
   - **What is sent**: High-density, human-attributable logical points,
     architectural decisions, failure post-mortems, and version milestones.
   - **What is stripped**: Fluff, verbose debugging steps, raw audio/video
     frames, and temporary sandbox outputs.
   - **Target Endpoints**: Cloudflare Durable Objects / Supabase Timeline /
     Central Git Documentation Sync (`the-new-fuse-docs-private`).

3. **Cold Tier (Verbatim Storage & Failure Archaeology)**:
   - Raw transcripts, full VTT logs, and historical JSON snapshots are moved to
     `data/intelligence-artifacts/_archive/` and compressed.
   - Backlinked via unique identifiers (`MCID` / `resource_pointer`) so that any
     summary can be verified against its raw origin if needed.

---

## 2. Cloud Offload Schema for Pruned Intel

When an artifact or session log undergoes pruning, the system must generate a
**Core Logic Digest** before offloading:

```json
{
  "$schema": "tnf/logic-digest/1.0",
  "digest_id": "digest-2026-08-29-001",
  "source_pointer": "mempalace://drawers/transcripts/673_Full_Workshop_RL_Kernels.txt",
  "attribution": {
    "creator": "Human / Channel Name",
    "timestamp": 1788048000000,
    "classification": "CLASS:PRIME"
  },
  "core_logical_points": [
    "Test-Time RL requires kernel-level JIT function compilation to avoid Python IPC overhead.",
    "Decoupled prompt stylesheets prevent model formatting drift across minor version updates."
  ],
  "procedural_artifacts": [
    {
      "command": "pnpm run tnf:forge:compile --target=wasm",
      "purpose": "Native compilation target for edge deployment"
    }
  ],
  "anti_patterns_recorded": [
    "Never mount raw uncompiled TS in production loop due to garbage collection spikes."
  ],
  "pruned_from_active_context_at": "2026-08-29T22:15:00Z"
}
```

---

## 3. Operational Rules for Agents

1. **Before Truncating or Purging Any History**:
   - An agent must verify that the **Core Logic Points** have been extracted and
     written to the persistent ledger (`LIVING_STATE.md` or Cloudflare DO /
     Supabase).
2. **Never Blind-Delete**:
   - Local cleanup scripts (`scripts/operations/swarm-disk-retention.sh`,
     `hermes-state-retention.cjs`) must gzip and move historical files to
     `_archive/` rather than executing `rm -rf` without a trace.
3. **Auditability**:
   - The cloud logic log serves as the continuous lineage for both Super Admin
     and any open-source user adopting TNF.
