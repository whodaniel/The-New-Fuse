// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"podcast-niche-analyst-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-format-designer-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-hosting-setup-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-distribution-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-promotion-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-analytics-agent",kind:"sub",cluster:"podcast"},
  {id:"analytics-and-reporting-agent",kind:"primary",cluster:"ops"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-03T00:00:00Z');

UNWIND [
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"task-agent-router",t:"podcast-promotion-agent",rel:"ROUTES_TO",strength:0.66,risk:""},
  {s:"podcast-niche-analyst-agent",t:"podcast-format-designer-agent",rel:"FEEDS",strength:0.85,risk:""},
  {s:"podcast-format-designer-agent",t:"podcast-hosting-setup-agent",rel:"HANDOFF",strength:0.81,risk:""},
  {s:"podcast-hosting-setup-agent",t:"podcast-distribution-agent",rel:"HANDOFF",strength:0.93,risk:""},
  {s:"podcast-distribution-agent",t:"podcast-promotion-agent",rel:"ENABLES",strength:0.87,risk:""},
  {s:"podcast-promotion-agent",t:"podcast-analytics-agent",rel:"MEASURED_BY",strength:0.84,risk:""}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk,
    rel.updatedAt = datetime('2026-03-03T00:00:00Z');
