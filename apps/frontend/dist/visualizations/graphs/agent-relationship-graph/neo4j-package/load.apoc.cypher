// Neo4j load script (APOC dynamic relationship type variant)
// Requires APOC core plugin.

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.domains = CASE WHEN row.domains = '' THEN [] ELSE split(row.domains, '|') END,
    a.updatedAt = datetime('2026-04-07T13:44:08Z');

LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS row
MATCH (s:Agent {id: row.source})
MATCH (t:Agent {id: row.target})
CALL apoc.merge.relationship(
  s,
  row.relationType,
  {},
  {strength: toFloat(row.strength), risk: row.risk, direction: row.direction, updatedAt: datetime('2026-04-07T13:44:08Z')},
  t
) YIELD rel
RETURN count(rel) AS relationships_upserted;
