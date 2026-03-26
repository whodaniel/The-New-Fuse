# Social Subgraph

Generated: 2026-03-26
Source: `agent-relationship-graph.json`

```mermaid
graph TD
  audience_growth_agent [audience-growth-agent] --> community_manager_agent [community-manager-agent]
  audience_growth_agent [audience-growth-agent] --> facebook_strategy_agent [facebook-strategy-agent]
  community_engagement_agent [community-engagement-agent] --> community_manager_agent [community-manager-agent]
  community_engagement_agent [community-engagement-agent] --> instagram_strategy_agent [instagram-strategy-agent]
  community_manager_agent [community-manager-agent] --> social_selling_agent [social-selling-agent]
  community_manager_agent [community-manager-agent] --> traffic_generation_agent [traffic-generation-agent]
  content_repurposing_agent [content-repurposing-agent] --> tiktok_strategy_agent [tiktok-strategy-agent]
  facebook_strategy_agent [facebook-strategy-agent] --> instagram_strategy_agent [instagram-strategy-agent]
  facebook_strategy_agent [facebook-strategy-agent] --> social_selling_agent [social-selling-agent]
  facebook_strategy_agent [facebook-strategy-agent] --> tiktok_strategy_agent [tiktok-strategy-agent]
  instagram_strategy_agent [instagram-strategy-agent] --> community_manager_agent [community-manager-agent]
  instagram_strategy_agent [instagram-strategy-agent] --> tiktok_strategy_agent [tiktok-strategy-agent]
  instagram_strategy_agent [instagram-strategy-agent] --> x_strategy_agent [x-strategy-agent]
  orchestrator_agent [orchestrator-agent] --> content_calendar_orchestrator_agent [content-calendar-orchestrator-agent]
  orchestrator_agent [orchestrator-agent] --> content_calendar_orchestrator_agent [content-calendar-orchestrator-agent]
  orchestrator_agent [orchestrator-agent] --> task_agent_router [task-agent-router]
  scout_llm_opportunities [scout-llm-opportunities] --> social_selling_agent [social-selling-agent]
  scriptwriter_agent [scriptwriter-agent] --> tiktok_strategy_agent [tiktok-strategy-agent]
  task_agent_router [task-agent-router] --> audience_segmentation_agent [audience-segmentation-agent]
  task_agent_router [task-agent-router] --> community_engagement_agent [community-engagement-agent]
  task_agent_router [task-agent-router] --> content_calendar_orchestrator_agent [content-calendar-orchestrator-agent]
  task_agent_router [task-agent-router] --> content_repurposing_agent [content-repurposing-agent]
  tiktok_strategy_agent [tiktok-strategy-agent] --> x_strategy_agent [x-strategy-agent]
  traffic_generation_agent [traffic-generation-agent] --> scriptwriter_agent [scriptwriter-agent]
  traffic_generation_agent [traffic-generation-agent] --> x_strategy_agent [x-strategy-agent]
  x_strategy_agent [x-strategy-agent] --> audience_growth_agent [audience-growth-agent]
```
