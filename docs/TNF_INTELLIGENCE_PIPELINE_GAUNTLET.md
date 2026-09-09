# The TNF Intelligence Pipeline: "The Gauntlet"

## Vision & Objective

To evolve The New Fuse (TNF) from a reactive multi-agent orchestrator into an
**Autonomous Self-Training Engine**. The system will ingest raw, unstructured
multi-modal data, process it through a hierarchical battery of logical filters
(The Gauntlet), and output prioritized, actionable "factoids" that map directly
to system execution and self-improvement.

## 📥 Stage 1: Continuous Multimodal Ingestion (The Sensor Array)

The system connects to streams of raw human context:

1. **Email Archaeology:** Historical context, past decisions, and interpersonal
   communications (currently being exported to Supabase by Codex).
2. **Video & Audio Transcripts:** YouTube playlist scraping (via
   `tnf-youtube-ingestion` skill), extracting both content and temporal
   metadata.
3. **Personal Notes & Ledgers:** Parsing Markdown knowledge bases, daily plans,
   and brain dumps.
4. **Native Sensory Streams:** Live screen capture (Vision Bridge) and acoustic
   patterns (Audio Trigger).

_Core Principle:_ Maintain an immutable link to the **Original Source Block**
(The Attribution Cornerstone). The raw context is never discarded.

## ⚙️ Stage 2: Decomposition & The "Gauntlet of Filters"

Information passes through a proprietary hierarchy of logical filters to extract
pure "factoids." This process is visualized as a **4-D Field of Potential**,
where agents refine **Scoped Grids** within the global Merkle Tree.

1.  **Relevance Filter:** Is this information actionable, informational, or
    noise?
2.  **Attribution Filter:** Verifies the cryptographic link to the **Original
    Source Block**.
3.  **Deduplication & Conflict Filter:** Checks the factoid against the **Vector
    Synapse** to resolve contradictions or reinforce established patterns.
4.  **Density & Utility Filter:** Scores the factoid based on its
    **Implementation Density** (how much code/action it generates) and
    **Freshness Utility**.
5.  **Actualization Filter:** Converts the verified factoid into a
    **Directive**.

6.  **Modality Enrichment Filter (LAST, post-value):** Gaps detected in the raw
    transcript (visual references, audio cues, external artifacts) are **not**
    resolved during ingestion. They are tagged `blocked: modality-gap` on their
    parent factoid and survive only if that factoid passes filters 1–5 and
    scores into the action queue (core-TNF value or user-project value). For
    queue-bound items only, the missing modality is then filled (frame/audio
    extraction -> vision/OCR description) as the **final enrichment step**.
    Filled content re-enters this Gauntlet at Dedupe/Conflict + Density/Utility
    for a **post-fill re-gate** before insertion into the task/action queue —
    fill can downgrade (redundant -> drop) or upgrade an item. Frames/audio are
    ephemeral: describe, persist text into the factoid, delete. Exception: keep
    a frame only if explicitly judged to hold long-term value untranslatable to
    text/code.

_Core Architecture:_ The filters are not code; they are **Compiled Protocols**
found in `.md` files like `AGENTS.md` and `SOUL.md`, which the **Harness** uses
to direct the MoE Engine.

## 🧠 Stage 3: Vectorization & Native Memory (The Synthesizer)

- Factoids are embedded using multimodal embedding models.
- Stored durably in `pgvector` (Supabase).
- Ingested into the **Native Vector Synapse** (C++ AVX2 / Rust) for
  sub-millisecond semantic retrieval.
- Structural intuitions are forged into static weights (`weight_forge.py`) so
  the kernel "instinctively" knows where data belongs.

## 🚀 Stage 4: Autonomous Actualization (Productivity)

- The orchestrator agents continuously query the Vector Synapse.
- High-priority factoids are automatically converted into **Intent**.
- Intent is translated into code changes, communication routing, or
  infrastructure provisioning without explicit human prompting.

## 🌌 Stage 5: The TNF Custom LLM

By hoarding these perfectly attributed, highly filtered factoids alongside their
original source blocks, TNF is building an elite, proprietary dataset.

- **Future State:** This dataset will be used to fine-tune an open-source
  multimodal foundation model (e.g., Llama 3, Qwen-VL).
- TNF will run its own specialized weights natively via the LLVM Forge, severing
  dependency on external API providers for core reasoning.
