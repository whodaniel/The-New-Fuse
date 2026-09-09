# Agent Relationship Neo4j Package

Regenerated: 2026-07-25T19:27:36.317Z

## Axis contract

Nodes now include:

- `daccRole` — hierarchy seat (director/orchestrator/broker/worker/…)
- `platform` — fulfillment surface (antigravity/claude/pi/master-clock/…)
- `workerAction` — work type (may be `orchestrator` without holding the baton)
- `batonHolder` / `batonIdentity` — only `master-clock-baton` is the protocol
  baton

`cluster: orchestration` is a **work-domain affinity label**, not baton
ownership. Canonical taxonomy viz:
`/visualizations/graphs/dacc-role-platform-axes.html`

## Files

- `nodes.csv`: agent nodes with axis metadata
- `edges.csv`: typed relationships
- `domain_membership.csv`: agent → domain membership
- `load.noapoc.cypher` / `load.apoc.cypher`: import scripts
