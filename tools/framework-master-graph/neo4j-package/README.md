# Master Framework Neo4j Package

Generated: 2026-03-09T06:56:50.490Z

## Files

- `nodes.csv`
- `edges.csv`
- `load.noapoc.cypher`
- `load.apoc.cypher`

## Quick Validation

```cypher
MATCH (n:FrameworkNode) RETURN count(n) AS nodes;
MATCH ()-[r]->() RETURN count(r) AS edges;
MATCH (n:FrameworkNode) RETURN n.kind, count(*) AS n ORDER BY n DESC;
MATCH (a:FrameworkNode {kind:"agent"})-[r]->(b:FrameworkNode) RETURN a.id, type(r), b.id LIMIT 50;
```
