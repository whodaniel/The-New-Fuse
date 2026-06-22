---
name: tnf-framework-overview
description:
  Provides comprehensive understanding of The New Fuse (TNF) multi-agent
  platform architecture, design principles, and current development focus for
  bridging with Hermes Agent capabilities.
category: tnf
---

# TNF Framework Overview Skill

## Purpose

Provides comprehensive understanding of The New Fuse (TNF) multi-agent platform
architecture, design principles, and current development focus for bridging with
Hermes Agent capabilities.

## When to Use

- When needing to understand TNF's technical architecture
- When planning to bridge Hermes Agent capabilities to TNF
- When working on TNF development or integration tasks
- When explaining TNF to team members or stakeholders
- When the user asks "is TNF ready for public release?" — this skill orients the
  response but does NOT replace the release-readiness checklist under
  `docs/release-readiness/`.

## Key Components

### Architecture Overview

- **Monorepo Structure**: Packages include `a2a-core`, `agent`,
  `agent-coordination`, `api`, `api-gateway`, `auth`, `claude-skills`, `core`,
  `crypto-agent-framework`
- **Core Systems**:
  - A2A (Agent-to-Agent) protocol with Redis-based communication
  - Multiple communication bridges (AgentSyncBridge, ProtocolBridge, MCPBridge,
    MonitorBridge)
  - Sophisticated workflow orchestration engine
  - Integration systems for MCP, provider management, asset registry
- **Specialized Frameworks**:
  - Crypto Agent Framework (trading/bot agents)
  - Claude Skills System (skill-based agent capabilities)

### Design Principles (from AGENTS.md)

- **Operating Loop**: Inspect → Act → Verify (validate state before/after
  actions)
- **Zero Trust Between Agents**: Validate inputs at every processing stage
- **DOM Over Screenshots**: Prefer structured APIs for data access
- **Architecture Before Syntax**: Define module boundaries before implementation
- **Prefer Cheap/Fast/Good Enough**: Benchmark models before assuming
  cost=quality
- **Data Cleaning Focus**: Improves retrieval spread, not just top-1 results
- **Single Binary Philosophy**: Zero runtime dependencies for deployments

### Current Development Focus (TNF Bridge Implementation Plan)

Actively bridging Hermes Agent capabilities to achieve feature parity:

1. **Skill Registry Bridge**: Unified skill management system (~/.tnf/skills/)
2. **Subagent Spawning Bridge**: Isolated subagent spawning (`delegate_task`
   equivalent)
3. **MCP Server Bridge**: Full MCP server support beyond current Redis bridge
4. **Gateway Failover Bridge**: Automatic provider failover like Hermes'
   rate-limit-failover-routing

### Verifying the TNF CLI Agent

### Verifying the TNF CLI Agent

The TNF CLI agent (`tnf`) is the primary entrypoint for TNF operations. To
verify its health and configuration, run:

```bash
tnf doctor
```

Common issues observed during verification:

- **MCP placeholders passing doctor (M04 gate — VIP)**: `tnf doctor` checks file
  _existence_, not whether the file is a real implementation. The skill used to
  instruct fixers to "create these files (or ensure they exist) under `src/mcp/`
  with minimal implementations that satisfy the doctor check." **Do not follow
  that recipe.** It produced literals at
  `src/mcp/{server,enhanced-tnf-mcp-server,complete-api-mcp-server}.ts` whose
  entire body is
  `console.log('TNF … placeholder - not implemented'); process.exit(0);`. TNF
  doctor still says OK because the files exist. This is a self-faked health gate
  and the most consequential blocker in
  `docs/release-readiness/CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md` row M04.
  Tell `tnf doctor` to look for **non-placeholder content**, or implement the
  servers properly. See skill: `tnf-public-readiness-audit`.
- **Missing MCP server entry points**: The doctor script expects files like
  `src/mcp/server.ts`, `src/mcp/enhanced-tnf-mcp-server.ts`, and
  `src/mcp/complete-api-mcp-server.ts` under the repository root. These files
  were missing, causing the doctor to report missing critical files. The fix is
  to create these files (or ensure they exist) under `src/mcp/` — but **with
  real implementations**, not placeholders. The earlier placeholder instruction
  has been superseded.
  > as "boot looks healthy" and pair it with one of:
  >
  > - `tnf doctor --release` if the flag exists in your build (the strict mode
  >   that also probes health endpoints and the readiness probe URL).
  > - Otherwise run the readiness probe at
  >   `docs/release-readiness/CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md`
  >   directly, or any umbrella skill that wraps it.
  > - `memory(action=list)` should not leak threat-pattern artifacts (e.g.
  >   `c2_heartbeat`); treat a leaked pattern as a P0 sanitizer job, NOT as
  >   background noise.

Common issues observed during verification:

- **MCP server entry-point files absent**: `tnf doctor` looks for
  `src/mcp/server.ts`, `src/mcp/enhanced-tnf-mcp-server.ts`,
  `src/mcp/complete-api-mcp-server.ts`. **Do not paper over absences with
  placeholder echo files.** A file that prints `"placeholder - not implemented"`
  and `process.exit(0)` makes the doctor green while every downstream MCP client
  will hang waiting for a real server. The right remedies, in order:
  1. Wire the real `@the-new-fuse/mcp-core` server.
  2. Make `tnf doctor` explicitly warn when an entry-point is a placeholder
     rather than emit `OK`.
  3. Delete the entry-point file and let the doctor report the absence loudly so
     the gap is visible in CI output. Promoting "create an echo placeholder" as
     a fix is a failure mode earlier revisions of this skill encoded; that
     guidance has been removed. If you find older revisions of this skill
     advising the opposite, treat them as superseded.
- **Port conflicts**: The doctor checks for open/closed ports on localhost. If
  services are not running locally (e.g. they are deployed to Cloud Run), some
  ports may appear closed. This is expected in a cloud-deployed setup; the
  doctor's port checks are informational. For real internet-facing health, hit
  `https://api.thenewfuse.com/health` and check for an RFC3339 `timestamp`
  field. A missing timestamp on health means the SLO is unmeasurable — that
  absence is itself a release blocker, see
  `docs/release-readiness/CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md`.
- **WhatsApp Bridge Health**: The doctor may report the WhatsApp bridge as
  reachable-not-connected. This is normal if the bridge has not been paired with
  a phone. Pairing is required for full functionality.

### Public-facing readiness

When the user asks "is TNF ready for public release?", pair this skill with
`docs/release-readiness/CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md` (or the
umbrella skill that wraps it). Cold-start findings that future operators should
surface early in any public-release conversation:

- The handoff JSON's `CLOUD_HEALTH.lastChecked` is often stale (>7d is common).
  Refuse to treat stale `lastChecked` evidence as fresh health.
- Active-directives cache commonly lists 10+ `DEGRADED` items. Every item must
  be addressed or marked Accepted-With-Debt before public launch.
- Skill count and `@ts-ignore` count are proxy hygiene metrics: a launch should
  land with `skill_stale_count < 50` and `@ts-ignore` count in core apps
  dropping toward 0 each cycle.

If you close a session with release-readiness probes in flight, append the
latest probe outcomes into `docs/release-readiness/PROBE_LATEST.json` so the
next session inherits the working state. Do not let in-flight probes become
invisible background noise.

### Infrastructure & Deployment

- **Migration**: From Railway to GCP (Cloud Run) + Cloudflare/Supabase/Upstash
- **Memory System**: Holographic memory (local SQLite + HRR compositional
  retrieval)
- **Deployment Model**: Multi-instance mesh (Local Primary, Cloud Primary, Cloud
  Secondary, Cloud Sandbox)
- **Operating Rule**: No idle standing by - always run background work, only
  interrupt for critical decisions
- **Priority Test Case**: iPhone Vision Bridge (native macOS QuickTime USB
  mirroring) for LLVM forge system

### Public Positioning (thenewfuse.com)

- **Tagline**: "Stop duct-taping APIs. Start orchestrating intelligence."
- **Core Features**:
  1. Universal MCP & A2A Integration (connect to Claude, GPT-4, Gemini via Redis
     Synaptic Bus)
  2. Lux Bridge Intelligence (text-first DOM + visual-first pixel reasoning)
  3. SkIDEancer Cloud IDE (autonomous AI-driven development environment)

## Verification Steps

- Review TNF_MASTER_DNA_v4.md for logical DNA mapping
- Check AGENTS.md for engineering principles
- Examine TNF_EXHAUSTIVE_AST_MAP.md for detailed architecture
- Review TNF-BRIDGE-IMPLEMENTATION-PLAN.md for current bridging efforts
- Visit thenewfuse.com for public positioning and features
- For release readiness, also load (or recreate) the readiness umbrella and walk
  `docs/release-readiness/CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md` row-by-row
  with named owners

## Related Skills

- webpilot: For navigating and scraping TNF documentation
- tnf-validation-pipeline-fixer: For handoff-packet validation recovery
- tnf-vocabulary-alignment-audit: For protocol vocabulary drift checks
- tnf-\* (other): Vision bridge, audio, health checks, etc.
- hermes-agent: For understanding Hermes capabilities to bridge
- delegate_task: For understanding subagent spawning to bridge
- native-mcp: For understanding MCP support to bridge
- rate-limit-failover-routing: For understanding failover mechanisms to bridge
