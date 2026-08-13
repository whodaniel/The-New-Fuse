# Verified Doc: TNF Command Map

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1777314837.5308876

## Content

# TNF Master Command Inventory

This is a comprehensive map of all commands and operational paths available in
The New Fuse ecosystem. It serves as the single source of truth for command
discovery, mirroring the functionality of an IDE Command Palette (Cmd+Shift+P).

## 1. Core CLI Commands (`./tnf <command>`)

These are the primary entry points for the TNF Self-Synthesizing Kernel.

| Command       | Description                                                            |
| :------------ | :--------------------------------------------------------------------- |
| `boot`        | Master entry point to boot the entire TNF stack.                       |
| `forge`       | **LLVM-powered JIT compilation** and native machine code optimization. |
| `mirror`      | iPhone/iPad mirroring and AI vision bridge operations.                 |
| `super-cycle` | Cloud-first orchestration and long-running agent loops.                |
| `relay`       | Real-time multi-agent communication and synaptic bus operations.       |
| `jules`       | Autonomous automation engine for batch processing and PR management.   |
| `skills`      | Skill bank operations (sync, ingest, audit).                           |
| `metaskills`  | Meta-skills audit and cognitive layer diagnostics.                     |
| `mcp`         | Model Context Protocol utilities and server management.                |
| `ai`          | AI launcher and prompt engineering utilities.                          |
| `chat`        | Interactive chat session with the TNF Orchestrator (Gemini OAuth).     |
| `acp`         | Agent Control Protocol server operations.                              |
| `auth`        | Credential management and secure token rotation.                       |
| `compat`      | Compatibility and migration tools (TNF <-> OpenClaw).                  |
| `voice`       | Voice Bridge commands (TTS/STT, anchor target).                        |
| `doctor`      | System-wide health checks and quick fixes.                             |
| `onboard`     | Frontload onboarding for new environment setup.                        |
| `menu`        | Visual command menu (Run `tnf menu --full` for the complete list).     |

---

## 2. Integrated IDE Commands (VS Code / SkIDE)

These commands are exposed in the IDE Command Palette (`Cmd+Shift+P` -> "TNF").

| Command ID                          | Title                                |
| :---------------------------------- | :----------------------------------- |
| `theNewFuse.sendMessage`            | Send Message to Swarm                |
| `theNewFuse.securityScan`           | Run Security Audit on Active File    |
| `theNewFuse.collectiveOrchestrator` | Launch Collective Intelligence Loop  |
| `theNewFuse.aguiVisualize`          | Generate Architectural Visualization |
| `theNewFuse.memoryBank`             | Access Persistent Memory Bank        |
| `theNewFuse.relayMonitor`           | Monitor Synaptic Bus Activity        |
| `theNewFuse.agentFederation`        | Manage Multi-Agent Roles             |
| `theNewFuse.openWorkflowBuilder`    | Open Interactive Workflow Designer   |
| `theNewFuse.terminalOrchestration`  | Spawn TNF-Optimized Terminal         |
| `theNewFuse.planManager`            | Review and Approve Strategic Plans   |

---

## 3. High-Level Automation Scripts (`./tnf scripts run <path>`)

The `scripts/` directory contains hundreds of specialized tools. You can run any
of these directly via the CLI.

### Agent & Swarm Ops

- `scripts/swarm/kraken-swarm.mjs`: Multi-agent stress testing.
- `scripts/swarm/roll-call.cjs`: Agent status verification.
- `scripts/vision_native.py`: Low-level vision processing.
- `scripts/tnf_deconstructor.py`: Self-autophagy / code analysis.

### Infrastructure & Deployment

- `scripts/cloud_runtime/cloud_runtime-deploy-saas.sh`: ⚠️ **DEPRECATED** Production SaaS
  deployment. CloudRuntime is no longer used; deploy via GCP Cloud Run + Cloudflare.
  See `CLOUD_MIGRATION_BLUEPRINT.md`.
- `scripts/deployment/blue-green-deploy.sh`: Zero-downtime rollouts.
- `scripts/cleanup/deep-cleanup.sh`: Exhaustive workspace pruning.

### Development Utilities

- `scripts/utils/enhanced-treeshaker.ts`: Dead code elimination.
- `scripts/fix-native-modules.sh`: LLVM/Native bridge repair.
- `scripts/audit-doc-hygiene.sh`: Documentation completeness check.

---

## 4. Package-Specific Scripts (`pnpm run <name>`)

Key operational scripts defined in `package.json` manifests.

- `tnf:start`: Boot the local development environment.
- `tnf:onboard`: Full system initialization.
- `build:adaptive`: Memory-optimized monorepo build.
- `db:push`: Synchronize database schema with Drizzle.
- `framework-consciousness:evolve`: Cognitive layer self-improvement loop.
- `journey:program:master-loop`: Automated development journey tracking.

---

## 5. Command Discovery Logic

To find a command programmatically:

1. **Search CLI**: `./tnf --help` or `./tnf menu --full`.
2. **Search Scripts**: `./tnf scripts list`.
3. **Search IDE**: Type "TNF" in the IDE Command Palette.
4. **Search Code**: Grep for `program.command` in `packages/tnf-cli` or
   `contributes.commands` in `apps/vscode-extension`.

---

_Last updated: April 27, 2026_

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
