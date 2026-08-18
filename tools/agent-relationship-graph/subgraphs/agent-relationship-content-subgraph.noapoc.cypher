// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"ad-network-manager-agent",kind:"primary",cluster:"content"},
  {id:"analytics-and-reporting-agent",kind:"primary",cluster:"content"},
  {id:"content-writer-agent",kind:"primary",cluster:"content"},
  {id:"digital-product-creator-agent",kind:"primary",cluster:"content"},
  {id:"digital-product-factory-agent",kind:"primary",cluster:"content"},
  {id:"fan-funding-agent",kind:"sub",cluster:"content"},
  {id:"live-stream-manager-agent",kind:"sub",cluster:"content"},
  {id:"media-evidence-investigator",kind:"primary",cluster:"content"},
  {id:"storyboard-artist-agent",kind:"sub",cluster:"content"},
  {id:"technical-setup-agent",kind:"sub",cluster:"content"},
  {id:"twip-orchestration-bridge",kind:"sub",cluster:"content"},
  {id:"user-feedback-analysis-agent",kind:"sub",cluster:"content"},
  {id:"video-editor-agent",kind:"sub",cluster:"content"},
  {id:"yt-niche-strategy-agent",kind:"primary",cluster:"content"},
  {id:"keyword-research-agent",kind:"primary",cluster:"seo"},
  {id:"seo-optimizer-agent",kind:"primary",cluster:"seo"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-04-07T13:44:07Z');

UNWIND [
  {s:"ad-network-manager-agent",t:"analytics-and-reporting-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"ad-network-manager-agent",t:"user-feedback-analysis-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"ad-network-manager-agent",t:"yt-niche-strategy-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"analytics-and-reporting-agent",t:"content-writer-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"analytics-and-reporting-agent",t:"user-feedback-analysis-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"content-writer-agent",t:"ad-network-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"content-writer-agent",t:"seo-optimizer-agent",rel:"DEPENDS_ON",strength:0.77,risk:""},
  {s:"content-writer-agent",t:"seo-optimizer-agent",rel:"FEEDS",strength:0.91,risk:""},
  {s:"content-writer-agent",t:"seo-optimizer-agent",rel:"HANDOFF",strength:0.91,risk:""},
  {s:"digital-product-creator-agent",t:"keyword-research-agent",rel:"DEPENDS_ON",strength:0.73,risk:""},
  {s:"digital-product-creator-agent",t:"video-editor-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"digital-product-factory-agent",t:"media-evidence-investigator",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"digital-product-factory-agent",t:"seo-optimizer-agent",rel:"DEPENDS_ON",strength:0.58,risk:""},
  {s:"keyword-research-agent",t:"content-writer-agent",rel:"FEEDS",strength:0.88,risk:""},
  {s:"keyword-research-agent",t:"seo-optimizer-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"live-stream-manager-agent",t:"video-editor-agent",rel:"FALLBACK",strength:0.54,risk:"capability_overlap"},
  {s:"media-evidence-investigator",t:"digital-product-creator-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"storyboard-artist-agent",t:"video-editor-agent",rel:"FALLBACK",strength:0.62,risk:"capability_overlap"},
  {s:"task-agent-router",t:"analytics-and-reporting-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"content-writer-agent",rel:"ROUTES_TO",strength:0.72,risk:""},
  {s:"task-agent-router",t:"keyword-research-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"keyword-research-agent",rel:"ROUTES_TO",strength:0.73,risk:""},
  {s:"task-agent-router",t:"seo-optimizer-agent",rel:"ROUTES_TO",strength:0.73,risk:""},
  {s:"technical-setup-agent",t:"user-feedback-analysis-agent",rel:"FALLBACK",strength:0.58,risk:"capability_overlap"},
  {s:"video-editor-agent",t:"fan-funding-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"yt-niche-strategy-agent",t:"digital-product-factory-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
