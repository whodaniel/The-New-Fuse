# Content Subgraph

Generated: 2026-03-03
Source: `agent-relationship-graph.json`

```mermaid
graph TD
  orchestrator_agent [orchestrator-agent] --> task_agent_router [task-agent-router]
  task_agent_router [task-agent-router] --> content_writer_agent [content-writer-agent]
  task_agent_router [task-agent-router] --> content_calendar_agent [content-calendar-agent]
  task_agent_router [task-agent-router] --> content_calendar_orchestrator_agent [content-calendar-orchestrator-agent]
  task_agent_router [task-agent-router] --> keyword_research_agent [keyword-research-agent]
  task_agent_router [task-agent-router] --> seo_optimizer_agent [seo-optimizer-agent]
  content_calendar_agent [content-calendar-agent] --> keyword_research_agent [keyword-research-agent]
  keyword_research_agent [keyword-research-agent] --> content_writer_agent [content-writer-agent]
  content_writer_agent [content-writer-agent] --> seo_optimizer_agent [seo-optimizer-agent]
  content_calendar_orchestrator_agent [content-calendar-orchestrator-agent] --> content_calendar_agent [content-calendar-agent]
```
