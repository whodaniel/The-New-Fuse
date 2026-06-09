# 🏗️ The Executable Intelligence Framework

**Status:** ACTIVE
**Scope:** TNF Ingestion Pipeline
**Location:** /The-New-Fuse/docs/protocols/

This framework governs how TNF agents transform unstructured data (Transcripts, Logs, Reports) into machine-actionable artifacts for the Self-Synthesizing Kernel.

## 1. The Taxonomy of Actionability

Agents must extract intelligence into three distinct action planes:

### A. Procedural (Execution)
- Exact CLI commands, syntax, script names, and configuration payloads.
- Step-by-step technical playbooks (e.g., "Deploying to Cloudflare Wasm").
- Identified "validated defaults" from expert sources.

### B. Strategic (Forecasting)
- Industry shifts and technology delta analysis (e.g., "Migration from LangChain to MCP").
- Structural patterns, architectural decisions, and visual design standards (e.g., "TNF Vibe Standard").
- Consensus building across multi-agent streams.

### C. Governance (Safety)
- Failure Archaeology: Mapping the exact steps that lead to known errors (Anti-Patterns).
- Troubleshooting Heuristics: Mental models for debugging and system recovery.
- Claims that require local benchmarking in the JIT Forge before adoption.

## 2. Utility Metrics

Every intelligence artifact must be scored by these criteria:

| Metric | Range | Description |
| :--- | :--- | :--- |
| **Freshness Decay** | High/Med/Low | How fast the info becomes obsolete (e.g., API syntax is High decay). |
| **Implementation Density** | 0.0 to 1.0 | Ratio of runnable code/config to theoretical discussion. |
| **Verification Difficulty** | Easy/Hard | The level of effort required to test the intelligence locally. |

## 3. Storage & Linking

- **Verbatim Origin:** Raw text is always stored in the `MemPalace` Wing.
- **Distillation:** The actionable artifact is stored in the Karpathy-style `AI Wiki` structure.
- **Linking:** Every entry must point to the verbatim "Room" or "Drawer" in the MemPalace to uphold the **Attribution Overrule**.

## 4. Intelligence Decay & Archiving

- **Terminal Decay Trigger:** If an artifact's "Freshness Decay" is High and a superseding procedure is successfully validated by the system (e.g., through a challenge protocol or newly merged CI execution), the artifact is flagged for archival.
- **Archival Action:** The agent MUST change the artifact's status to `[STATUS:ARCHIVED]` and move it to the `data/intelligence-artifacts/_archive/` directory.
- **Historical Integrity:** Archived artifacts remain untouched and retain their original `source_pointer`. They serve as the system's "Failure Archaeology" and can be referenced for root-cause analysis when debugging regressions.
