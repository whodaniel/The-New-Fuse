// Agent relationship graph import for Neo4j (no APOC required)
// Generated: 2026-03-03

CREATE CONSTRAINT agent_id IF NOT EXISTS
FOR (a:Agent)
REQUIRE a.id IS UNIQUE;

UNWIND [
  {id:'orchestrator-agent',kind:'primary',cluster:'orchestration'},
  {id:'task-agent-router',kind:'primary',cluster:'orchestration'},
  {id:'inter-agentic-workflow-definer',kind:'primary',cluster:'orchestration'},
  {id:'interoperability-protocol-agent',kind:'primary',cluster:'orchestration'},
  {id:'agent-registry-manager',kind:'primary',cluster:'orchestration'},
  {id:'agent-relationship-grapher',kind:'primary',cluster:'orchestration'},
  {id:'agent-search-engine',kind:'sub',cluster:'orchestration'},
  {id:'agent-tagger',kind:'sub',cluster:'orchestration'},
  {id:'content-writer-agent',kind:'sub',cluster:'content'},
  {id:'content-calendar-agent',kind:'sub',cluster:'content'},
  {id:'content-calendar-orchestrator-agent',kind:'primary',cluster:'content'},
  {id:'keyword-research-agent',kind:'sub',cluster:'seo'},
  {id:'seo-optimizer-agent',kind:'sub',cluster:'seo'},
  {id:'technical-seo-auditor-agent',kind:'sub',cluster:'seo'},
  {id:'cro-process-agent',kind:'primary',cluster:'funnel'},
  {id:'ab-testing-optimizer-agent',kind:'sub',cluster:'funnel'},
  {id:'cognitive-bias-optimizer-agent',kind:'sub',cluster:'funnel'},
  {id:'podcast-promotion-agent',kind:'sub',cluster:'podcast'},
  {id:'campaign-execution-agent',kind:'primary',cluster:'brand'},
  {id:'campaign-reporting-agent',kind:'sub',cluster:'brand'},
  {id:'legal-compliance-agent',kind:'primary',cluster:'ops'},
  {id:'analytics-and-reporting-agent',kind:'primary',cluster:'ops'},
  {id:'affiliate-link-manager-agent',kind:'sub',cluster:'ops'},
  {id:'asset-sourcer-agent',kind:'sub',cluster:'ops'},
  {id:'visual-asset-creator-agent',kind:'sub',cluster:'ops'}
] AS row
MERGE (a:Agent {id: row.id})
SET a.kind = row.kind,
    a.cluster = row.cluster,
    a.updatedAt = datetime('2026-03-03T00:00:00Z');

UNWIND [
  {s:'orchestrator-agent',t:'task-agent-router',rel:'DELEGATES',strength:0.98},
  {s:'orchestrator-agent',t:'agent-registry-manager',rel:'DELEGATES',strength:0.86},
  {s:'orchestrator-agent',t:'agent-relationship-grapher',rel:'DELEGATES',strength:0.83},
  {s:'orchestrator-agent',t:'agent-search-engine',rel:'DELEGATES',strength:0.79},
  {s:'orchestrator-agent',t:'agent-tagger',rel:'DELEGATES',strength:0.79},
  {s:'task-agent-router',t:'content-calendar-agent',rel:'ROUTES_TO',strength:0.74},
  {s:'task-agent-router',t:'content-calendar-orchestrator-agent',rel:'ROUTES_TO',strength:0.80},
  {s:'task-agent-router',t:'keyword-research-agent',rel:'ROUTES_TO',strength:0.73},
  {s:'task-agent-router',t:'seo-optimizer-agent',rel:'ROUTES_TO',strength:0.73},
  {s:'task-agent-router',t:'technical-seo-auditor-agent',rel:'ROUTES_TO',strength:0.68},
  {s:'task-agent-router',t:'cro-process-agent',rel:'ROUTES_TO',strength:0.77},
  {s:'task-agent-router',t:'campaign-execution-agent',rel:'ROUTES_TO',strength:0.75},
  {s:'task-agent-router',t:'legal-compliance-agent',rel:'ROUTES_TO',strength:0.81},
  {s:'content-calendar-agent',t:'keyword-research-agent',rel:'DEPENDS_ON',strength:0.86},
  {s:'keyword-research-agent',t:'content-writer-agent',rel:'FEEDS',strength:0.88},
  {s:'content-writer-agent',t:'seo-optimizer-agent',rel:'HANDOFF',strength:0.91},
  {s:'seo-optimizer-agent',t:'technical-seo-auditor-agent',rel:'VALIDATED_BY',strength:0.79},
  {s:'cro-process-agent',t:'ab-testing-optimizer-agent',rel:'ORCHESTRATES',strength:0.92},
  {s:'cro-process-agent',t:'cognitive-bias-optimizer-agent',rel:'ORCHESTRATES',strength:0.83},
  {s:'ab-testing-optimizer-agent',t:'analytics-and-reporting-agent',rel:'MEASURED_BY',strength:0.89},
  {s:'cognitive-bias-optimizer-agent',t:'analytics-and-reporting-agent',rel:'MEASURED_BY',strength:0.82},
  {s:'campaign-execution-agent',t:'campaign-reporting-agent',rel:'HANDOFF',strength:0.88},
  {s:'legal-compliance-agent',t:'affiliate-link-manager-agent',rel:'GOVERNS',strength:0.90},
  {s:'legal-compliance-agent',t:'asset-sourcer-agent',rel:'GOVERNS',strength:0.89},
  {s:'asset-sourcer-agent',t:'visual-asset-creator-agent',rel:'SUPPLIES',strength:0.82},
  {s:'agent-registry-manager',t:'agent-search-engine',rel:'INDEXES_FOR',strength:0.80},
  {s:'agent-tagger',t:'agent-search-engine',rel:'ENRICHES',strength:0.86},
  {s:'content-calendar-orchestrator-agent',t:'content-calendar-agent',rel:'OVERLAPS_WITH',strength:0.63,risk:'coordination_conflict'}
] AS r
MATCH (a:Agent {id: r.s})
MATCH (b:Agent {id: r.t})
MERGE (a)-[rel:RELATED {relationType: r.rel}]->(b)
SET rel.strength = r.strength,
    rel.risk = r.risk,
    rel.updatedAt = datetime('2026-03-03T00:00:00Z');
