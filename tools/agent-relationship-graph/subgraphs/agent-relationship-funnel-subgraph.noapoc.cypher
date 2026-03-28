// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"analytics-and-reporting-agent",kind:"primary",cluster:"content"},
  {id:"ab-testing-optimizer-agent",kind:"primary",cluster:"funnel"},
  {id:"affiliate-link-manager-agent",kind:"primary",cluster:"funnel"},
  {id:"audio-recording-agent",kind:"sub",cluster:"funnel"},
  {id:"code-fossil-investigator",kind:"sub",cluster:"funnel"},
  {id:"cognitive-bias-optimizer-agent",kind:"sub",cluster:"funnel"},
  {id:"cro-process-agent",kind:"primary",cluster:"funnel"},
  {id:"customer-journey-map-agent",kind:"sub",cluster:"funnel"},
  {id:"ecom-platform-manager-agent",kind:"sub",cluster:"funnel"},
  {id:"equipment-recommendation-agent",kind:"sub",cluster:"funnel"},
  {id:"ethical-bias-auditor-agent",kind:"sub",cluster:"funnel"},
  {id:"funnel-economics-analyst-agent",kind:"sub",cluster:"funnel"},
  {id:"information-retrieval-agent",kind:"sub",cluster:"funnel"},
  {id:"lead-capture-agent",kind:"primary",cluster:"funnel"},
  {id:"lead-magnet-funnel-agent",kind:"primary",cluster:"funnel"},
  {id:"master-of-taxonomies",kind:"sub",cluster:"funnel"},
  {id:"monetization-strategy-agent",kind:"primary",cluster:"funnel"},
  {id:"niche-analyst-agent",kind:"sub",cluster:"funnel"},
  {id:"oto-sequence-architect-agent",kind:"sub",cluster:"funnel"},
  {id:"personalized-content-recommendation-agent",kind:"primary",cluster:"funnel"},
  {id:"sales-funnel-architect-agent",kind:"sub",cluster:"funnel"},
  {id:"value-ladder-architect-agent",kind:"primary",cluster:"funnel"},
  {id:"visual-asset-creator-agent",kind:"sub",cluster:"funnel"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-26T09:23:34Z');

UNWIND [
  {s:"ab-testing-optimizer-agent",t:"analytics-and-reporting-agent",rel:"DEPENDS_ON",strength:0.89,risk:""},
  {s:"ab-testing-optimizer-agent",t:"analytics-and-reporting-agent",rel:"MEASURED_BY",strength:0.89,risk:""},
  {s:"ab-testing-optimizer-agent",t:"cognitive-bias-optimizer-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"ab-testing-optimizer-agent",t:"lead-magnet-funnel-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"affiliate-link-manager-agent",t:"ab-testing-optimizer-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"analytics-and-reporting-agent",t:"ethical-bias-auditor-agent",rel:"DEPENDS_ON",strength:0.68,risk:""},
  {s:"cognitive-bias-optimizer-agent",t:"analytics-and-reporting-agent",rel:"DEPENDS_ON",strength:0.82,risk:""},
  {s:"cognitive-bias-optimizer-agent",t:"analytics-and-reporting-agent",rel:"MEASURED_BY",strength:0.82,risk:""},
  {s:"cognitive-bias-optimizer-agent",t:"visual-asset-creator-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"cro-process-agent",t:"ab-testing-optimizer-agent",rel:"DELEGATES",strength:0.92,risk:""},
  {s:"cro-process-agent",t:"ab-testing-optimizer-agent",rel:"ORCHESTRATES",strength:0.92,risk:""},
  {s:"cro-process-agent",t:"affiliate-link-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"cro-process-agent",t:"cognitive-bias-optimizer-agent",rel:"DELEGATES",strength:0.83,risk:""},
  {s:"cro-process-agent",t:"cognitive-bias-optimizer-agent",rel:"ORCHESTRATES",strength:0.83,risk:""},
  {s:"cro-process-agent",t:"customer-journey-map-agent",rel:"FALLBACK",strength:0.56,risk:"capability_overlap"},
  {s:"cro-process-agent",t:"funnel-economics-analyst-agent",rel:"FALLBACK",strength:0.58,risk:"capability_overlap"},
  {s:"customer-journey-map-agent",t:"funnel-economics-analyst-agent",rel:"FALLBACK",strength:0.56,risk:"capability_overlap"},
  {s:"customer-journey-map-agent",t:"value-ladder-architect-agent",rel:"FALLBACK",strength:0.54,risk:"capability_overlap"},
  {s:"ethical-bias-auditor-agent",t:"lead-magnet-funnel-agent",rel:"FALLBACK",strength:0.58,risk:"capability_overlap"},
  {s:"ethical-bias-auditor-agent",t:"visual-asset-creator-agent",rel:"FALLBACK",strength:0.62,risk:"capability_overlap"},
  {s:"funnel-economics-analyst-agent",t:"lead-capture-agent",rel:"FALLBACK",strength:0.56,risk:"capability_overlap"},
  {s:"funnel-economics-analyst-agent",t:"oto-sequence-architect-agent",rel:"FALLBACK",strength:0.58,risk:"capability_overlap"},
  {s:"lead-capture-agent",t:"lead-magnet-funnel-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"lead-capture-agent",t:"niche-analyst-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"lead-capture-agent",t:"oto-sequence-architect-agent",rel:"FALLBACK",strength:0.56,risk:"capability_overlap"},
  {s:"lead-magnet-funnel-agent",t:"personalized-content-recommendation-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"monetization-strategy-agent",t:"lead-capture-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"niche-analyst-agent",t:"code-fossil-investigator",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"oto-sequence-architect-agent",t:"value-ladder-architect-agent",rel:"FALLBACK",strength:0.84,risk:"capability_overlap"},
  {s:"personalized-content-recommendation-agent",t:"monetization-strategy-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"sales-funnel-architect-agent",t:"lead-magnet-funnel-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"sales-funnel-architect-agent",t:"value-ladder-architect-agent",rel:"FALLBACK",strength:0.62,risk:"capability_overlap"},
  {s:"task-agent-router",t:"analytics-and-reporting-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"audio-recording-agent",rel:"DELEGATES",strength:0.57,risk:"routing_backstop"},
  {s:"task-agent-router",t:"cro-process-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"cro-process-agent",rel:"ROUTES_TO",strength:0.77,risk:""},
  {s:"task-agent-router",t:"ecom-platform-manager-agent",rel:"DELEGATES",strength:0.57,risk:"routing_backstop"},
  {s:"task-agent-router",t:"master-of-taxonomies",rel:"DELEGATES",strength:0.57,risk:"routing_backstop"},
  {s:"value-ladder-architect-agent",t:"sales-funnel-architect-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"visual-asset-creator-agent",t:"value-ladder-architect-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
