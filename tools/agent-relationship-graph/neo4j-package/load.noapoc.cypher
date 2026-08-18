// Neo4j load script (no APOC required)
// Regenerated 2026-07-25T19:27:36.317Z
// Axes: daccRole ⊥ platform ⊥ workerAction ⊥ batonHolder
// Place CSV files in Neo4j import directory.

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.domains = CASE WHEN row.domains = '' THEN [] ELSE split(row.domains, '|') END,
    a.daccRole = CASE WHEN row.daccRole = '' THEN null ELSE row.daccRole END,
    a.platform = CASE WHEN row.platform = '' THEN null ELSE row.platform END,
    a.workerAction = CASE WHEN row.workerAction = '' THEN null ELSE row.workerAction END,
    a.batonHolder = CASE WHEN row.batonHolder = 'true' THEN true ELSE false END,
    a.batonIdentity = CASE WHEN row.batonIdentity = '' THEN null ELSE row.batonIdentity END,
    a.axesNote = CASE WHEN row.axesNote = '' THEN null ELSE row.axesNote END,
    a.updatedAt = datetime('2026-07-25T19:27:36.317Z');

LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS row
MATCH (s:Agent {id: row.source})
MATCH (t:Agent {id: row.target})
MERGE (s)-[r:RELATED {relationType: row.relationType}]->(t)
SET r.strength = CASE WHEN row.strength = '' THEN null ELSE toFloat(row.strength) END,
    r.risk = row.risk,
    r.direction = row.direction,
    r.updatedAt = datetime('2026-07-25T19:27:36.317Z');

LOAD CSV WITH HEADERS FROM 'file:///domain_membership.csv' AS row
MATCH (a:Agent {id: row.agentId})
MERGE (d:Domain {name: row.domain})
MERGE (a)-[:IN_DOMAIN]->(d);
