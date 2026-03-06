# Podcast Subgraph

Generated: 2026-03-03
Source: `agent-relationship-graph.json`

```mermaid
graph TD
  orchestrator_agent [orchestrator-agent] --> task_agent_router [task-agent-router]
  task_agent_router [task-agent-router] --> podcast_promotion_agent [podcast-promotion-agent]
  podcast_niche_analyst_agent [podcast-niche-analyst-agent] --> podcast_format_designer_agent [podcast-format-designer-agent]
  podcast_format_designer_agent [podcast-format-designer-agent] --> podcast_hosting_setup_agent [podcast-hosting-setup-agent]
  podcast_hosting_setup_agent [podcast-hosting-setup-agent] --> podcast_distribution_agent [podcast-distribution-agent]
  podcast_distribution_agent [podcast-distribution-agent] --> podcast_promotion_agent [podcast-promotion-agent]
  podcast_promotion_agent [podcast-promotion-agent] --> podcast_analytics_agent [podcast-analytics-agent]
```
