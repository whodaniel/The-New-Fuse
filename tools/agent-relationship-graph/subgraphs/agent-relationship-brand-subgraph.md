# Brand Subgraph

Generated: 2026-03-03
Source: `agent-relationship-graph.json`

```mermaid
graph TD
  orchestrator_agent [orchestrator-agent] --> task_agent_router [task-agent-router]
  task_agent_router [task-agent-router] --> campaign_execution_agent [campaign-execution-agent]
  task_agent_router [task-agent-router] --> legal_compliance_agent [legal-compliance-agent]
  brand_prospecting_agent [brand-prospecting-agent] --> brand_outreach_agent [brand-outreach-agent]
  brand_outreach_agent [brand-outreach-agent] --> deal_negotiator_agent [deal-negotiator-agent]
  deal_negotiator_agent [deal-negotiator-agent] --> contract_manager_agent [contract-manager-agent]
  contract_manager_agent [contract-manager-agent] --> campaign_execution_agent [campaign-execution-agent]
  campaign_execution_agent [campaign-execution-agent] --> campaign_reporting_agent [campaign-reporting-agent]
```
