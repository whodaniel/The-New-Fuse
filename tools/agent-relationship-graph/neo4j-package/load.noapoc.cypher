// Neo4j load script (no APOC required)
// Place CSV files in Neo4j import directory.

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.domains = CASE WHEN row.domains = '' THEN [] ELSE split(row.domains, '|') END,
    a.updatedAt = datetime('2026-03-11T02:47:16Z');

LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS row
MATCH (s:Agent {id: row.source})
MATCH (t:Agent {id: row.target})
MERGE (s)-[r:RELATED {relationType: row.relationType}]->(t)
SET r.strength = toFloat(row.strength),
    r.risk = row.risk,
    r.direction = row.direction,
    r.updatedAt = datetime('2026-03-11T02:47:16Z');

LOAD CSV WITH HEADERS FROM 'file:///domain_membership.csv' AS row
MATCH (a:Agent {id: row.agentId})
MERGE (d:Domain {name: row.domain})
MERGE (a)-[:IN_DOMAIN]->(d);
