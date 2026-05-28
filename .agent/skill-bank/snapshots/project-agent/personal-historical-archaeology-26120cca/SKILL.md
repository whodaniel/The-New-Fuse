---
name: personal-historical-archaeology
description:
  Reconstruct personal and project timelines from repos, documents, exported
  notes, screenshots, videos, and other local artifacts while preserving
  privacy. Use when rebuilding the history of TNF, predecessor projects,
  life/work eras, or long-running technical journeys from evidence.
---

# Personal Historical Archaeology

## Purpose

Use this skill to reconstruct a durable timeline from scattered evidence without
leaking secrets, credentials, or sensitive personal details.

Conceptual type: `bridge` with integrated `validator`.

This skill bridges:

- current repo history
- predecessor repos and project roots
- local notes and TextEdit-style exports
- screenshots and videos of experiments
- Apple Notes MCP data when that server is available

## When To Use It

Use this skill when the goal is to:

- rebuild the origin story of TNF or predecessor projects
- map restarts, pivots, tech-stack changes, and naming changes
- recover timeline evidence from local folders, repos, or exported notes
- separate hard evidence from narrative inference
- prepare TNF `historical_event` batches for later timeline ingestion

## Non-Negotiable Privacy Rules

Before surfacing anything:

1. Skip obvious secret-bearing paths like `.env`, private keys, wallets,
   keystores, and credential dumps.
2. Suppress files whose sampled content looks like live secrets or sensitive
   identifiers.
3. Prefer metadata over raw content for screenshots, videos, and code.
4. Never present sensitive content excerpts in summaries or final answers.
5. Label inference as inference. Do not upgrade narrative certainty beyond the
   evidence tier.

Read
[references/privacy-and-evidence-model.md](references/privacy-and-evidence-model.md)
before broad local scans.

## Workflow

1. Inventory sources.
   - Current repo
   - Predecessor repos and project roots
   - Exported notes, markdown, txt, rtf
   - Media evidence like screenshots and videos
   - Apple Notes MCP server if configured in the current session

2. Select the lowest-risk extraction mode first.
   - Repo only: `pnpm tnf:journey:extract`
   - Local docs plus project roots: `pnpm tnf:journey:extract:local`
   - Broad local archaeology: `pnpm tnf:journey:extract:all`

3. If Apple Notes MCP is available, query it before falling back to filesystem
   exports.
   - Prefer note titles, created/updated timestamps, and short redacted
     summaries.
   - Do not dump raw note bodies into reports unless they are explicitly
     sanitized.

4. Review the generated outputs.
   - `reports/development-journey*/tnf-development-journey-evidence.json`
   - `reports/development-journey*/tnf-development-journey-timeline-events.json`
   - `reports/development-journey*/tnf-development-journey-summary.md`

5. Cluster the evidence into eras.
   - origin concepts
   - early experiments
   - restarts/retools
   - naming transitions
   - major proofs of concept
   - convergence into TNF

6. Emit two layers explicitly.
   - Evidence-backed events
   - Narrative synthesis with labeled confidence

## Current Tooling

Primary extractor:

- `scripts/timeline/extract-development-journey-evidence.mjs`

Validation:

- `node --test scripts/timeline/extract-development-journey-evidence.test.mjs`

Protocol/report anchors:

- `docs/protocols/bridges/tnf-development-journey-timeline-reconstruction.yml`
- `docs/protocols/reports/tnf-development-journey-reconstruction-2026-03-19.md`

## Apple Notes Guidance

If an Apple Notes MCP server is configured:

- treat it as a higher-priority source than loose exports
- retrieve note metadata and targeted snippets only
- record note identifiers and timestamps as evidence refs
- keep note content redacted or summarized unless the user explicitly wants
  private notes processed in full

If no Notes MCP server is configured, fall back to exported `.md`, `.txt`, and
`.rtf` materials.

## Verification

Run:

- `node --test scripts/timeline/extract-development-journey-evidence.test.mjs`
- `pnpm tnf:journey:extract`
- `pnpm tnf:journey:extract:local`

For broader forensics:

- `pnpm tnf:journey:extract:all`

Check that:

- privacy skip counts are present in stdout and summary
- code/media/project-root events appear when enabled
- summaries do not expose sensitive excerpts
- warnings distinguish "no matches" from "skipped for privacy"
