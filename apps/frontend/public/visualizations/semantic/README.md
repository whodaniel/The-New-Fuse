# concordance_results/

Output artifacts only — the generators live in `scripts/semantic-graph/`.
Rebuild everything: `python3 scripts/semantic-graph/build_all.py` (add
`--recount` to re-scan word counts). Start browsing at **`index.html`**.

## Two concordance generations coexist here (both live)

| Pipeline                    | Generator                                                                 | Outputs                                                                                                                                                                                             | Consumers                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Legacy concordance          | `scripts/generate_concordance.py` + `scripts/generate_concordance_viz.py` | `concordance.tsv.gz`, `concordance.json.gz`, `per_file_index.tsv.gz`, `concordance_viz_data.json`, `concordance_summary.txt`, `stats.json`                                                          | `packages/mcp-concordance-server`, `supabase/functions/concordance`, `apps/frontend/public/visualizations/TNF_CONCORDANCE_VISUALIZER.html` |
| Semantic pipeline (2026-07) | `scripts/semantic-graph/build_*.py`                                       | `wordcount_full.tsv.gz`, `wordcount_stats.json`, `wordcount_summary.txt`, `wordcount_report.html`, `unified_graph.json.gz`, `unified_graph_stats.json`, `unified_graph_explorer.html`, `index.html` | browsers (self-contained HTML), agents (`unified_graph_stats.json`, `.json.gz` dataset)                                                    |

Do not delete the legacy files: the MCP server and the Supabase edge function
read them, and `build_unified_graph.py` reads `per_file_index.tsv.gz` for
term→file `occurs_in` edges.

## For AI agents

- Graph dataset: `unified_graph.json.gz` —
  `{meta, nodes:[{id,label,type,origin,weight,meta}], edges:[{s,t,type,w}]}`
- Quick stats: `unified_graph_stats.json` (nodes_by_origin, edges_by_type,
  cross_links)
- See the `tnf-semantic-graph` skill for node namespaces, invariants, and
  rebuild rules.

## Local live surfaces (`tnf boot`)

`tnf boot` / `tnf local-ui` publish SYSTEM artifacts into
`apps/frontend/public/visualizations/semantic/` (never `--recount`) and serve
them from the desktop UI:

- Hub: http://localhost:1420/visualizations/semantic/index.html
- Explorer:
  http://localhost:1420/visualizations/semantic/unified_graph_explorer.html
- Word frequency:
  http://localhost:1420/visualizations/semantic/wordcount_report.html

Frontend Vite `:5173` and browser-control `:1421` start when those ports are
free. Skip with `TNF_SKIP_LIVE_SURFACES=1`. Manual publish:
`pnpm tnf:semantic:publish`.
