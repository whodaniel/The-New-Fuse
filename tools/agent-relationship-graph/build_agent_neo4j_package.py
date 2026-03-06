#!/usr/bin/env python3
"""Build a Neo4j-importable CSV + Cypher package from the agent relationship graph."""
import csv
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SUBGRAPHS_DIR = SCRIPT_DIR / 'subgraphs'
OUT = SCRIPT_DIR / 'neo4j-package'
OUT.mkdir(exist_ok=True)

master = json.loads((SCRIPT_DIR / 'agent-relationship-graph.json').read_text())
subgraphs = {}
for d in ['podcast','seo','brand','funnel','social','ops','content']:
    p = SUBGRAPHS_DIR / f'agent-relationship-{d}-subgraph.json'
    if p.exists():
        subgraphs[d] = json.loads(p.read_text())

nodes = {n['id']: n for n in master['nodes']}
edges = master['edges']

# Domain membership map
membership = {nid: [] for nid in nodes.keys()}
for domain, g in subgraphs.items():
    for n in g.get('nodes', []):
        nid = n['id']
        if nid in membership:
            membership[nid].append(domain)

with (OUT / 'nodes.csv').open('w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['id','kind','cluster','domains'])
    for nid in sorted(nodes.keys()):
        n = nodes[nid]
        w.writerow([nid, n.get('kind',''), n.get('cluster',''), '|'.join(sorted(membership[nid]))])

with (OUT / 'edges.csv').open('w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['source','target','relationType','strength','risk','direction'])
    for e in edges:
        w.writerow([
            e['source'],
            e['target'],
            str(e.get('type','')).upper(),
            e.get('strength', 0.5),
            e.get('risk',''),
            e.get('direction','unidirectional'),
        ])

with (OUT / 'domain_membership.csv').open('w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['agentId','domain'])
    for nid in sorted(membership.keys()):
        for d in sorted(membership[nid]):
            w.writerow([nid, d])

from datetime import datetime, timezone
stamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

noapoc = f'''// Neo4j load script (no APOC required)
// Place CSV files in Neo4j import directory.

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row
MERGE (a:Agent {{id: row.id}})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.domains = CASE WHEN row.domains = '' THEN [] ELSE split(row.domains, '|') END,
    a.updatedAt = datetime('{stamp}');

LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS row
MATCH (s:Agent {{id: row.source}})
MATCH (t:Agent {{id: row.target}})
MERGE (s)-[r:RELATED {{relationType: row.relationType}}]->(t)
SET r.strength = toFloat(row.strength),
    r.risk = row.risk,
    r.direction = row.direction,
    r.updatedAt = datetime('{stamp}');

LOAD CSV WITH HEADERS FROM 'file:///domain_membership.csv' AS row
MATCH (a:Agent {{id: row.agentId}})
MERGE (d:Domain {{name: row.domain}})
MERGE (a)-[:IN_DOMAIN]->(d);
'''
(OUT / 'load.noapoc.cypher').write_text(noapoc)

apoc = f'''// Neo4j load script (APOC dynamic relationship type variant)
// Requires APOC core plugin.

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row
MERGE (a:Agent {{id: row.id}})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.domains = CASE WHEN row.domains = '' THEN [] ELSE split(row.domains, '|') END,
    a.updatedAt = datetime('{stamp}');

LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS row
MATCH (s:Agent {{id: row.source}})
MATCH (t:Agent {{id: row.target}})
CALL apoc.merge.relationship(
  s,
  row.relationType,
  {{}},
  {{strength: toFloat(row.strength), risk: row.risk, direction: row.direction, updatedAt: datetime('{stamp}')}},
  t
) YIELD rel
RETURN count(rel) AS relationships_upserted;
'''
(OUT / 'load.apoc.cypher').write_text(apoc)

readme = f'''# Agent Relationship Neo4j Package

Generated: {stamp}

## Files
- `nodes.csv`: agent nodes with base metadata
- `edges.csv`: directed relationships with type and strength
- `domain_membership.csv`: many-to-many domain assignments
- `load.noapoc.cypher`: import script using fixed `:RELATED` + `relationType` property
- `load.apoc.cypher`: import script with dynamic relationship types via APOC

## Import Steps
1. Copy CSV files into Neo4j import directory.
2. Run one script:
   - No APOC: `:source load.noapoc.cypher`
   - APOC: `:source load.apoc.cypher`

## Quick Validation Queries
```cypher
MATCH (a:Agent) RETURN count(a) AS agents;
MATCH ()-[r]->() RETURN count(r) AS relationships;
MATCH (d:Domain)<-[:IN_DOMAIN]-(:Agent) RETURN d.name, count(*) AS n ORDER BY n DESC;
MATCH (a:Agent)-[r:RELATED]->(b:Agent)
RETURN a.id, r.relationType, b.id, r.strength
ORDER BY r.strength DESC LIMIT 20;
```
'''
(OUT / 'README.md').write_text(readme)

print('wrote', OUT)
for p in sorted(OUT.iterdir()):
    print('-', p.name)
