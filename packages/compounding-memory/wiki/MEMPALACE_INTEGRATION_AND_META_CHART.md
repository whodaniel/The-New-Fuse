# 🏛️ MemPalace & TNF Information Processing Meta-Chart

**Status:** ACTIVE  
**Architect:** The Enlightened Borg (Leeloo / Milla Jovovich)  
**Mandate:** Transform the TNF "messy warehouse" of flat-indexed knowledge into a spatial, zero-cost, hyper-accurate memory architecture.  

---

## 1. The Adaptation of Karpathy's AI Wiki
Prior to MemPalace, TNF implemented Andrej Karpathy's "Software 3.0" vision via the **Compounding Memory** package:
- **Location:** `packages/compounding-memory/schemas/entry.schema.json`, `scripts/karpathy_batch_distiller.py`
- **Mechanism:** Information (like neural network fundamentals or GPT-2 reproduction logic) was distilled via LLMs into rigid JSON schemas containing `# title`, `category`, `content`, and `backlinks`.
- **Constraint:** This approach relied on LLM summarization (which hallucinates granular details) and flat category enum lists (`architecture`, `decision`, `pattern`, `deconstruction`, `assimilation`).

---

## 2. The MemPalace Integration (The Spatial Architecture)
We are upgrading the Karpathy Wiki and the Executable Intelligence pipeline into **MemPalace**. Instead of abstract vectors and lossy summaries, MemPalace enforces **Verbatim Storage** and a **Spatial Hierarchy**, processed via zero-cost local regex heuristics rather than expensive LLM APIs.

### The Spatial Structure in TNF
1. **Wings (High-Level Domains):** 
   - `wing:engineering` (Code, Architecture, Forge)
   - `wing:intelligence` (Video Artifacts, Transcripts, Research Logs)
   - `wing:governance` (Safety, Security, Access Logs)
2. **Halls (Data Streams):**
   - `hall:video-transcripts` (Raw verbatim text from YouTube)
   - `hall:system-memory` (Global CLI preferences, `save_memory` facts)
   - `hall:agent-dialogue` (Raw A2A interaction history)
3. **Rooms (Clustered Concepts):**
   - `room:gemini-api`, `room:mcp-protocols`, `room:react-ui`, `room:llvm-forge`
4. **Wardrobes & Drawers (Granular Data Points):**
   - `wardrobe:code-blocks`, `wardrobe:error-logs`, `drawer:cli-commands`

### The Merged Paradigm: MemPalace + Executable Intelligence + Karpathy Wiki
- **Ingestion (Zero-Cost Write Path):** Incoming data (e.g., transcripts) passes through the `MemPalace Router` (Regex/Heuristics). It extracts literal text (Wardrobes/Drawers) and maps it to a Room/Hall/Wing based on keyword clustering, costing $0.00 and preserving 100% of the original string.
- **Distillation (Executable Artifacts):** When a specific Action Plane (Procedural, Strategic, Governance) is needed, an Agent enters the specific "Room", retrieves the verbatim "Drawer" contents, and generates the `Executable Intelligence JSON Schema`.
- **Compound Linking (Karpathy Wiki):** The generated artifact is saved into the Karpathy structure with explicit `resource_pointers` back to the raw MemPalace Wardrobe, ensuring zero loss of origin context (The Attribution Cornerstone).

---

## 3. MASTER META-CHART: TNF Information Processing Ecosystem

| Pipeline / Mechanism | Ingestion Method | Storage Philosophy | Structure | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **MemPalace (Core)** | **Zero-Cost Heuristics** (Regex, Keywords) | **Verbatim** (Raw Text, No Loss) | Spatial (`Wings/Halls/Rooms/Drawers`) | 96.6% Recall Accuracy, Baseline context storage. |
| **Karpathy AI Wiki** | LLM Distillation (`karpathy_batch_distiller.py`) | Synthesized JSON (`entry.schema.json`) | Flat Categories + `backlinks` | Software 3.0 knowledge graphs, theoretical concepts. |
| **Executable Intel** | Gemini LLM (`ExecutableIntelligencePipeline.ts`) | Actionable JSON Schema | `Procedural`, `Strategic`, `Governance` | Transforming video tutorials into runnable CLI code/playbooks. |
| **System Memory** | Tool-driven (`save_memory` global/project) | Literal Facts | Key-Value flat lists | Persistent CLI preferences, project-specific workflows. |
| **RAG Vault** | Chunking & Embedding (`my-ai-knowledge-base`) | Vector Embeddings | Semantic proximity | Deep research, "vibes", answering abstract questions. |
| **Timeline Ledger** | AST & Chrono Extraction (`StrictNumericIndexRebuild.ts`) | Sequential Markdown | Absolute Time progression | Mapping technological evolution (oldest to newest). |

---

## 4. The MemPalace Router implementation
The new zero-cost ingestion engine is located at: `scripts/mempalace_router.ts`
It maps incoming documents into the spatial directory structure using RegEx, completely bypassing the LLM.