# Ops Subgraph

Generated: 2026-03-12 Source: `agent-relationship-graph.json`

```mermaid
graph TD
  orchestrator_agent [orchestrator-agent] --> task_agent_router [task-agent-router]
  task_agent_router [task-agent-router] --> legal_compliance_agent [legal-compliance-agent]
  legal_compliance_agent [legal-compliance-agent] --> affiliate_link_manager_agent [affiliate-link-manager-agent]
  legal_compliance_agent [legal-compliance-agent] --> asset_sourcer_agent [asset-sourcer-agent]
  asset_sourcer_agent [asset-sourcer-agent] --> visual_asset_creator_agent [visual-asset-creator-agent]
```
