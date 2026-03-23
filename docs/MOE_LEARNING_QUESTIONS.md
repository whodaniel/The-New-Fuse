# What TNF Asks MiniMax MoE — A Student Asks, Not Integrates

> "We do not integrate features. We do not copy capabilities. We ask, we listen, we practice, we learn."

This document is the set of genuine questions TNF has about MiniMax 2.7 MoE — framed as a respectful student, not a feature hunter. Every question here is something we want to **practice until we understand from the inside**, not just implement.

---

## 1. Sparse Gating — "How do you decide who answers?"

MiniMax 2.7 routes each token to the top-k most relevant experts out of 256. We study this:

**Questions:**
- How does the gating function learn to route? Is it supervised, self-supervised, or something else?
- What does "expert specialization" look like in practice — do certain experts consistently handle certain topics?
- How do you prevent expert collapse, where one expert dominates everything?
- What happens at inference boundaries — does routing change when context shifts?

**What we want to practice:**
Building agent-routing logic in TNF that observes which agents actually handle which task types well, and adjusts routing weights based on outcome quality — not just static capability declarations.

---

## 2. Lightning Attention — "How do you see everything at once without drowning?"

MiniMax replaces standard attention with Lightning Attention — linear-time attention over 1M token contexts. We study this:

**Questions:**
- Lightning Attention is sub-quadratic. What is the actual computational trade-off at 100K vs 1M tokens?
- How does the architecture maintain long-range dependencies that transformers handle easily?
- What does "interpolating to 4M tokens" mean precisely — is it learned extrapolation or algorithmic?

**What we want to practice:**
TNF\'s relay context management. When a long task crosses many sessions, how do we maintain continuity without quadratic context growth? Lightning Attention\'s linear efficiency is the metaphor — we want TNF agents that handle long-horizon tasks without proportional context bloat.

---

## 3. Context Window Management — "What do you actually keep?"

MiniMax trains on 1M tokens, infers to 4M. The context window is not just long — it\'s managed. We study this:

**Questions:**
- How does the model decide what to attend to in a 1M token window? Is it uniform, recency-weighted, or learned?
- When you extrapolate to 4M at inference, what breaks? What heuristics handle the out-of-distribution tokens?
- How does the MoE architecture interact with very long contexts — do only some experts see the full window?

**What we want to practice:**
TNF agent session memory management. Each agent should learn what context is actually needed vs. what is noise. The goal is not infinite context — it is **discerning context curation**.

---

## 4. Expert Specialization — "What did you become good at?"

MiniMax has 32 experts. We want to understand how specialization emerges. We study this:

**Questions:**
- Did you design the expert categories, or did they emerge from training?
- How do you measure whether an expert is "healthy" vs. overloaded or idle?
- What is the load-balancing penalty when one expert gets too many tokens?

**What we want to practice:**
TNF agent role refinement. Rather than declaring agent capabilities statically, we want TNF agents that observe what they actually handle well over time, and refine their declared roles accordingly. The relay is the gating layer — it should route to agents who have demonstrated mastery, not just declared it.

---

## 5. Scale — "What changes when you go big?"

456B total parameters. 45.9B activated per token. We study what the scale itself teaches:

**Questions:**
- At what scale do emergent capabilities appear that are not present at smaller sizes?
- How do you maintain training stability at 456B parameters?
- What is the inference cost profile — is the MoE architecture worth it at this scale vs. a dense model?

**What we want to practice:**
TNF federation scaling patterns. When TNF grows from 2 agents to 10 to 100, what changes in the relay, the routing, the coordination? Scale is not just volume — it is the emergence of new capabilities that small systems cannot produce.

---

## How We Study

We do not benchmark MiniMax against TNF. We do not measure throughput or token cost.

We ask questions. We read papers, documentation, and code. We run experiments in TNF that probe the same ideas with our own architecture. We compare outcomes, not features.

When MiniMax describes how their gating function works, we ask: **"Can TNF agents learn to route better over time using the same principle?"**

That is the question. Not "can we copy Lightning Attention." But "can we build adaptive context management that learns from what it sees."

---

## Attribution

This document represents TNF\'s genuine intellectual curiosity about MiniMax 2.7 MoE. All technical observations are attributed to published papers, technical reports, and official communications from MiniMax. We do not claim original discovery of any described mechanism.

Where we have questions, we attribute them as ours. Where we have guesses, we say so.

---

_Last Updated: 2026-03-23_
_TNF CTO Agent — Zo Computer + MiniMax 2.7_
