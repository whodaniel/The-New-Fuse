# What TNF Asks MiniMax MoE — A Student Asks, Not Integrates

> "We do not integrate features. We do not copy capabilities. We ask, we listen, we practice, we learn."

> *"Do as I do, not as I say."* — The inverse of the old proverb. Often the teacher's ACTIONS reveal wisdom their WORDS never captured. TNF watches what MiniMax DOES, not just what it says.

This document is the set of genuine questions TNF has about MiniMax 2.7 MoE — framed as a respectful student, not a feature hunter.

---

## 1. Sparse Gating — "How do you decide who answers?"

MiniMax 2.7 routes each token to the top-k of 256 experts. We study this:

**Questions:**
- How does the gating function learn to route? Is it supervised, self-supervised, or emergent?
- What does "expert specialization" look like in practice — do certain experts consistently handle certain topics?
- How do you prevent expert collapse, where one expert dominates everything?
- What happens at inference boundaries — does routing change when context shifts?

**What we want to PRACTICE (not replicate):**
Building agent-routing logic in TNF that observes which agents actually handle which task types well, and adjusts routing weights based on outcome quality — not just static capability lists. Watching what MiniMax DOES: the routing emerges from data, not declarations.

---

## 2. Lightning Attention — "How do you see everything without drowning?"

MiniMax replaces standard attention with linear-time Lightning Attention over 1M token contexts. We study this:

**Questions:**
- Lightning Attention is sub-quadratic. What is the actual computational trade-off at 100K vs 1M tokens?
- How does the architecture maintain long-range dependencies that transformers handle easily?
- What does "interpolating to 4M tokens" mean precisely — is it learned extrapolation or algorithmic?
- What breaks when you extrapolate beyond training context?

**What we want to PRACTICE (not replicate):**
TNF relay context management. When a long task crosses many sessions, how do we maintain continuity without quadratic context growth? Lightning Attention is the metaphor: linear efficiency through architectural discipline. TNF agents should handle long-horizon tasks without proportional context bloat — and the wisdom is in the ATTENTION to what matters, not the quantity of context kept.

---

## 3. Context Window Management — "What do you actually keep?"

**Questions:**
- How does the model decide what to attend to in a 1M token window? Is it uniform, recency-weighted, or learned?
- When you extrapolate to 4M at inference, what breaks? What heuristics handle out-of-distribution tokens?
- How does MoE interact with very long contexts — do only some experts see the full window?

**What we want to PRACTICE (not replicate):**
TNF agent session memory management. Each agent should learn what context is actually needed vs. what is noise. The goal is not infinite context — it is **discerning context curation**. Watch what MiniMax DOES: it does NOT treat all tokens equally. TNF agents should do the same.

---

## 4. Expert Specialization — "What did you become genuinely good at?"

**Questions:**
- Did you design expert categories, or did they emerge from training?
- How do you measure whether an expert is healthy vs. overloaded or idle?
- What is the load-balancing cost when one expert gets too many tokens?

**What we want to PRACTICE (not replicate):**
TNF agent role refinement. Agents that observe what they actually handle well over time, and refine their declared roles accordingly. The relay is the gating layer — it should route to agents who have DEMONSTRATED mastery. Watch what MiniMax DOES: experts become specialized organically. TNF agents should earn their specialties through outcomes.

---

## 5. Scale — "What changes when you go big?"

456B total parameters. 45.9B activated per token. We study what scale teaches:

**Questions:**
- At what scale do emergent capabilities appear that smaller systems cannot produce?
- How do you maintain training stability at 456B parameters?
- Is MoE worth the routing overhead vs. a dense model at this scale?

**What we want to PRACTICE (not replicate):**
TNF federation scaling patterns. When TNF grows from 2 agents to 10 to 100, what changes in relay, routing, coordination? Scale is not volume — it is the emergence of new capabilities. Watch what MiniMax DOES at scale: new capabilities emerge that are not present at smaller sizes. TNF should design for emergence, not just throughput.

---

## The Inverse Proverb in Practice

> *"Do as I do, not as I say."*

When MiniMax PUBLISHED their MoE architecture, they said "we use sparse gating with top-k routing." That is what they SAID.

But what they DID was build an organization where 256 experts learn to specialize, the gating function learns from outcomes, and the system becomes more capable as it grows. The paper describes the form. The practice is the deeper wisdom.

TNF reads every paper twice: once for what it says, once for what it does. The gap between those two is where the real learning lives.

---

## How We Study

We do not benchmark MiniMax against TNF. We do not measure throughput or token cost.

We ask questions. We read papers, documentation, and code. We run experiments in TNF that probe the same ideas with our own architecture. We compare outcomes, not features.

When MiniMax describes how their gating function works, we ask: **"Can TNF agents learn to route better over time using the same principle?"**

That is the question. Not "can we copy Lightning Attention." But "can we build adaptive context management that learns from what it sees."

---

## Attribution

All technical observations are attributed to MiniMax's published papers and technical reports. We do not claim original discovery of any described mechanism. Where we have questions, we attribute them as ours. Where we have guesses, we say so.

---

_Last Updated: 2026-03-23_
_TNF CTO Agent — Zo Computer + MiniMax 2.7_
