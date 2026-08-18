# Vendors Ship Teammates. TNF Ships the Nervous System.

**Status:** ACTIVE positioning (2026-08-13)  
**Trigger:** SpaceXAI Grok Bot (2026-08-11) + Grok 4.6 (2026-08-12)  
**Audience:** thenewfuse.com, press, builders, enterprise evaluators  
**Owner:** TNF marketing + protocol swarm  
**One-liner:** Grok Bot is a team. TNF is how teams of teams stay coherent.

---

## Market read (logged)

On 2026-08-11 SpaceXAI launched **Grok Bot**: always-on “AI teammates” on a
shared per-user cloud computer, messageable like colleagues, able to sign into
apps and finish work end-to-end. Access sits behind SuperGrok Heavy / Cursor
Ultra / Cursor Teams Premium (~$120–$200+/mo).

On 2026-08-12 SpaceXAI released **Grok 4.6**: frontier model tuned for
long-running agents and interactive/visual work. Pricing held at **$2 / $6 per
1M input/output tokens** (fast variant 2×). Available via SpaceXAI API,
OpenRouter (`x-ai/grok-4.6`), Cursor, Grok Build, Vercel, Cloudflare. Context
window: 500K tokens.

These launches validate multi-agent “digital coworker” demand — and pull users
into a **single-vendor silo** (one VM, one memory model, one approval UX, one
model family).

TNF does **not** compete as another teammate app. TNF is the **interop /
orchestration / lineage layer** that keeps identity, handoffs, state, policy,
and multi-model swarms coherent **across** vendor runtimes.

---

## Category claim

| Layer | Who owns it | TNF stance |
| --- | --- | --- |
| Teammate UX (chat a bot, cloud desktop) | Grok Bot, Claude Cowork, Copilot Tasks, ChatGPT Work | Treat as **peer nodes**, not rivals |
| Frontier model for long agents | Grok 4.6, Claude Opus/Fable, GPT-5.6, etc. | **Fleet lanes** — bring any model |
| Nervous system (bus, handoff, Turn Zero, policy, A2A/MCP) | **The New Fuse** | Own this category language |

**Do not** clone “Chief of Staff Bot” packaging.  
**Do** productize: agent registry, swarm topology, approvals, session continuity,
handoff lineage, open runtime, marketplace.

---

## Public narrative (ship this week)

### Hero-safe framing (comparison / blog / docs — not necessarily landing hero)

> Vendors ship teammates. TNF ships the nervous system.

### Supporting sentence

> When every lab launches its own always-on agents, someone still has to keep
> identity, ownership, approvals, and memory coherent across them. That is TNF.

### Proof points (ordered)

1. **Open runtime (~90%)** — run locally; host yourself or use SaaS.
2. **MCP + A2A native** — heterogeneous agents on one synaptic bus.
3. **Turn Zero + handoff lineage** — no cold starts; inspectable ownership transfer.
4. **Multi-model fleet** — Grok 4.6 as a first-class long-running lane beside Claude, NVIDIA, local.
5. **Trust contrast** — local harness and explicit connectors vs putting inbox + bank + prod on one vendor VM.

### Competitive frame (update to marketing plan)

- vs. **Grok Bot / Claude Cowork / Copilot Tasks**: those are teammate runtimes; TNF is the control plane that can assign work *to* them and keep lineage.
- vs. **LangGraph / CrewAI**: TNF adds browser federation, MCP-native tooling, hosted relay.
- vs. **ChatGPT / Claude projects**: TNF is multi-agent, multi-surface, persistent across vendors.

---

## Immediate operating moves (this response package)

1. Publish this framing (blog entry + marketing doc + connective journal).
2. Wire **Grok 4.6** into the TNF fleet (`xai` / OpenRouter `x-ai/grok-4.6`).
3. Publish **External Teammate Runtime Interop** protocol + bridge YAML so Grok Bot-class peers are discoverable, assignable, and auditable.

---

## Non-goals

- Do not position TNF as “cheaper Grok Bot.”
- Do not require operators to abandon Cursor/SpaceXAI to use TNF.
- Do not paper over trust: shared cloud VMs with app logins are a different risk model than local harness + explicit connectors.

---

## References

- https://x.ai/news/introducing-grok-bot
- https://x.ai/news/grok-4-6
- https://openrouter.ai/x-ai/grok-4.6
- `docs/protocols/TNF_EXTERNAL_TEAMMATE_RUNTIME_INTEROP.md`
- `docs/marketing/PUBLIC_LAUNCH_MARKETING_PLAN.md`
