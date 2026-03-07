# News Scouting Skill

## Description

The capability to autonomously scrape, analyze, and synthesize AI-related news
and market data. This skill enables agents to act as "forward observers" for the
TNF ecosystem.

## Key Scripts

- `scripts/swarm/news-scout.cjs`: The primary scouting loop.
- `scripts/swarm/news-aggregator.cjs`: Synthesizes multiple scout reports into a
  single landscape view.

## Dependencies

- **Brave Search MCP**: For market-wide search queries.
- **Fetch/Puppeteer MCP**: For deep scraping of news articles.
- **Redis**: For task dispatching and state persistence.

## Workflow

1.  **Search**: Query for target terms (`WarpOS`, `agentic workflows`,
    `LLM benchmarks`).
2.  **Scrape**: Pull full text from top 5 relevant links.
3.  **Summarize**: Extract "The Gist", "The Threat Level", and "The
    Opportunity".
4.  **Task**: Convert opportunities into `Continuous Improvement` tasks.

## Usage

```bash
# Run a specific scan for competitor analysis
tnf run scout:scan --competitor "WarpOS"
```
