# Engineering Principles (from Hugo Palma - hugopalma.work)

Distilled principles from Hugo Palma's work and writing. Apply these when
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

## Zero Trust Between Agents

No output propagates without confirmation. Every stage validates its input
before processing. The scraper validates its state and upstream state. The
orchestrator watches all agents as a safety guard. Assume the previous step
failed and verify before proceeding.

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
