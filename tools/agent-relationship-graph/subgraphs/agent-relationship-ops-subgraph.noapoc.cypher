// Subgraph import for Neo4j (no APOC required)
CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:"orchestrator-agent",kind:"primary",cluster:"orchestration"},
  {id:"task-agent-router",kind:"primary",cluster:"orchestration"},
  {id:"asset-sourcer-agent",kind:"primary",cluster:"ops"},
  {id:"auth-blocker-sentinel",kind:"primary",cluster:"ops"},
  {id:"digital-asset-manager-agent",kind:"primary",cluster:"ops"},
  {id:"legal-compliance-agent",kind:"primary",cluster:"ops"},
  {id:"local-ai-claude-code-cli",kind:"sub",cluster:"ops"},
  {id:"local-ai-gemini-cli",kind:"sub",cluster:"ops"},
  {id:"notes-ledger-investigator",kind:"primary",cluster:"ops"},
  {id:"productivity-and-burnout-prevention-agent",kind:"sub",cluster:"ops"},
  {id:"repo-lineage-investigator",kind:"primary",cluster:"ops"},
  {id:"tax-compliance-agent",kind:"primary",cluster:"ops"},
  {id:"timeline-synthesis-investigator",kind:"sub",cluster:"ops"}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-26T09:23:34Z');

UNWIND [
  {s:"asset-sourcer-agent",t:"auth-blocker-sentinel",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"asset-sourcer-agent",t:"legal-compliance-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"asset-sourcer-agent",t:"productivity-and-burnout-prevention-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"asset-sourcer-agent",t:"tax-compliance-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"auth-blocker-sentinel",t:"notes-ledger-investigator",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"digital-asset-manager-agent",t:"auth-blocker-sentinel",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"digital-asset-manager-agent",t:"tax-compliance-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"legal-compliance-agent",t:"asset-sourcer-agent",rel:"DELEGATES",strength:0.89,risk:""},
  {s:"legal-compliance-agent",t:"asset-sourcer-agent",rel:"GOVERNS",strength:0.89,risk:""},
  {s:"legal-compliance-agent",t:"digital-asset-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"legal-compliance-agent",t:"tax-compliance-agent",rel:"FALLBACK",strength:0.64,risk:"capability_overlap"},
  {s:"local-ai-claude-code-cli",t:"local-ai-gemini-cli",rel:"FALLBACK",strength:0.95,risk:"capability_overlap"},
  {s:"local-ai-claude-code-cli",t:"productivity-and-burnout-prevention-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"local-ai-gemini-cli",t:"productivity-and-burnout-prevention-agent",rel:"FALLBACK",strength:0.68,risk:"capability_overlap"},
  {s:"notes-ledger-investigator",t:"repo-lineage-investigator",rel:"FALLBACK",strength:0.95,risk:"capability_overlap"},
  {s:"notes-ledger-investigator",t:"timeline-synthesis-investigator",rel:"FALLBACK",strength:0.95,risk:"capability_overlap"},
  {s:"orchestrator-agent",t:"task-agent-router",rel:"DELEGATES",strength:0.98,risk:""},
  {s:"productivity-and-burnout-prevention-agent",t:"digital-asset-manager-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"repo-lineage-investigator",t:"timeline-synthesis-investigator",rel:"FALLBACK",strength:0.95,risk:"capability_overlap"},
  {s:"task-agent-router",t:"legal-compliance-agent",rel:"DELEGATES",strength:0.82,risk:""},
  {s:"task-agent-router",t:"legal-compliance-agent",rel:"ROUTES_TO",strength:0.81,risk:""},
  {s:"tax-compliance-agent",t:"asset-sourcer-agent",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"},
  {s:"timeline-synthesis-investigator",t:"local-ai-gemini-cli",rel:"FALLBACK",strength:0.58,risk:"intra_cluster_fallback"}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk;
