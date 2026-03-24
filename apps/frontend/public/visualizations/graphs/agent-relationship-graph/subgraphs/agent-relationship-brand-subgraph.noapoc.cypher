// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"brand-identity-agent",kind:"sub",cluster:"brand"},
  {id:"brand-prospecting-agent",kind:"sub",cluster:"brand"},
  {id:"brand-outreach-agent",kind:"sub",cluster:"brand"},
  {id:"deal-negotiator-agent",kind:"sub",cluster:"brand"},
  {id:"contract-manager-agent",kind:"sub",cluster:"brand"},
  {id:"campaign-execution-agent",kind:"primary",cluster:"brand"},
  {id:"campaign-reporting-agent",kind:"sub",cluster:"brand"},
  {id:"legal-compliance-agent",kind:"primary",cluster:"ops"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-12T14:01:56Z');

UNWIND [
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"task-agent-router",t:"campaign-execution-agent",rel:"ROUTES_TO",strength:0.75,risk:""},
  {s:"task-agent-router",t:"legal-compliance-agent",rel:"ROUTES_TO",strength:0.81,risk:""},
  {s:"brand-prospecting-agent",t:"brand-outreach-agent",rel:"FEEDS",strength:0.90,risk:""},
  {s:"brand-outreach-agent",t:"deal-negotiator-agent",rel:"HANDOFF",strength:0.86,risk:""},
  {s:"deal-negotiator-agent",t:"contract-manager-agent",rel:"REQUIRES",strength:0.92,risk:""},
  {s:"contract-manager-agent",t:"campaign-execution-agent",rel:"GATES",strength:0.91,risk:""},
  {s:"campaign-execution-agent",t:"campaign-reporting-agent",rel:"HANDOFF",strength:0.88,risk:""}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
