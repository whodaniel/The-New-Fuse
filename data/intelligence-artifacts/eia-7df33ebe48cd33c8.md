# Executable Intelligence Artifact

**Artifact ID:** eia-7df33ebe48cd33c8 **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-05-17T14:17:12+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6228
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6228
- Title: All endpoints working correctly. Let me now update the AGENTS.md with…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-05-17T14:17:12+00:00

## Taxonomy of Actionability

### Procedural

- Let me now update the AGENTS.md with the Edge Function docs and update the MCP
  server to also support the HTTP API:
- Build Supabase Edge Function for queryable concordance API
- Update MCP server to document HTTP API availability
- - **Scripts**: `scripts/generate_concordance.py` (TSV generation),
    `scripts/generate_concordance_viz.py` (HTML + React JSON)
- - **React Component**:
    `packages/ui-consolidated/src/components/features/concordance-viewer/ConcordanceViewer.tsx`
- - **HTTP API (Edge Function)**:
    `https://wslydgtgindrywldatbv.supabase.co/functions/v1/concordance/`
- JSON body `{"query": "agent", "max_results": 20}`
- - All responses are JSON with CORS headers (`Access-Control-Allow-Origin: *`)
- - Deploy:
    `SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase functions deploy concordance --project-ref wslydgtgindrywldatbv`
- Now update the concordance skill to mention the HTTP API:
- ### HTTP API (Edge Function)
- Query the concordance via a structured REST API.
- | Endpoint | Method | Description |
- | `/lookup` | POST | JSON body: `{"query": "agent", "max_results": 20}` |
- All responses are JSON with CORS headers.
- curl -s
  "https://wslydgtgindrywldatbv.supabase.co/functions/v1/concordance/lookup?query=agent&max_results=3"
- Fetch the viz JSON.
- Update MCP server/skill to document HTTP API availability
- Endpoint Example
- /lookup .../lookup?query=agent&max_results=3 or POST JSON

### Strategic

- Read Desktop/A1-Inter-LLM-Com/The-New-Fuse/AGENTS.md [offset=1, limit=20]
- Grep "Concordance System" in Desktop/A1-Inter-LLM-Com/The-New-Fuse/AGENTS.md
  (1 match)
- Read Desktop/A1-Inter-LLM-Com/The-New-Fuse/AGENTS.md [offset=84]
- Edit Desktop/A1-Inter-LLM-Com/The-New-Fuse/AGENTS.md
- - `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/public/visualizations/TNF_CONCORDANCE_VISUALIZER.html`
- - Current local file: Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/
- # Restore codebase_map.json from git in ~/Desktop/A1-Inter-LLM-Com/The-New-Fuse
- $ git show
  eed740a988ae1c36bd758a883b839c96a4af302c:apps/frontend/src/data/codebase_map.json >
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/data/codebase_map_restored.json
  2>&1 && wc -c
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/data/codebase_map_restored.json
- 6692995
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/data/codebase_map_restored.json
- $ python3 -c "import json;
  d=json.load(open('/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/data/codebase_map_restored.json'));
  print(f'nodes: {len(d[\"nodes\"])}, edges: {len(d[\"edges\"])}')"
- $ mv
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/data/codebase_map_restored.json
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/data/codebase_map.json
- $ wc -c
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/data/codebase_map.json
- 6692995
  /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/frontend/src/data/codebase_map.json

### Governance

- all 6 phrase groups (agent, communication, vocabulary, intelligence,
  resilience, governance)
- | `/power-phrases/agent` | GET | Specific phrase group (agent, communication,
  vocabulary, intelligence, resilience, governance) |

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.154
- Verification Difficulty: Hard

## Synthesis

Artifact captures 20 procedural, 13 strategic, and 2 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.
