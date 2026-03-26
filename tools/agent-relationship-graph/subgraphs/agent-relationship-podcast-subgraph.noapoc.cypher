// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"analytics-and-reporting-agent",kind:"primary",cluster:"content"},
  {id:"episode-planner-agent",kind:"sub",cluster:"podcast"},
  {id:"guest-booking-agent",kind:"sub",cluster:"podcast"},
  {id:"guest-relationship-manager-agent",kind:"primary",cluster:"podcast"},
  {id:"podcast-ad-network-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-affiliate-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-analytics-agent",kind:"primary",cluster:"podcast"},
  {id:"podcast-audio-editor-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-distribution-agent",kind:"primary",cluster:"podcast"},
  {id:"podcast-equipment-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-format-designer-agent",kind:"primary",cluster:"podcast"},
  {id:"podcast-hosting-setup-agent",kind:"primary",cluster:"podcast"},
  {id:"podcast-monetization-strategy-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-niche-analyst-agent",kind:"primary",cluster:"podcast"},
  {id:"podcast-promotion-agent",kind:"primary",cluster:"podcast"},
  {id:"podcast-seo-agent",kind:"sub",cluster:"podcast"},
  {id:"podcast-video-editor-agent",kind:"sub",cluster:"podcast"},
  {id:"sponsorship-outreach-agent",kind:"sub",cluster:"podcast"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-26T06:38:20Z');

UNWIND [
  {s:"episode-planner-agent",t:"podcast-equipment-agent",rel:"FALLBACK",strength:0.77,risk:"capability_overlap"},
  {s:"guest-booking-agent",t:"guest-relationship-manager-agent",rel:"FEEDS",strength:0.61,risk:""},
  {s:"guest-booking-agent",t:"sponsorship-outreach-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"guest-relationship-manager-agent",t:"podcast-analytics-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"guest-relationship-manager-agent",t:"podcast-distribution-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"podcast-ad-network-agent",t:"podcast-audio-editor-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"podcast-ad-network-agent",t:"podcast-hosting-setup-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"podcast-affiliate-agent",t:"podcast-monetization-strategy-agent",rel:"FALLBACK",strength:0.81,risk:"capability_overlap"},
  {s:"podcast-affiliate-agent",t:"podcast-niche-analyst-agent",rel:"FALLBACK",strength:0.84,risk:"capability_overlap"},
  {s:"podcast-affiliate-agent",t:"sponsorship-outreach-agent",rel:"FALLBACK",strength:0.77,risk:"capability_overlap"},
  {s:"podcast-analytics-agent",t:"podcast-hosting-setup-agent",rel:"FALLBACK",strength:0.73,risk:"capability_overlap"},
  {s:"podcast-analytics-agent",t:"podcast-niche-analyst-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"podcast-analytics-agent",t:"podcast-video-editor-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"podcast-audio-editor-agent",t:"podcast-hosting-setup-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"podcast-distribution-agent",t:"podcast-promotion-agent",rel:"ENABLES",strength:0.87,risk:""},
  {s:"podcast-distribution-agent",t:"podcast-promotion-agent",rel:"FEEDS",strength:0.87,risk:""},
  {s:"podcast-distribution-agent",t:"sponsorship-outreach-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"podcast-equipment-agent",t:"podcast-format-designer-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"podcast-equipment-agent",t:"podcast-monetization-strategy-agent",rel:"FALLBACK",strength:0.77,risk:"capability_overlap"},
  {s:"podcast-format-designer-agent",t:"guest-relationship-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"podcast-format-designer-agent",t:"podcast-hosting-setup-agent",rel:"FEEDS",strength:0.81,risk:""},
  {s:"podcast-format-designer-agent",t:"podcast-hosting-setup-agent",rel:"HANDOFF",strength:0.81,risk:""},
  {s:"podcast-hosting-setup-agent",t:"podcast-distribution-agent",rel:"FEEDS",strength:0.93,risk:""},
  {s:"podcast-hosting-setup-agent",t:"podcast-distribution-agent",rel:"HANDOFF",strength:0.93,risk:""},
  {s:"podcast-hosting-setup-agent",t:"podcast-format-designer-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"podcast-monetization-strategy-agent",t:"podcast-niche-analyst-agent",rel:"FALLBACK",strength:0.73,risk:"capability_overlap"},
  {s:"podcast-niche-analyst-agent",t:"podcast-format-designer-agent",rel:"FEEDS",strength:0.85,risk:""},
  {s:"podcast-niche-analyst-agent",t:"podcast-hosting-setup-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"podcast-niche-analyst-agent",t:"podcast-video-editor-agent",rel:"FEEDS",strength:0.68,risk:""},
  {s:"podcast-niche-analyst-agent",t:"sponsorship-outreach-agent",rel:"FALLBACK",strength:0.71,risk:"capability_overlap"},
  {s:"podcast-promotion-agent",t:"podcast-analytics-agent",rel:"DEPENDS_ON",strength:0.84,risk:""},
  {s:"podcast-promotion-agent",t:"podcast-analytics-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"podcast-promotion-agent",t:"podcast-analytics-agent",rel:"MEASURED_BY",strength:0.84,risk:""},
  {s:"podcast-promotion-agent",t:"sponsorship-outreach-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"podcast-video-editor-agent",t:"sponsorship-outreach-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"sponsorship-outreach-agent",t:"podcast-seo-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"task-agent-router",t:"analytics-and-reporting-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"guest-booking-agent",rel:"DELEGATES",strength:0.57,risk:"routing_backstop"},
  {s:"task-agent-router",t:"podcast-promotion-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"podcast-promotion-agent",rel:"ROUTES_TO",strength:0.66,risk:""}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
