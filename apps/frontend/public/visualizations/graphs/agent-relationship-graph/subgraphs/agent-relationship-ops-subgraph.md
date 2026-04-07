# Ops Subgraph

Generated: 2026-04-07
Source: `agent-relationship-graph.json`

```mermaid
graph TD
  asset_sourcer_agent [asset-sourcer-agent] --> auth_blocker_sentinel [auth-blocker-sentinel]
  asset_sourcer_agent [asset-sourcer-agent] --> legal_compliance_agent [legal-compliance-agent]
  asset_sourcer_agent [asset-sourcer-agent] --> productivity_and_burnout_prevention_agent [productivity-and-burnout-prevention-agent]
  asset_sourcer_agent [asset-sourcer-agent] --> tax_compliance_agent [tax-compliance-agent]
  auth_blocker_sentinel [auth-blocker-sentinel] --> notes_ledger_investigator [notes-ledger-investigator]
  digital_asset_manager_agent [digital-asset-manager-agent] --> auth_blocker_sentinel [auth-blocker-sentinel]
  digital_asset_manager_agent [digital-asset-manager-agent] --> tax_compliance_agent [tax-compliance-agent]
  legal_compliance_agent [legal-compliance-agent] --> asset_sourcer_agent [asset-sourcer-agent]
  legal_compliance_agent [legal-compliance-agent] --> asset_sourcer_agent [asset-sourcer-agent]
  legal_compliance_agent [legal-compliance-agent] --> digital_asset_manager_agent [digital-asset-manager-agent]
  legal_compliance_agent [legal-compliance-agent] --> tax_compliance_agent [tax-compliance-agent]
  local_ai_claude_code_cli [local-ai-claude-code-cli] --> local_ai_gemini_cli [local-ai-gemini-cli]
  local_ai_claude_code_cli [local-ai-claude-code-cli] --> productivity_and_burnout_prevention_agent [productivity-and-burnout-prevention-agent]
  local_ai_gemini_cli [local-ai-gemini-cli] --> productivity_and_burnout_prevention_agent [productivity-and-burnout-prevention-agent]
  notes_ledger_investigator [notes-ledger-investigator] --> repo_lineage_investigator [repo-lineage-investigator]
  notes_ledger_investigator [notes-ledger-investigator] --> timeline_synthesis_investigator [timeline-synthesis-investigator]
  orchestrator_agent [orchestrator-agent] --> task_agent_router [task-agent-router]
  productivity_and_burnout_prevention_agent [productivity-and-burnout-prevention-agent] --> digital_asset_manager_agent [digital-asset-manager-agent]
  repo_lineage_investigator [repo-lineage-investigator] --> timeline_synthesis_investigator [timeline-synthesis-investigator]
  task_agent_router [task-agent-router] --> legal_compliance_agent [legal-compliance-agent]
  task_agent_router [task-agent-router] --> legal_compliance_agent [legal-compliance-agent]
  tax_compliance_agent [tax-compliance-agent] --> asset_sourcer_agent [asset-sourcer-agent]
  timeline_synthesis_investigator [timeline-synthesis-investigator] --> local_ai_gemini_cli [local-ai-gemini-cli]
```
