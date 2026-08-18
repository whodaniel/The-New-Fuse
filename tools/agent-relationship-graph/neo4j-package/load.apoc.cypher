// Neo4j load script (APOC variant)
// Regenerated 2026-07-25T19:27:36.317Z
// Axes: daccRole ⊥ platform ⊥ workerAction ⊥ batonHolder

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

CALL apoc.load.csv('file:///nodes.csv') YIELD map AS row
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

CALL apoc.load.csv('file:///edges.csv') YIELD map AS row
MATCH (s:Agent {id: row.source})
MATCH (t:Agent {id: row.target})
MERGE (s)-[r:RELATED {relationType: row.relationType}]->(t)
SET r.strength = CASE WHEN row.strength = '' THEN null ELSE toFloat(row.strength) END,
    r.risk = row.risk,
    r.direction = row.direction,
    r.updatedAt = datetime('2026-07-25T19:27:36.317Z');

CALL apoc.load.csv('file:///domain_membership.csv') YIELD map AS row
MATCH (a:Agent {id: row.agentId})
MERGE (d:Domain {name: row.domain})
MERGE (a)-[:IN_DOMAIN]->(d);
