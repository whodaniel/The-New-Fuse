# Content Subgraph

Generated: 2026-03-26
Source: `agent-relationship-graph.json`

```mermaid
graph TD
  ad_network_manager_agent [ad-network-manager-agent] --> analytics_and_reporting_agent [analytics-and-reporting-agent]
  ad_network_manager_agent [ad-network-manager-agent] --> user_feedback_analysis_agent [user-feedback-analysis-agent]
  ad_network_manager_agent [ad-network-manager-agent] --> yt_niche_strategy_agent [yt-niche-strategy-agent]
  analytics_and_reporting_agent [analytics-and-reporting-agent] --> content_writer_agent [content-writer-agent]
  analytics_and_reporting_agent [analytics-and-reporting-agent] --> user_feedback_analysis_agent [user-feedback-analysis-agent]
  content_writer_agent [content-writer-agent] --> ad_network_manager_agent [ad-network-manager-agent]
  content_writer_agent [content-writer-agent] --> seo_optimizer_agent [seo-optimizer-agent]
  content_writer_agent [content-writer-agent] --> seo_optimizer_agent [seo-optimizer-agent]
  content_writer_agent [content-writer-agent] --> seo_optimizer_agent [seo-optimizer-agent]
  digital_product_creator_agent [digital-product-creator-agent] --> keyword_research_agent [keyword-research-agent]
  digital_product_creator_agent [digital-product-creator-agent] --> video_editor_agent [video-editor-agent]
  digital_product_factory_agent [digital-product-factory-agent] --> media_evidence_investigator [media-evidence-investigator]
  digital_product_factory_agent [digital-product-factory-agent] --> seo_optimizer_agent [seo-optimizer-agent]
  keyword_research_agent [keyword-research-agent] --> content_writer_agent [content-writer-agent]
  keyword_research_agent [keyword-research-agent] --> seo_optimizer_agent [seo-optimizer-agent]
  live_stream_manager_agent [live-stream-manager-agent] --> video_editor_agent [video-editor-agent]
  media_evidence_investigator [media-evidence-investigator] --> digital_product_creator_agent [digital-product-creator-agent]
  orchestrator_agent [orchestrator-agent] --> task_agent_router [task-agent-router]
  storyboard_artist_agent [storyboard-artist-agent] --> video_editor_agent [video-editor-agent]
  task_agent_router [task-agent-router] --> analytics_and_reporting_agent [analytics-and-reporting-agent]
  task_agent_router [task-agent-router] --> content_writer_agent [content-writer-agent]
  task_agent_router [task-agent-router] --> keyword_research_agent [keyword-research-agent]
  task_agent_router [task-agent-router] --> keyword_research_agent [keyword-research-agent]
  task_agent_router [task-agent-router] --> seo_optimizer_agent [seo-optimizer-agent]
  technical_setup_agent [technical-setup-agent] --> user_feedback_analysis_agent [user-feedback-analysis-agent]
  video_editor_agent [video-editor-agent] --> fan_funding_agent [fan-funding-agent]
  yt_niche_strategy_agent [yt-niche-strategy-agent] --> digital_product_factory_agent [digital-product-factory-agent]
```
