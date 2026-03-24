---
name: production-pipeline-segment
description: "Build and operationalize a reusable game-frontend production pipeline segment from asset requirements to AI build prompts. Use when Codex needs to convert an asset manifest into a per-asset production checklist, map best local candidate images, generate a browser report with copy-ready per-asset prompt containers, and prepare implementation prompts for Gemini/AI Studio to generate a React frontend wired for backend integration."
---

# Production Pipeline Segment

## Overview
Create a repeatable pipeline for game UI production: requirements -> candidate mapping -> browser deliverable -> AI codegen prompt pack. Keep outputs artifact-driven so teams can reuse without re-explaining context every session.

## Workflow
1. Identify the app root and locate required inputs.
2. Build a normalized production checklist from asset requirements.
3. Map best local candidate image for each required asset.
4. Generate browser report with per-asset copy containers.
5. Produce implementation prompts for AI frontend generation.
6. Validate outputs and summarize gaps.

## Step 1: Locate Inputs
Require these files (or equivalents):
- Asset requirement manifest CSV with `assetCode`, variant fields, and target dimensions.
- Current game screen structure (`index.html` or route map).
- Styling hooks (`styles.css` or design token map).
- Local image pools (`assets/`, `design/`, or export directories).

Prefer this search pattern:
```bash
rg --files | rg -i 'poker|required|components|asset|index\.html|styles\.css'
```

## Step 2: Build Checklist
Create a normalized checklist CSV with columns:
- `id`
- `groupName`
- `assetCode`
- `requiredVariants`
- `targetSize`
- `uiSurface`
- `cssOrDomHook`
- `bestCandidatePath`
- `bestCandidateSize`
- `candidateFit`
- `needsEditOrRegeneration`
- `notes`

Rules:
- Keep exact target dimensions from manifest.
- Keep canonical filename contract (`assetCode + .png`).
- Mark missing candidates as `needsEditOrRegeneration=yes`.

## Step 3: Candidate Mapping
Rank candidates with this order:
1. Exact semantic match in filename.
2. Same UI role (button/panel/felt/state/mobile shell).
3. Same composition even if low resolution.

Fit labels:
- `high-exact`: dimensions match target.
- `high-near`: minor upscale only.
- `medium-upscale`: moderate upscale/redraw.
- `low-heavy-regenerate`: low-res or weak composition seed.
- `none`: no candidate.

## Step 4: Browser Report Output
Generate an HTML report with:
- Summary counts (total, with candidate, net-new).
- Per-asset cards.
- One-shot copy container per card containing:
  - purpose
  - screen-relative location
  - target size
  - variants
  - best candidate local path
  - image generation prompt
- Candidate thumbnail and quick-open link.
- Copy-to-clipboard button per asset container.

If needed, use `scripts/generate_asset_browser_report.py`.

## Step 5: AI Prompt Pack
Create two prompt blocks:
1. Asset generation prompt (strict filename + dimension contract).
2. Frontend implementation prompt (React + Vite + TypeScript, preserves IDs/hooks for backend wiring).

Include hard constraints:
- Server-authoritative state.
- Stable control IDs.
- Mobile + desktop parity.
- Explicit reconnect/error/resilience states.

## Step 6: Framework Decision Rule
Default to React + Vite when:
- Existing repo already uses React/Vite.
- Goal is fastest integration and handoff to backend.

Choose Next.js only when SSR/SEO/public content requirements are explicit.
Choose Angular only when organization constraints already require Angular.

## Outputs
Produce these artifacts in app `docs/`:
- `*_ASSET_PRODUCTION_CHECKLIST_WITH_CANDIDATES.csv`
- `*_ASSET_BROWSER_REPORT.html`
- `*_ASSET_GEMINI_INPUT.md`

## References
- Process checklist: `references/pipeline-checklist.md`
- Prompt templates: `references/prompt-templates.md`

## Script
- Report generator: `scripts/generate_asset_browser_report.py`
