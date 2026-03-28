// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"content-calendar-orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"content-writer-agent",kind:"primary",cluster:"content"},
  {id:"content-calendar-agent",kind:"primary",cluster:"seo"},
  {id:"content-refresh-agent",kind:"primary",cluster:"seo"},
  {id:"keyword-research-agent",kind:"primary",cluster:"seo"},
  {id:"link-building-agent",kind:"primary",cluster:"seo"},
  {id:"seo-optimizer-agent",kind:"primary",cluster:"seo"},
  {id:"technical-seo-auditor-agent",kind:"primary",cluster:"seo"},
  {id:"yt-seo-optimizer-agent",kind:"primary",cluster:"seo"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-26T09:23:34Z');

UNWIND [
  {s:"content-calendar-agent",t:"content-writer-agent",rel:"DEPENDS_ON",strength:0.58,risk:""},
  {s:"content-calendar-agent",t:"keyword-research-agent",rel:"DEPENDS_ON",strength:0.86,risk:""},
  {s:"content-calendar-agent",t:"seo-optimizer-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"content-calendar-agent",t:"technical-seo-auditor-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"content-calendar-orchestrator-agent",t:"content-calendar-agent",rel:"OVERLAPS_WITH",strength:0.63,risk:"coordination_conflict"},
  {s:"content-refresh-agent",t:"keyword-research-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"content-refresh-agent",t:"yt-seo-optimizer-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"content-writer-agent",t:"link-building-agent",rel:"DEPENDS_ON",strength:0.73,risk:""},
  {s:"content-writer-agent",t:"seo-optimizer-agent",rel:"DEPENDS_ON",strength:0.77,risk:""},
  {s:"content-writer-agent",t:"seo-optimizer-agent",rel:"FEEDS",strength:0.91,risk:""},
  {s:"content-writer-agent",t:"seo-optimizer-agent",rel:"HANDOFF",strength:0.91,risk:""},
  {s:"keyword-research-agent",t:"content-writer-agent",rel:"FEEDS",strength:0.88,risk:""},
  {s:"keyword-research-agent",t:"link-building-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"keyword-research-agent",t:"seo-optimizer-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"link-building-agent",t:"content-refresh-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"orchestrator-agent",t:"content-calendar-orchestrator-agent",rel:"DELEGATES",strength:0.86,risk:""},
  {s:"orchestrator-agent",t:"content-calendar-orchestrator-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"seo-optimizer-agent",t:"content-calendar-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"seo-optimizer-agent",t:"technical-seo-auditor-agent",rel:"DEPENDS_ON",strength:0.79,risk:""},
  {s:"seo-optimizer-agent",t:"technical-seo-auditor-agent",rel:"VALIDATED_BY",strength:0.79,risk:""},
  {s:"task-agent-router",t:"content-calendar-agent",rel:"ROUTES_TO",strength:0.74,risk:""},
  {s:"task-agent-router",t:"content-calendar-orchestrator-agent",rel:"ROUTES_TO",strength:0.8,risk:""},
  {s:"task-agent-router",t:"content-writer-agent",rel:"ROUTES_TO",strength:0.72,risk:""},
  {s:"task-agent-router",t:"keyword-research-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"keyword-research-agent",rel:"ROUTES_TO",strength:0.73,risk:""},
  {s:"task-agent-router",t:"seo-optimizer-agent",rel:"ROUTES_TO",strength:0.73,risk:""},
  {s:"task-agent-router",t:"technical-seo-auditor-agent",rel:"ROUTES_TO",strength:0.68,risk:""},
  {s:"technical-seo-auditor-agent",t:"content-calendar-agent",rel:"FEEDBACK",strength:0.71,risk:""},
  {s:"technical-seo-auditor-agent",t:"link-building-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"technical-seo-auditor-agent",t:"yt-seo-optimizer-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"yt-seo-optimizer-agent",t:"link-building-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
