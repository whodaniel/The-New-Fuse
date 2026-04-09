// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"legal-compliance-agent",kind:"primary",cluster:"ops"},
  {id:"financial-manager-agent",kind:"primary",cluster:"ops"},
  {id:"tax-compliance-agent",kind:"sub",cluster:"ops"},
  {id:"reputation-management-agent",kind:"sub",cluster:"ops"},
  {id:"productivity-and-burnout-prevention-agent",kind:"sub",cluster:"ops"},
  {id:"analytics-and-reporting-agent",kind:"primary",cluster:"ops"},
  {id:"affiliate-link-manager-agent",kind:"sub",cluster:"ops"},
  {id:"asset-sourcer-agent",kind:"sub",cluster:"ops"},
  {id:"visual-asset-creator-agent",kind:"sub",cluster:"ops"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-12T14:01:56Z');

UNWIND [
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"task-agent-router",t:"legal-compliance-agent",rel:"ROUTES_TO",strength:0.81,risk:""},
  {s:"legal-compliance-agent",t:"affiliate-link-manager-agent",rel:"GOVERNS",strength:0.90,risk:""},
  {s:"legal-compliance-agent",t:"asset-sourcer-agent",rel:"GOVERNS",strength:0.89,risk:""},
  {s:"asset-sourcer-agent",t:"visual-asset-creator-agent",rel:"SUPPLIES",strength:0.82,risk:""}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
