// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"content-calendar-orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"algorithm-adaptation-agent",kind:"sub",cluster:"social"},
  {id:"audience-growth-agent",kind:"primary",cluster:"social"},
  {id:"audience-persona-architect-agent",kind:"sub",cluster:"social"},
  {id:"audience-segmentation-agent",kind:"sub",cluster:"social"},
  {id:"community-engagement-agent",kind:"sub",cluster:"social"},
  {id:"community-manager-agent",kind:"primary",cluster:"social"},
  {id:"content-repurposing-agent",kind:"primary",cluster:"social"},
  {id:"facebook-strategy-agent",kind:"primary",cluster:"social"},
  {id:"instagram-strategy-agent",kind:"primary",cluster:"social"},
  {id:"scout-llm-opportunities",kind:"sub",cluster:"social"},
  {id:"scriptwriter-agent",kind:"sub",cluster:"social"},
  {id:"social-selling-agent",kind:"sub",cluster:"social"},
  {id:"tiktok-strategy-agent",kind:"primary",cluster:"social"},
  {id:"traffic-generation-agent",kind:"sub",cluster:"social"},
  {id:"x-strategy-agent",kind:"primary",cluster:"social"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-26T06:38:20Z');

UNWIND [
  {s:"audience-growth-agent",t:"community-manager-agent",rel:"FALLBACK",strength:0.73,risk:"capability_overlap"},
  {s:"audience-growth-agent",t:"facebook-strategy-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"community-engagement-agent",t:"community-manager-agent",rel:"FALLBACK",strength:0.73,risk:"capability_overlap"},
  {s:"community-engagement-agent",t:"instagram-strategy-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"community-manager-agent",t:"social-selling-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"community-manager-agent",t:"traffic-generation-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"content-repurposing-agent",t:"tiktok-strategy-agent",rel:"FALLBACK",strength:0.71,risk:"capability_overlap"},
  {s:"facebook-strategy-agent",t:"instagram-strategy-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"facebook-strategy-agent",t:"social-selling-agent",rel:"FALLBACK",strength:0.81,risk:"capability_overlap"},
  {s:"facebook-strategy-agent",t:"tiktok-strategy-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"instagram-strategy-agent",t:"community-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"instagram-strategy-agent",t:"tiktok-strategy-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"instagram-strategy-agent",t:"x-strategy-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"orchestrator-agent",t:"content-calendar-orchestrator-agent",rel:"DELEGATES",strength:0.86,risk:""},
  {s:"orchestrator-agent",t:"content-calendar-orchestrator-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"scout-llm-opportunities",t:"social-selling-agent",rel:"FALLBACK",strength:0.58,risk:"capability_overlap"},
  {s:"scriptwriter-agent",t:"tiktok-strategy-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"task-agent-router",t:"audience-segmentation-agent",rel:"DELEGATES",strength:0.57,risk:"routing_backstop"},
  {s:"task-agent-router",t:"community-engagement-agent",rel:"DELEGATES",strength:0.57,risk:"routing_backstop"},
  {s:"task-agent-router",t:"content-calendar-orchestrator-agent",rel:"ROUTES_TO",strength:0.8,risk:""},
  {s:"task-agent-router",t:"content-repurposing-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"tiktok-strategy-agent",t:"x-strategy-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"traffic-generation-agent",t:"scriptwriter-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"traffic-generation-agent",t:"x-strategy-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"x-strategy-agent",t:"audience-growth-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
