# 🏛️ MemPalace & TNF Information Processing Meta-Chart

**Status:** ACTIVE
**Scope:** System-Wide Master Operating Procedures
**Location:** /The-New-Fuse/docs/protocols/

This chart maps the consolidated ecosystem of memory and information processing in TNF, merging historical solutions with the spatial MemPalace architecture.

| Pipeline / Mechanism | Ingestion Method | Storage Philosophy | Data Structure | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **MemPalace (Core)** | **Zero-Cost Heuristics** (Regex) | **Verbatim** (100% Raw Text) | Spatial (`Wings/Halls/Rooms/Drawers`) | Baseline context. Infinite, flawless recall of exact quotes and raw code snippets without context loss. |
| **Karpathy AI Wiki** | LLM Distillation | Synthesized JSON | Flat Categories + `backlinks` | Software 3.0 knowledge graphs mapping theoretical concepts and architectural relationships. |
| **Executable Intel** | LLM Action Prompting | Actionable JSON Schema | `Procedural`, `Strategic`, `Governance` | Transforming unstructured tutorials into runnable CLI code, playbooks, and system guardrails. |
| **System Memory** | Tool-driven CLI (`save_memory`) | Literal Facts | Key-Value flat lists | Persistent CLI preferences, project-specific workflows, user directives across sessions. |
| **RAG Vault** | Chunking & Embedding | Vector Embeddings | Semantic proximity | Deep research, answering abstract questions across thousands of documents. |
| **Timeline Ledger** | AST & Chrono Extraction | Sequential Markdown | Absolute Time Progression | Mapping technology evolution chronologically (Video #1 to #N) to prevent timeline corruption. |
| **JSON Backlog (Handoff)** | **Handoff Pruning** | Disk-First / Lazy-Loading | Linked File Matrices | Preventing memory bloat (OOM) by keeping massive JSON session data out of active RAM. |

---

## The Merged Workflow

1. **Ingestion (Zero Cost):** Verbatim data hits the `MemPalace Router` and is vaulted in a specific "Room."
2. **Analysis (Executable Intel):** Agents extract machine-actionable artifacts using the `Actionability Taxonomy`.
3. **Compound Linking (Karpathy Wiki):** Artifacts are saved to the Wiki with a `resource_pointer` back to the MemPalace verbatim source.
4. **Context Management (Pruning):** Active context only loads the Wiki artifact; the raw MemPalace source is lazy-loaded only when requested.
