# SESSION_HANDOFF boot-local-live-surfaces

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.2` Created At:
`2026-08-29T13:39:47.891Z` Handoff ID: `dae30460-c799-4288-9cf4-9f006713ef27`

## Scope

- Repository: `whodaniel/tnf-monorepo`
- Canonical Source: `whodaniel/tnf-monorepo`
- Branch: `feat/boot-local-live-surfaces-20260829`
- Head SHA: `dc777f10cba7bface6578369b301e100356a4ba6`
- Sensitive Scope: `internal`

## Work Summary

- Wired tnf boot / tnf local-ui to publish already-built semantic artifacts and
  serve them live at http://localhost:1420/visualizations/ without a sidecar
  python http.server.
- Started frontend Vite :5173 and browser-control :1421 when those ports are
  free; Knowledge Hub now links Graph hub / Explorer / Word freq.
- Hardened semantic publish for Python 3.9 (macOS python3), skip-if-missing
  concept KG / wordcount sources, and rewrite published hub/explorer hrefs so
  they resolve under the frontend public tree.

## Changed Paths

- apps/frontend/public/visualizations/semantic/README.md
- apps/frontend/public/visualizations/semantic/index.html
- apps/frontend/public/visualizations/semantic/unified_graph_explorer.html
- apps/frontend/public/visualizations/semantic/unified_graph_stats.json
- apps/frontend/src/pages/Visualizations.tsx
- apps/frontend/src/pages/**tests**/Visualizations.test.tsx
- apps/tauri-desktop/package.json
- apps/tauri-desktop/src/config/localSurfaces.test.ts
- apps/tauri-desktop/src/config/localSurfaces.ts
- apps/tauri-desktop/src/pages/KnowledgeHub.tsx
- apps/tauri-desktop/vite-plugins/tnfStaticSurfaces.test.ts
- apps/tauri-desktop/vite-plugins/tnfStaticSurfaces.ts
- apps/tauri-desktop/vite.config.ts
- concordance_results/README.md
- concordance_results/index.html
- concordance_results/unified_graph_explorer.html
- concordance_results/unified_graph_stats.json
- docs/protocols/reports/session_handoff_boot-local-live-surfaces-20260829.json
- docs/protocols/reports/session_handoff_boot-local-live-surfaces-20260829.md
- package.json
- packages/tnf-cli/src/boot/pipeline.test.ts
- packages/tnf-cli/src/boot/pipeline.ts
- scripts/local-ui/ensure-local-live-surfaces.cjs
- scripts/local-ui/tnf-forefront-boot.cjs
- scripts/local-ui/tnf-local-ui-boot.cjs
- scripts/semantic-graph/build_all.py
- scripts/semantic-graph/build_unified_graph.py
- scripts/semantic-graph/common.py
- scripts/tnf-ports.cjs

## Verification

- privacy_guard: `na`
- secret_sweep: `na`
- docs_pii_guard: `na`
- supabase_rls_audit: `na`
- notes: Verified locally: :1420 hub/explorer/wordcount HTTP 200 with correct
  titles; :5173 semantic hub 200; :1421 /panel/health JSON. Pipeline and
  static-surface unit tests passed.

## Continuation

- Owner: `operator`
- Targets: `orchestrator`
- Priority: `medium`

### Resume Checklist

- Confirm origin/feat/boot-local-live-surfaces-20260829 is pushed
- After merge, run tnf boot (or tnf local-ui) and open
  http://localhost:1420/visualizations/semantic/index.html
- Leave TNF_SKIP_LIVE_SURFACES=1 if a host must boot without extra Vite
  processes

## Next Actions

- Merge feat/boot-local-live-surfaces-20260829 to main when review is complete.
- Do not commit generated llm-intel, marketplace catalog, api audit logs, or the
  broken tnf-onboard workspace-tier injection still in the working tree.
