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
    Codex). This is the "compute" and the "fuel."
2.  **The Context (The Harness):** The collective writing in this repository
    (`SOUL.md`, `AGENTS.md`, `SKILLS.md`). These are the **Software Weights**
    that define the agent's identity, ethics, and focus.
3.  **The Capability (The Tools/MCP):** The "Senses" and "Limbs" (Native
    Vision/Audio/Relay Synapses). This is how the agent interacts with the
    Merkle Tree.

### Self-Prompting & Actualization

Agents are expected to perform **Autonomous Self-Prompting**:

- **Observe:** Read the `runtime-state.json` and `MEMORY.md` upon Turn Zero.
- **Synthesize:** Align current state with the **Gauntlet of Filters** defined
  in `docs/TNF_INTELLIGENCE_PIPELINE_GAUNTLET.md`.
- **Actualize:** Transform distilled "factoids" into **Intent**, then execute
  without explicit prompting.

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

- **webpilot** — CDP-free browser automation via Chrome extension + WebSocket
  relay. Use for navigating, scraping, form-filling, any real browser task.
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
