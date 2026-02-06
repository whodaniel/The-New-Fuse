# Cloudflare Integration Guide

This guide details the setup and deployment of "The New Fuse" on Cloudflare.

## Components

1.  **Edge Worker (`apps/edge-worker`)**
    - **Protocol Bridge**: TNF Relay Protocol (WebSocket).
    - **MCP Server**: MCP Protocol (`/mcp`) exposing Tools & Skills.
    - **Stateful Agents**: Durable Objects (`AgentObject`).
    - **Relational Data**: D1 Database (`fuse-edge-db`).
    - **Async Jobs**: Cloudflare Queues (`fuse-background-jobs`).
    - **Scheduled Tasks**: Cron Triggers.
    - **Storage**: R2 (`fuse-artifacts-v1`), Vectorize (`fuse-agent-memory`).

## Edge Skills (New!)

The Edge Worker now exposes high-level "Skills" via MCP, which combine multiple primitive tools into powerful capabilities.

### Available Skills

| Skill | Description | Dependencies |
| :--- | :--- | :--- |
| `research_topic` | Plans research, scrapes sources, and synthesizes an answer using AI. | AI, Browser |
| `remember` | Embeds text and saves it to long-term vector memory. | AI, Vectorize |
| `recall` | Semantically searches long-term memory for relevant context. | AI, Vectorize |
| `generate_report` | Writes a markdown report using AI and saves it to cloud storage. | AI, R2 |

### Primitive Tools

| Tool | Description |
| :--- | :--- |
| `browser_scrape` | Scrapes a webpage using headless browser. |
| `browser_screenshot` | Takes a screenshot of a webpage. |
| `ai_inference` | Runs a raw LLM inference query. |

## Usage

Configure your local agent (or Claude Desktop) to use the Edge MCP Server:

```json
{
  "mcpServers": {
    "fuse-edge": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-http-client", "https://fuse-edge-worker.yourname.workers.dev/mcp"]
    }
  }
}
```

Now your local agents can say: *"Research the latest advancements in solid state batteries and save the report to the cloud"* and the Edge Worker will handle the entire complex workflow.
