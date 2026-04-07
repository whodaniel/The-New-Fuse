// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"brand-identity-agent",kind:"primary",cluster:"brand"},
  {id:"brand-outreach-agent",kind:"sub",cluster:"brand"},
  {id:"brand-prospecting-agent",kind:"sub",cluster:"brand"},
  {id:"campaign-execution-agent",kind:"primary",cluster:"brand"},
  {id:"campaign-reporting-agent",kind:"primary",cluster:"brand"},
  {id:"competitive-intelligence-agent",kind:"primary",cluster:"brand"},
  {id:"contract-manager-agent",kind:"sub",cluster:"brand"},
  {id:"deal-negotiator-agent",kind:"sub",cluster:"brand"},
  {id:"email-marketing-automation-agent",kind:"sub",cluster:"brand"},
  {id:"financial-manager-agent",kind:"primary",cluster:"brand"},
  {id:"influencer-media-kit-agent",kind:"sub",cluster:"brand"},
  {id:"influencer-niche-agent",kind:"sub",cluster:"brand"},
  {id:"personal-brand-architect-agent",kind:"sub",cluster:"brand"},
  {id:"platform-selection-agent",kind:"sub",cluster:"brand"},
  {id:"reputation-management-agent",kind:"primary",cluster:"brand"},
  {id:"talent-manager-agent",kind:"sub",cluster:"brand"},
  {id:"yt-content-strategy-agent",kind:"primary",cluster:"brand"},
  {id:"legal-compliance-agent",kind:"primary",cluster:"ops"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-04-07T13:44:07Z');

UNWIND [
  {s:"brand-identity-agent",t:"campaign-reporting-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"brand-identity-agent",t:"competitive-intelligence-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"brand-outreach-agent",t:"brand-prospecting-agent",rel:"FALLBACK",strength:0.95,risk:"capability_overlap"},
  {s:"brand-outreach-agent",t:"deal-negotiator-agent",rel:"FEEDS",strength:0.86,risk:""},
  {s:"brand-outreach-agent",t:"deal-negotiator-agent",rel:"HANDOFF",strength:0.86,risk:""},
  {s:"brand-outreach-agent",t:"influencer-niche-agent",rel:"FALLBACK",strength:0.77,risk:"capability_overlap"},
  {s:"brand-outreach-agent",t:"personal-brand-architect-agent",rel:"FALLBACK",strength:0.95,risk:"capability_overlap"},
  {s:"brand-prospecting-agent",t:"brand-outreach-agent",rel:"FEEDS",strength:0.9,risk:""},
  {s:"brand-prospecting-agent",t:"deal-negotiator-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"brand-prospecting-agent",t:"influencer-niche-agent",rel:"FALLBACK",strength:0.77,risk:"capability_overlap"},
  {s:"brand-prospecting-agent",t:"personal-brand-architect-agent",rel:"FALLBACK",strength:0.95,risk:"capability_overlap"},
  {s:"brand-prospecting-agent",t:"platform-selection-agent",rel:"FALLBACK",strength:0.77,risk:"capability_overlap"},
  {s:"campaign-execution-agent",t:"campaign-reporting-agent",rel:"FEEDS",strength:0.88,risk:""},
  {s:"campaign-execution-agent",t:"campaign-reporting-agent",rel:"HANDOFF",strength:0.88,risk:""},
  {s:"campaign-execution-agent",t:"deal-negotiator-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"campaign-execution-agent",t:"financial-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"campaign-execution-agent",t:"legal-compliance-agent",rel:"DEPENDS_ON",strength:0.8,risk:""},
  {s:"campaign-execution-agent",t:"yt-content-strategy-agent",rel:"FALLBACK",strength:0.77,risk:"capability_overlap"},
  {s:"campaign-reporting-agent",t:"competitive-intelligence-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"campaign-reporting-agent",t:"influencer-media-kit-agent",rel:"FALLBACK",strength:0.73,risk:"capability_overlap"},
  {s:"campaign-reporting-agent",t:"reputation-management-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"competitive-intelligence-agent",t:"brand-identity-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"competitive-intelligence-agent",t:"talent-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"contract-manager-agent",t:"brand-outreach-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"contract-manager-agent",t:"campaign-execution-agent",rel:"DEPENDS_ON",strength:0.91,risk:""},
  {s:"contract-manager-agent",t:"campaign-execution-agent",rel:"GATES",strength:0.91,risk:""},
  {s:"contract-manager-agent",t:"email-marketing-automation-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"contract-manager-agent",t:"legal-compliance-agent",rel:"DEPENDS_ON",strength:0.58,risk:""},
  {s:"deal-negotiator-agent",t:"contract-manager-agent",rel:"DEPENDS_ON",strength:0.92,risk:""},
  {s:"deal-negotiator-agent",t:"contract-manager-agent",rel:"REQUIRES",strength:0.92,risk:""},
  {s:"deal-negotiator-agent",t:"email-marketing-automation-agent",rel:"FALLBACK",strength:0.58,risk:"capability_overlap"},
  {s:"deal-negotiator-agent",t:"financial-manager-agent",rel:"FALLBACK",strength:0.58,risk:"capability_overlap"},
  {s:"deal-negotiator-agent",t:"personal-brand-architect-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"email-marketing-automation-agent",t:"financial-manager-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"email-marketing-automation-agent",t:"influencer-media-kit-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"financial-manager-agent",t:"brand-identity-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"financial-manager-agent",t:"competitive-intelligence-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"financial-manager-agent",t:"influencer-media-kit-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"influencer-niche-agent",t:"personal-brand-architect-agent",rel:"FALLBACK",strength:0.77,risk:"capability_overlap"},
  {s:"influencer-niche-agent",t:"platform-selection-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"personal-brand-architect-agent",t:"platform-selection-agent",rel:"FALLBACK",strength:0.77,risk:"capability_overlap"},
  {s:"platform-selection-agent",t:"yt-content-strategy-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"reputation-management-agent",t:"contract-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"reputation-management-agent",t:"yt-content-strategy-agent",rel:"FALLBACK",strength:0.58,risk:"capability_overlap"},
  {s:"talent-manager-agent",t:"brand-identity-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"task-agent-router",t:"campaign-execution-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"campaign-execution-agent",rel:"ROUTES_TO",strength:0.75,risk:""},
  {s:"task-agent-router",t:"legal-compliance-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"legal-compliance-agent",rel:"ROUTES_TO",strength:0.81,risk:""},
  {s:"yt-content-strategy-agent",t:"contract-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
