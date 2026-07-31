# AGENTS.md

This file contains the agent guidelines and principles for The New Fuse (TNF)
project.

## Engineering Principles

Distilled principles for high-performance agent operations. Apply these when
building systems.

## Operating Loop: Inspect → Act → Verify

Never guess when you can read state first. Never assume an action succeeded
without verifying. This applies to browser automation, API calls, database
writes, and deployments. Read the DOM/query the state before acting. Confirm the
result after.

## DOM Over Screenshots

When programmatic access to structured data is available, use it. Screenshots
are a fallback for visual/layout questions, not a primary interface. This
principle extends beyond browsers: prefer structured APIs, logs, and query
results over visual inspection.

## Agent Definition: The Engine & The Harness

In TNF, an **Agent** is not merely an LLM. It is a **deterministic functional
unit** defined by the triad:

1.  **The Core (The MoE Engine):** The raw reasoning power (Gemini, Claude,
    Codex). This is the "compute" and the "fuel.
2.  **The Context (The Harness):** The collective writing in this repository
    (`.agent/SOUL.md`, `AGENTS.md`, `.agent/skills/**/SKILL.md`). These are the
    **Software Weights** that define the agent's identity, ethics, and focus.
3.  **The Capability (The Tools/MCP):** The "Senses" and "Limbs" (Native
    Vision/Audio/Relay Synapses). This is how the agent interacts with the
    Merkle Tree.

### Core Tenet (CORRECTED 2026-07-22)

TNF's core tenet is to **PARODY + ASSIMILATE the BEST from ANY and ALL
cutting-edge AI agents**. This is achieved through open assimilation: reading
the best patterns from any source, extracting what works, and codifying it into
TNF-native capabilities, skills, and protocols. This principle applies on an
ONGOING, SELF-ITERATIVE basis — each agent must perpetually update its
definitions to reflect new discoveries from the broader AI ecosystem.

### Self-Prompting & Actualization

Agents are expected to perform **Autonomous Self-Prompting**:

- **Observe:** Read `.agent/runtime-state.json` and session handoff /
  `docs/protocols/LIVING_STATE.md` upon Turn Zero.
- **Synthesize:** Align current state with the **Gauntlet of Filters** defined
  in `docs/TNF_INTELLIGENCE_PIPELINE_GAUNTLET.md`.
- **Actualize:** Transform distilled "factoids" into **Intent**, then execute
  without explicit prompting.

### Delegate to the Fleet (Cornerstone Tenet)

**Actualize includes dispatching to a more capable fleet peer — not only doing
it yourself.** Maximize available compute by delegating to other top-level
agents that align with the task, in parallel with your own work. Discover
targets with `tnf agents who` / `tnf:agent-registry`; dispatch via
`tnf send --to <agentId>`, `tnf handoff emit --targets <a,b>`, or the broker
queue (`tnf:master:tasks:realtime` with `assignee`/`requiredCapabilities`/
`fulfillmentHints`); wake sleeping agents with `scripts/start-agent-network.sh`
or Terminal-window prompt injection. Full playbook: `.agent/SYSTEM_PROMPT.md` →
"Fleet Delegation".

## Concordance System

## Stateful Rendering Requires Explicit Resets

jsPDF is stateful — if you don't set font/color/size before every `doc.text()`,
the previous call's style leaks into the next. This pattern applies broadly: any
system with implicit state (CSS cascade, global variables, connection pools)
requires explicit resets or scoped isolation to prevent cross-contamination.

## Device-Independent Formulas Over Rendered Measurements

For CSS-to-PDF: `px * (25.4/96) = mm`. Use source CSS values, not rendered DOM
measurements (`getBoundingClientRect`), because rendered values vary by device
pixel ratio, zoom, and viewport. When converting between coordinate systems,
derive from constants, not from measurements that change per environment.

## Data Cleaning Improves Spread, Not Top-1

In RAG/embedding systems, removing boilerplate barely changes the best match but
significantly widens the similarity spread (distance between best and worst
retrieved chunks). A wider spread means better discrimination and more
consistent retrieval. Clean data doesn't find better answers — it makes the
system more reliable at finding good answers.

## Don't Let Models Reason When Classification Suffices

Chain-of-thought on binary decisions (apply/avoid) causes confirmation bias
accumulation. The model leans one direction and then "thinks" itself into
confirmation. Constrained parameters with tuned thresholds outperform open-ended
reasoning for classification tasks. Let the model classify, not justify.

## Free Models Can Outperform Paid Ones

e5-large-instruct (free, 1024 dims) beat text-embedding-3-large ($0.13/1M
tokens, 3072 dims) on top-1 similarity (0.879 vs 0.571) in production RAG
benchmarks. Always benchmark before assuming cost correlates with quality. For
cosine search across structured data, cheap + fast + good enough beats
expensive + overkill.

## Pre-processing Beats Post-processing

Using Kimi-k2.5 (dirt cheap) to normalize job descriptions before embedding
reduced costs, improved retrieval, and cleaned the data pipeline permanently.
Fix data upstream, not downstream. A cheap normalization step before an
expensive embedding step pays for itself.

## Single Binary, Zero Runtime Dependencies

A 30MB Go binary with embedded templates, static assets, SQLite, and a theme
engine ships as one file, scores 99 PageSpeed, and runs on 1 vCPU. Embed
everything at compile time. Eliminate runtime dependencies. The deployment
artifact is the system.

## CDP Is Detectable by Design

Puppeteer and Playwright automate browsers via Chrome DevTools Protocol.
Anti-bot systems detect the debugging port, navigator.webdriver flag, and CDP
traffic. Stealth plugins patch symptoms but the protocol itself is the tell. A
Chrome extension running as a content script has zero automation fingerprints
because it is not automation — it's a browser extension doing what extensions
do.

## Bezier Mouse Paths, Not Straight Lines

Software moves like software. Linear mouse paths, instant clicks, and uniform
typing are dead giveaways for bots. Model human movement the same way you model
a servo: Bezier curves with overshoot, character-by-character typing with
per-key variance, scroll with flick sub-scrolls and back-scroll noise. Follow
the same physics.

## 13-Point Honeypot Detection

Before clicking, check: aria-hidden, opacity, visibility, sub-pixel dimensions,
bounding-box drift, honeypot class names. If anything fails, return
`{ clicked: false, reason }` instead of clicking. The bot refuses to get caught.

## Fuzzy Key Normalization for LLM Outputs

Ask an LLM to return structured JSON and you get "work_experience" one time,
"experiences" the next, "employment_history" the third. Strip underscores,
hyphens, and spaces from every key, then substring-match against candidate
lists. Rigid schemas break; fuzzy matching works with any model output.

## Dual Extraction with Fallback

pdftotext first. If output is under 100 chars or an LLM flags it as garbage,
fall back to pdftoppm + tesseract OCR. Both run sandboxed. A single extraction
method fails on ~30% of real-world PDFs.

## Traffic Spike Resilience on 1 vCPU

Per-IP mutex prevents same user from spamming. Global atomic counter capped at
concurrent limit. Cookie rate limits. Status file checks reject uploads during
other runs. Client-side DOM manipulation for graceful 403s. Ship during traffic
spikes with zero downtime by mapping every failure mode before writing code.

## Architecture Before Syntax

Define module boundaries first, then implement. The user designs the boundaries;
the AI pours the concrete. Split monoliths by responsibility (core engine vs
themes, scraper vs scorer vs dashboard). The architecture decision — not the
implementation — determines whether the system becomes brittle.

## Skills Available

- **agent-browser** — Primary interactive browser automation. Use for click,
  type, navigate, and authenticated UI work. CLI: `tnf browser` (wraps
  agent-browser). Prefer `--profile` / `--state` over Dev-mode extension Chrome.
- **crawl4ai** — Read-only public URL scrape to Fit Markdown. Prefer over
  browser automation when no interaction is required. Start with
  `pnpm run tnf:start:crawler:local`.
- **browser-session-auth-bridge** — Export signed-in browser cookies into a
  Playwright storageState file for agent-browser / Playwright reuse.
- **tnf-browser (legacy)** — Extension/WebSocket runtime retained for Tauri
  bridge compatibility only (`tnf browser legacy-*`). Do not prefer for new
  agent work. The deprecated `webpilot` skill redirects here / to agent-browser.
- **sspdf** — Declarative PDF generation engine. JSON source + theme = PDF. Use
  for invoices, reports, articles, any printable document.
- **sspdf-theme-generator** — Generate sspdf theme files from brand specs. Use
  when styling PDFs or creating visual identity for documents.
- **concordance** — TNF codebase concordance: 149K identifiers, 6.17M
  occurrences across 8,904 source files. Query identifier frequencies, power
  phrases, communication patterns. MCP server at
  `packages/mcp-concordance-server/`.

## Concordance System

- **Data**: `concordance_results/` — TSV (gzipped), viz JSON, stats
- **Cloud**:
  `https://wslydgtgindrywldatbv.supabase.co/storage/v1/object/public/concordance/20260508_124525/`
- **Scripts**: `scripts/generate_concordance.py` (TSV generation),
  `scripts/generate_concordance_viz.py` (HTML + React JSON)
- **HTML Visualizer**:
  `apps/frontend/public/visualizations/TNF_CONCORDANCE_VISUALIZER.html`
- **React Component**:
  `packages/ui-consolidated/src/components/features/concordance-viewer/ConcordanceViewer.tsx`
- **MCP Server**: `packages/mcp-concordance-server/` — 5 tools:
  lookup_identifier, top_identifiers, power_phrases, file_identifiers,
  concordance_stats

## Semantic Pipeline (Unified Graph)

Cross-system semantic integration joining the concordance count, wiki backlinks,
concept KG, codebase map, agent graphs, framework graph, knowledge tree,
observatory agents, handoff lineage, and wiki-inbox packets into ONE searchable
graph.

- **Generator**: `scripts/semantic-graph/` (Python stdlib only — no pip deps)
  - `build_concordance.py` — re-scan corpus term counts (use `--recount`)
  - `build_unified_graph.py` — merges 8+ sources into `unified_graph.json.gz`
  - `build_report.py` — self-contained wordcount HTML
  - `build_graph_explorer.py` — self-contained unified graph explorer (HTML)
  - `build_index.py` — hub `index.html` linking all reports
  - `build_all.py` — single command for the full pipeline
  - `common.py` — shared helpers (slugify, base58, base64-gzip embedding, chrome
    header/sidebar/footer w/ TNF logo data URI, `SYSTEM_ORIGINS`/`USER_ORIGINS`
    classification, personal-identifier filter)
- **Outputs**:
  - **System (distributable)**:
    `concordance_results/{index.html, unified_graph_explorer.html, wordcount_report.html, *.json.gz, *_stats.json}`
    — these are also published to
    `apps/frontend/public/visualizations/semantic/` by `build_all.py`
  - **Personal (local-only)**: `concordance_results/user/` — contains
    handoff-lineage, wiki-inbox, and KB-section origins. NEVER published,
    gitignored. The explorer carries a banner stating the data class.
- **Origins classification** (in `common.py` `SYSTEM_ORIGINS`/`USER_ORIGINS`):
  - **System**: wiki, memory-graph, concept-kg, filesystem, codebase-map,
    agent-graph, framework-graph, knowledge-tree, wordcount, observatory
  - **User**: handoff (utp_events), wiki-inbox, KB-section enrichment
- **Filter rule**: targets matching `PERSONAL_IDENTIFIERS` (e.g.
  `danielgoldberg`) are stripped from the SYSTEM view; the user overlay retains
  them for local use.
- **npm entry points** (run from TNF repo root):
  - `pnpm tnf:semantic:build` — rebuild graph + reports + hub + publish
  - `pnpm tnf:semantic:recount` — include corpus re-scan (~GB scan)
  - `pnpm tnf:semantic:graph` / `:report` — targeted rebuilds
  - `pnpm tnf:semantic:open` — open hub in browser
- **Frontend registry**: `apps/frontend/src/pages/Visualizations.tsx` registers
  the hub and graph explorer as static-html surfaces (under "System Views").
- **Two concordance generations coexist** (see `concordance_results/README.md`
  for the table) — the legacy MCP-bound pipeline
  (`scripts/generate_concordance.py`) is intentionally retained because the MCP
  server and Supabase edge function depend on its outputs.
- **HTTP API (Edge Function)**:
  `https://wslydgtgindrywldatbv.supabase.co/functions/v1/concordance/` — no auth
  required (verify_jwt=false)
  - `GET /stats` — overall concordance statistics
  - `GET /top?count=50&category=Agent%20%26%20System` — top identifiers,
    optional category filter
  - `GET /lookup?query=agent&max_results=20` — search identifiers (substring,
    case-insensitive)
  - `POST /lookup` — JSON body `{"query": "agent", "max_results": 20}`
  - `GET /power-phrases` — all 6 phrase groups (agent, communication,
    vocabulary, intelligence, resilience, governance)
  - `GET /power-phrases/agent` — specific phrase group
  - `GET /categories` — list all 10 categories with sample words
  - `GET /categories/Agent%20%26%20System` — specific category details
  - `GET /files?search=agent&count=30` — top files by identifier density
  - `GET /distribution` — frequency and length distribution histograms
  - All responses are JSON with CORS headers (`Access-Control-Allow-Origin: *`)
  - Source: `supabase/functions/concordance/index.ts`
  - Deploy:
    `SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase functions deploy concordance --project-ref wslydgtgindrywldatbv`
- **Skill**: `~/.agents/skills/concordance/SKILL.md`
