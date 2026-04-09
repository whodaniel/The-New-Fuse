// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"content-calendar-orchestrator-agent",kind:"primary",cluster:"content"},
  {id:"instagram-strategy-agent",kind:"sub",cluster:"social"},
  {id:"tiktok-strategy-agent",kind:"sub",cluster:"social"},
  {id:"x-strategy-agent",kind:"sub",cluster:"social"},
  {id:"facebook-strategy-agent",kind:"sub",cluster:"social"},
  {id:"audience-growth-agent",kind:"sub",cluster:"social"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-12T14:01:56Z');

UNWIND [
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"task-agent-router",t:"content-calendar-orchestrator-agent",rel:"ROUTES_TO",strength:0.80,risk:""}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
