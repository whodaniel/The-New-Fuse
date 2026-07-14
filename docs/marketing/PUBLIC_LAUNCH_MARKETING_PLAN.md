# The New Fuse — Public Launch Marketing Plan

**Status:** Draft v1 (refined 2026-06-21)  
**Owner:** @danielgoldberg  
**Launch target:** Release-Candidate → Public Release (gates in
`docs/release-readiness/CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md`)

---

## Executive Summary

The New Fuse is positioned as the **open-source control plane for multi-agent AI
orchestration** — bridging MCP, A2A federation, browser/desktop automation, and
persistent agent memory. The site (`thenewfuse.com`) is live and polished; the
hosted app (`app.thenewfuse.com`) is reachable. **Public launch is blocked on
distribution and trust signals**, not on landing-page copy.

**Launch thesis:** _Stop duct-taping APIs. Start orchestrating intelligence._

**Primary conversion path:**

1. Land on `thenewfuse.com` → understand value in <10 seconds
2. `Start Building Free` → `app.thenewfuse.com/signup`
3. Install CLI → `curl … | bash` → `tnf onboard` → first agent workflow in <15
   minutes
4. Upgrade → Professional ($30/mo) when hitting agent/message limits

---

## Positioning & Messaging

### Category

AI Agent Orchestration Platform (not a chat wrapper, not a single-model API
proxy).

### Unique Value Props (ordered by proof strength)

| Pillar                  | Message                                                  | Proof artifact                           |
| ----------------------- | -------------------------------------------------------- | ---------------------------------------- |
| **MCP + A2A Native**    | Connect Claude, GPT, Gemini, GLM as a federated swarm    | Chrome extension + relay demo video      |
| **Lux Bridge**          | DOM-exact + visual-first automation in one stack         | Side-by-side browser automation clip     |
| **Turn Zero / Harness** | Agents boot with living state, handoff, and verification | `tnf onboard` terminal recording         |
| **Open Runtime**        | 90% open source; host yourself or use SaaS               | Public `fuse-open-runtime` repo + Docker |
| **PKG Memory**          | Cross-session knowledge graph compounds over time        | Dashboard screenshot + docs              |

### Audience Segments

| Segment                     | Pain                                    | Hook                               | CTA                     |
| --------------------------- | --------------------------------------- | ---------------------------------- | ----------------------- |
| **Indie dev / builder**     | Juggling multiple AI tabs and scripts   | "Federate your agents in one bus"  | Free tier + CLI install |
| **Startup eng team**        | No shared agent memory or audit trail   | "Orchestrate with handoff lineage" | Pro trial               |
| **Platform / DevOps**       | Need self-hosted, MCP-compliant runtime | "Open runtime, your infra"         | GitHub + Docker         |
| **AI agency / consultants** | Client workflows need repeatability     | "Ship agent systems, not demos"    | Case study + Pro        |

### Competitive Frame (do not name-drop in hero; use in comparison content)

- vs. **LangGraph / CrewAI**: TNF adds browser federation, MCP-native tooling,
  and hosted relay
- vs. **OpenClaw / raw MCP**: TNF is the control plane that routes _through_
  interoperability layers
- vs. **ChatGPT / Claude projects**: TNF is multi-agent, multi-surface,
  persistent

### Taglines (test rotation)

1. **Primary:** Build Intelligent AI Workflows
2. **Dev:** Stop duct-taping APIs. Start orchestrating intelligence.
3. **OSS:** The open control plane for agent swarms.
4. **Urgency:** The New Fuse 2.0 — federate now.

---

## Pre-Launch Blockers (Marketing Cannot Outrun These)

These must be green before paid acquisition or press:

| #   | Blocker                                                          | Marketing impact                          | Fix                                                |
| --- | ---------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------- |
| B1  | `github.com/whodaniel/fuse` is **private**                       | "Open Source" + "Star on GitHub" CTAs 404 | Publish `fuse-open-runtime`; point all links there |
| B2  | CLI install script 404 on raw.githubusercontent                  | Broken first-run funnel                   | Public repo + verify `install-tnf-cli.sh`          |
| B3  | `/about`, `/blog`, `/legal/*` serve landing SPA (semantic dupes) | SEO + trust failure                       | SSR routes or static pages per path                |
| B4  | `/api/v1/health` 404; `/health` lacks `timestamp`                | Dev trust / status page                   | API patch per release checklist M02/M03            |
| B5  | `pnpm run release:gate` fails (personal paths in CLI)            | Cannot ship installable artifact          | Env-based paths in `TelegramService.ts`            |
| B6  | HSTS header missing on `thenewfuse.com`                          | Security reviewer flag                    | Cloudflare Transform Rule                          |
| B7  | `sync:repos:dry-run` checkout failures                           | Open-runtime drift from monorepo          | Fix sync script / exclude node_modules from copy   |

---

## Launch Sequence (14-Day Sprint)

### Phase 0 — Gate Green (Days 1–3)

**Goal:** Release-Candidate status on checklist.

- [ ] Fix B1–B7 above
- [ ] Run `pnpm run release:gate:strict`
- [ ] Run `pnpm run sync:repos` → tag `v2.0.0-rc.1` on open-runtime
- [ ] Publish `RELEASE_NOTES_PUBLIC.md`
- [ ] Enable HSTS + security headers audit
- [ ] Stand up `status.thenewfuse.com` (health + timestamp)

### Phase 1 — Soft Launch (Days 4–7)

**Goal:** 50–100 qualified signups, 20 CLI installs, zero P0 support tickets.

| Day | Action                                          | Channel          | Owner     |
| --- | ----------------------------------------------- | ---------------- | --------- |
| D4  | Ship `/docs` quickstart (install → first agent) | Site             | Docs      |
| D4  | Record 90s demo: CLI + extension + relay        | YouTube unlisted | Content   |
| D5  | Post "Show HN" draft + launch thread            | Hacker News      | Founder   |
| D5  | Invite 25 beta users from network               | Email            | Founder   |
| D6  | Discord/community server live                   | Discord          | Community |
| D7  | Collect 5 testimonials / quotes                 | DM               | Founder   |

**Soft launch copy (HN title options):**

- "Show HN: The New Fuse – open-source MCP/A2A agent orchestration with browser
  federation"
- "Show HN: Turn Zero harness for AI agents – inspect, act, verify with living
  state"

### Phase 2 — Public Launch (Days 8–10)

**Goal:** Spike traffic; establish category presence.

| Asset                | Details                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| **Product Hunt**     | Schedule Tuesday 12:01 AM PT; hunter + 5 supporters pre-briefed            |
| **Launch blog post** | "Introducing The New Fuse 2.0" — problem, architecture diagram, quickstart |
| **GitHub README**    | Badges: build, license, Discord, docs link                                 |
| **Press kit**        | Logo SVG, 3 screenshots, founder bio, one-pager PDF                        |
| **Email blast**      | Waitlist + personal network                                                |

### Phase 3 — Sustain (Days 11–14)

**Goal:** Convert spike to retained users.

- Publish 2 technical posts (MCP federation, Turn Zero harness)
- Reddit: r/LocalLLaMA, r/MachineLearning, r/selfhosted (value-first, not spam)
- X/Twitter thread: architecture + demo GIF
- Partner outreach: MCP server maintainers, AI newsletter authors

---

## Channel Strategy

### Owned

| Channel                    | Role                | KPI (30d)                   |
| -------------------------- | ------------------- | --------------------------- |
| `thenewfuse.com`           | Convert + educate   | 3% signup rate from landing |
| `app.thenewfuse.com`       | Activation          | 40% complete onboarding     |
| Docs / changelog           | SEO + retention     | 500 organic doc sessions    |
| GitHub `fuse-open-runtime` | OSS credibility     | 500 stars                   |
| Discord                    | Support + community | 200 members                 |

### Earned

| Channel           | Tactic                                  | KPI                       |
| ----------------- | --------------------------------------- | ------------------------- |
| Hacker News       | Show HN + founder comments              | Front page or 100+ points |
| Product Hunt      | Coordinated launch day                  | Top 5 Product of the Day  |
| Dev newsletters   | Briefing for Ben's Bites, TLDR AI, etc. | 2 pickups                 |
| Podcast / YouTube | Guest spots on agent tooling shows      | 1 appearance              |

### Paid (post gate-green only)

| Channel                | Budget (mo 1) | Targeting                                    |
| ---------------------- | ------------- | -------------------------------------------- |
| Google Ads             | $500          | "MCP orchestration", "multi agent framework" |
| X Ads                  | $300          | Dev followers of LangChain, Anthropic        |
| Newsletter sponsorship | $1,000        | One AI dev newsletter                        |

**Rule:** No paid spend until B1–B4 resolved and signup funnel tracked in
analytics.

---

## Content Calendar (First 30 Days)

| Week | Blog                                    | Social                         | Video                         |
| ---- | --------------------------------------- | ------------------------------ | ----------------------------- |
| 1    | Quickstart: Install TNF in 5 minutes    | Launch announcement thread     | 90s product demo              |
| 2    | MCP + A2A: How federation works         | Architecture diagram carousel  | Extension walkthrough         |
| 3    | Turn Zero: Why agents need living state | Customer quote / use case      | CLI harness deep dive         |
| 4    | Self-host vs SaaS comparison            | OSS milestone (stars/download) | Browser agent federation live |

### SEO Target Keywords

**Primary:** ai agent orchestration, mcp agent framework, multi agent ai
platform  
**Secondary:** agent federation, open source ai agents, browser ai automation  
**Long-tail:** how to orchestrate claude and gpt agents, redis synaptic bus
agents

---

## Pricing & Packaging (align site ↔ billing)

Current site pricing (verified live):

| Tier         | Price  | Limits                   | Launch offer                 |
| ------------ | ------ | ------------------------ | ---------------------------- |
| Starter      | Free   | 5 agents, 1K msgs/mo     | Default CTA                  |
| Professional | $30/mo | 25 agents, 10K msgs, API | **Launch: 30-day Pro trial** |
| Enterprise   | Custom | Unlimited                | "Book a call" Calendly       |

**Launch promotion:** First 500 signups get 30-day Pro free (coupon
`LAUNCH500`).

---

## Funnel Metrics & Targets

| Stage      | Metric                  | Launch target (30d) | Tool                   |
| ---------- | ----------------------- | ------------------- | ---------------------- |
| Awareness  | Unique visitors         | 25,000              | Cloudflare Analytics   |
| Interest   | Docs / pricing views    | 5,000               | GA4                    |
| Signup     | Accounts created        | 1,000               | Supabase / app DB      |
| Activation | Completed `tnf onboard` | 300                 | CLI telemetry (opt-in) |
| Revenue    | Pro conversions         | 50 ($1,500 MRR)     | Stripe                 |
| Advocacy   | GitHub stars            | 500                 | GitHub API             |

**North-star metric:** Weekly Active Orchestrations (WAO) — users who run ≥1
multi-agent workflow per week.

---

## Launch Day Runbook

### T-24h

- [ ] All checklist M-rows green
- [ ] Status page green
- [ ] Support inbox `hello@thenewfuse.com` monitored
- [ ] Rollback tested (R02)

### T-0h (Launch hour)

1. Flip `fuse-open-runtime` public
2. Publish GitHub release `v2.0.0`
3. Post Show HN + PH + X thread (stagger 15 min)
4. Update site banner: "Now Open Source"
5. Monitor `api.thenewfuse.com/health` + error budget

### T+4h

- Respond to every HN/PH comment
- Fix any broken link within 1 hour
- Screenshot social proof for site

### T+24h

- Publish launch retrospective metrics (internal)
- Ship hotfix branch if needed

---

## Risk Register

| Risk                                      | Likelihood   | Impact             | Mitigation                              |
| ----------------------------------------- | ------------ | ------------------ | --------------------------------------- |
| Private repo discovered after "OSS" claim | High (today) | Brand damage       | Fix B1 before any announcement          |
| Install script fails on clean machine     | High         | Churn at step 1    | CI clean-room install test              |
| API outage during launch spike            | Medium       | Lost signups       | Cloud Run autoscale + status page       |
| Competitor launch same week               | Medium       | Noise              | Differentiate on federation + Turn Zero |
| Legal pages are SPA dupes                 | High (today) | Trust / compliance | Static privacy/terms before ads         |

---

## Approval Checklist

- [ ] Engineering: release gate strict pass
- [ ] Legal: privacy + terms are distinct, accurate pages
- [ ] Marketing: press kit + PH assets ready
- [ ] Founder: launch day calendar blocked
- [ ] Sign-off on `CHECKLIST_V1_PUBLIC_RELEASE_READINESS.md` → Public Release

---

## Appendix: Verification Snapshot (2026-06-21)

| Surface                            | Result                                          |
| ---------------------------------- | ----------------------------------------------- |
| `thenewfuse.com`                   | ✅ 200, ~150ms, Cloudflare                      |
| `app.thenewfuse.com`               | ✅ 200, SPA routing                             |
| `api.thenewfuse.com/health`        | ✅ 200 JSON (no timestamp)                      |
| `api.thenewfuse.com/api/v1/health` | ❌ 404                                          |
| GitHub `whodaniel/fuse`            | ❌ Private (404 public)                         |
| CLI install script (raw GitHub)    | ❌ 404                                          |
| Auth paths audit                   | ✅ 4/4 pass                                     |
| `release:gate`                     | ❌ Personal path in TelegramService             |
| Live link crawl                    | ⚠ 6 broken / 4 semantic dupes on thenewfuse.com |

_Re-run probes before launch day; attach evidence to release checklist rows._
