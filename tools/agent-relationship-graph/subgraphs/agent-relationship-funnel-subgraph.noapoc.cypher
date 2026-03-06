// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"sales-funnel-architect-agent",kind:"sub",cluster:"funnel"},
  {id:"cro-process-agent",kind:"primary",cluster:"funnel"},
  {id:"ab-testing-optimizer-agent",kind:"sub",cluster:"funnel"},
  {id:"cognitive-bias-optimizer-agent",kind:"sub",cluster:"funnel"},
  {id:"value-ladder-architect-agent",kind:"primary",cluster:"funnel"},
  {id:"analytics-and-reporting-agent",kind:"primary",cluster:"ops"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-03T00:00:00Z');

UNWIND [
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"task-agent-router",t:"cro-process-agent",rel:"ROUTES_TO",strength:0.77,risk:""},
  {s:"cro-process-agent",t:"ab-testing-optimizer-agent",rel:"ORCHESTRATES",strength:0.92,risk:""},
  {s:"cro-process-agent",t:"cognitive-bias-optimizer-agent",rel:"ORCHESTRATES",strength:0.83,risk:""},
  {s:"ab-testing-optimizer-agent",t:"analytics-and-reporting-agent",rel:"MEASURED_BY",strength:0.89,risk:""},
  {s:"cognitive-bias-optimizer-agent",t:"analytics-and-reporting-agent",rel:"MEASURED_BY",strength:0.82,risk:""}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk,
    rel.updatedAt = datetime('2026-03-03T00:00:00Z');
