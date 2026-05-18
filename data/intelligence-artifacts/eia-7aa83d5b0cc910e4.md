# Executable Intelligence Artifact

**Artifact ID:** eia-7aa83d5b0cc910e4 **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-05-17T14:17:13+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6223
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6223
- Title: Now let me update AGENTS.md to document the concordance system:
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-05-17T14:17:13+00:00

## Taxonomy of Actionability

### Procedural

- Run generate_concordance_viz.py to produce HTML + JSON
- Upload HTML + JSON to Supabase Storage
- JSON source + theme = PDF.
- TSV (gzipped), viz JSON, stats
- - **Scripts**: `scripts/generate_concordance.py` (TSV generation),
    `scripts/generate_concordance_viz.py` (HTML + React JSON)
- - **React Component**:
    `packages/ui-consolidated/src/components/features/concordance-viewer/ConcordanceViewer.tsx`
- Generated HTML visualizer (0.2 MB) + React JSON (0.2 MB)
- TNF_CONCORDANCE_VISUALIZER.html and concordance_viz_data.json
- - https://wslydgtgindrywldatbv.supabase.co/storage/v1/object/public/concordance/20260508_124525/concordance_viz_data.json
- Created React ConcordanceViewer component at
  packages/ui-consolidated/src/components/features/concordance-viewer/ConcordanceViewer.tsx
  (464 lines)

### Strategic

- Read Desktop/A1-Inter-LLM-Com/The-New-Fuse/AGENTS.md [limit=20, offset=1]
- Read Desktop/A1-Inter-LLM-Com/The-New-Fuse/AGENTS.md [limit=20, offset=70]
- Edit Desktop/A1-Inter-LLM-Com/The-New-Fuse/AGENTS.md

### Governance

- (none)

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.147
- Verification Difficulty: Hard

## Synthesis

Artifact captures 10 procedural, 3 strategic, and 0 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.
