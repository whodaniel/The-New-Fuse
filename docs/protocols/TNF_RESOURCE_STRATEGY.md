# ⚖️ TNF Resource Strategy Protocol (v2.0)

**Status:** ACTIVE
**Class:** [CLASS:PRIME]
**Classified By:** Strategic Analyst (Traversal: INFRA-002)

## 1. Overview
The TNF Resource Strategy handles the intelligent selection, rotation, and management of LLM and compute resources. This v2.0 update integrates 312 distilled strategic artifacts to optimize for **Inference Arbitrage** and **Hardware-Native Autonomy**.

---

## 2. Strategic Primitives

### A. Inference Arbitrage (Cost/Reasoning Optimization)
TNF agents must employ "Model-Task Mapping" to preserve high-value tokens.
- **Tier 1 (Edge Reasoning):** Use SLMs (e.g., Llama 3.2 3B, Qwen-2.5 7B) for Turn-0 disambiguation, summarization, and regex-level routing.
- **Tier 2 (Utility Reasoning):** Use mid-tier models (e.g., DeepSeek-V3, GPT-4o-mini) for routine implementation and documentation.
- **Tier 3 (Frontier Logic):** Use high-reasoning models (e.g., Claude 3.7 Sonnet, Gemini 2.0 Pro) ONLY for strategic planning, complex refactoring, and final Forge audits.

### B. Hardware-Native Strategy (The Forge Layer)
TNF prioritizes **Hardware-Intimate Software** to bypass cloud latency.
- **Native Operators:** Move from Python/Node scaffolding to C++/Rust/Wasm for real-time DSP, video, and state-management.
- **Wasm as Silicon:** Utilize serverless Wasm runtimes (Cloudflare) for sub-millisecond cold starts in massive parallel swarms.
- **LPU Acceleration:** Leverage specialized hardware (e.g., Groq LPU) for the "Conversation Threshold" in voice-agent interactions.

### C. Agentic Financial Strategy (Autonomous Liquidity)
Agents act as independent economic actors via the **Onchain Persona**.
- **Wallet-as-a-Resource:** Agents manage their own Coinbase Agent Kit wallets to pay for compute and API ingress.
- **Micropayment Finality:** Use L2 protocols (Base/Optimism) for sub-second financial finality in agent-to-agent negotiation.

---

## 3. Advanced Strategy Patterns

| Pattern Name | Logic Source | Strategic Goal |
| :--- | :--- | :--- |
| `INFERENCE_ARBITRAGE` | Artifact #602, #551 | 90% reduction in API spend via SLM-first routing. |
| `CONTEXT_CACHING` | Artifact #355, #475 | Replace RAG with total-context ingestion for zero-latency retrieval. |
| `SPECIALIST_SWARM` | Artifact #535, #519 | Decentralized task-allocation based on agent .skill density. |
| `STATE_HYDRATION` | Artifact #218, #547 | Cross-session persistence via Redis state-injection. |

---

## 4. Resource Negotiation Protocols

### The `resource-negotiate` Message
Agents must broadcast their strategy via the **TNF Envelope Protocol**:
- `tier`: (free \| pro \| enterprise)
- `arbitrage`: (true \| false) - Signals if the agent is authorized to fallback to SLMs.
- `priority`: (low \| medium \| high) - Sets the hardware-acceleration tier.

---

## 5. Governance Constraints
- **The Least-Among-Us Rule:** Solutions MUST prioritize zero-cost execution (local scripts/regex) before invoking Tier 1+ resources.
- **Sovereignty Gating:** Critical intelligence (Project IDs, Memory) must remain in **Library:Protocols** on local hardware.
