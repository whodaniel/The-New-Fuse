# 📑 Thru-Point Dossier: Gemini 3.1 Family

`[CLASS:INTEL] [STATUS:VETTED]`

**Subject:** Gemini 3.1 Pro / Flash-Preview
**Date Created:** 2026-04-29
**Project Link:** `INFRA-001`

---

## 1. 🔍 Thru-Point Identification (The Demand)
- **Origin:** Google DeepMind.
- **How it Works:** Multi-modal reasoning engine optimized for large context windows (1M+ tokens) and high-speed tool use.
- **Differentiation:** 
    - **Flash-Preview:** Extremely low latency, higher throughput, but subject to more aggressive buffer limits on JSON payload size (e.g., 20-32MB).
    - **Pro:** Deep reasoning, larger effective context handling, but slightly slower.
- **The "Better" Bar:** Superior tool-calling accuracy compared to Gemini 1.5, specifically in complex multi-step reasoning.

---

## 2. 🗺️ Strategic Positioning
- **Cutting Edge:** Support for "Thinking" budget and Native LLVM IR verification (in TNF Forge context).
- **To Avoid:** 
    - **Buffer Overflow:** Sending session histories larger than ~30MB in a single JSON request triggers the "Invalid Argument" failure.
    - **Timeout:** Long-running tool calls (like reading a 40MB file) can cause MCP timeouts.
- **Alignment:** Directly supports the **Axiom of Optimal Utility** through efficient tool orchestration.

---

## 3. 📈 Evolution Log
- **2026-04-29:** Incident 2026-04-29-INV-ARG identified a critical failure mode where 38MB of session history prevented resumption. 
- **2026-04-29:** Pattern of "Context Pruning" established as a necessary maintenance rhythm.

---

## 4. 🖇️ Connective Links
- **Source Artifacts:** [Gemini CLI v0.37.1 Release Notes]
- **Downstream Actions:** [INCIDENT_REPORT_2026-04-29_INVALID_ARGUMENT.md]
