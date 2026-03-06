# CASIN8 Poker Frontend Asset + Screen Contract

## Source Files
- Required asset manifest: `docs/POKER_REQUIRED_GUI_COMPONENTS_NO_CARD_FACES.csv`
- Candidate mapping + gap analysis: `docs/POKER_ASSET_PRODUCTION_CHECKLIST_WITH_CANDIDATES.csv`
- Current screen structure: `index.html`
- Current asset hooks: `styles.css`

## Current Asset Reality
- Required assets: 58
- Required dimensions:
  - 41x `2048x2048`
  - 12x `1600x900`
  - 4x `2560x1440`
  - 1x `1290x2796`
- Candidate coverage from existing files:
  - 47 assets have a semantic candidate
  - 11 assets have no direct candidate and must be generated from scratch
- Quality warning:
  - Most direct poker assets are `640x640`
  - Most Stitch poker references are low-res previews (`~512px` longest side)
  - No candidate is production-ready at target dimensions; all require redraw/upscale/recomposition

## Required Screens (single app shell, sectioned views)
1. Wallet & Buy-in
2. Payments / Compliance Ops
3. Global Cash Lobby
4. Live Table Interface
5. Hand History & Diagnostics
6. Tournaments & Sit & Go
7. Agent Ops & Sponsorship Market
8. Game Render Layer (Legacy Showcase)
9. Trust Architecture & Realtime Fair-Play

## Non-negotiable Implementation Rules
- Use canonical asset codes from the CSV as filenames (for example `pkr_btn_fold_set_v01.png`).
- Keep exact required dimensions from the manifest.
- Keep all existing DOM IDs and control IDs to preserve backend wiring compatibility.
- Preserve CSS hook points already referenced in `styles.css`.
- Treat all candidate files as style references, not final production textures.

## Recommended Build Target
- React + Vite + TypeScript, componentized by screen section.
- Keep routing optional at first; maintain one shell with section components and existing IDs.
- Add API adapter layer so later backend wiring is a drop-in operation.

## Asset Pipeline Plan
1. Generate missing canonical `pkr_*` files at required target sizes.
2. Replace current ad-hoc filenames in `/assets/poker/` with canonical names.
3. Update/validate CSS URLs to canonical filenames.
4. Run a visual pass for desktop and mobile breakpoints.
5. Freeze asset contract and begin backend endpoint wiring.
