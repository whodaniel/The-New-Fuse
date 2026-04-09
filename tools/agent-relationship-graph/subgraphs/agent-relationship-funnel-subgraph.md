# Funnel Subgraph

Generated: 2026-03-12 Source: `agent-relationship-graph.json`

```mermaid
graph TD
  orchestrator_agent [orchestrator-agent] --> task_agent_router [task-agent-router]
  task_agent_router [task-agent-router] --> cro_process_agent [cro-process-agent]
  cro_process_agent [cro-process-agent] --> ab_testing_optimizer_agent [ab-testing-optimizer-agent]
  cro_process_agent [cro-process-agent] --> cognitive_bias_optimizer_agent [cognitive-bias-optimizer-agent]
  ab_testing_optimizer_agent [ab-testing-optimizer-agent] --> analytics_and_reporting_agent [analytics-and-reporting-agent]
  cognitive_bias_optimizer_agent [cognitive-bias-optimizer-agent] --> analytics_and_reporting_agent [analytics-and-reporting-agent]
```
