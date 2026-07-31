# Agent Relationship Centrality Report

Generated: 2026-07-25

## Axis disclaimer

- **Degree centrality** measures delegation/dependency topology hubs.
- It does **not** identify the DACC baton. Baton holder is `master-clock-baton`
  (`ORCHESTRATOR-{timestamp}`, platform `master-clock`).
- `orchestrator-agent` may rank high as a **domain coordination persona**;
  that is `workerAction=orchestrator`, not protocol baton ownership.
- Baton node present: yes · batonHolder=true

## full (agent-relationship-graph.json)

- Nodes: 122
- Edges: 440
- Top degree hubs (topology only):
  - task-agent-router: 27 (daccRole=—, platform=—)
  - orchestrator-agent: 21 (daccRole=worker, platform=—)
  - seo-optimizer-agent: 13 (daccRole=—, platform=—)
  - sponsorship-outreach-agent: 13 (daccRole=—, platform=—)
  - legal-compliance-agent: 13 (daccRole=—, platform=—)
  - podcast-hosting-setup-agent: 12 (daccRole=—, platform=—)
  - podcast-promotion-agent: 12 (daccRole=—, platform=—)
  - personal-archaeology-source-team-orchestrator: 11 (daccRole=—, platform=—)
  - keyword-research-agent: 11 (daccRole=—, platform=—)
  - link-building-agent: 11 (daccRole=—, platform=—)

See domain subgraphs under `subgraphs/` for per-domain hubs.

