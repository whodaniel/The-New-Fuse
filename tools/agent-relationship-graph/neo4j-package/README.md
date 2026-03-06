# Agent Relationship Neo4j Package

Generated: 2026-03-05T20:31:40Z

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
