---
description: Search and discover n8n workflows from community repositories
---

# N8N Workflow Search

Search through thousands of n8n workflows from community repositories.

## Usage

You can use this command to search for n8n workflows by:
- **Query**: Search by name, description, or tags
- **Category**: Filter by workflow category (ai-agents, automation, api-integrations, etc.)
- **Complexity**: Filter by complexity level (simple, medium, complex)
- **Tags**: Filter by specific tags

## Examples

1. **Search for AI workflows:**
   - Query: "Search for AI and agent automation workflows"
   - Category: `ai-agents`

2. **Search for simple automation:**
   - Query: "Find simple email automation workflows"
   - Complexity: `simple`
   - Category: `email`

3. **Search by specific service:**
   - Query: "Workflows that use Slack and Gmail"

## Available Categories

- **ai-agents**: AI models, LLMs, and agent automation
- **api-integrations**: Third-party API integrations (Gmail, Slack, GitHub, etc.)
- **automation**: General automation and scheduled tasks
- **data-processing**: Data transformation and ETL workflows
- **database-operations**: Database queries and operations
- **file-management**: File uploads, downloads, and storage
- **notifications**: Alerts, emails, and notifications
- **webhooks**: Webhook handlers and triggers
- **crm**: CRM and sales automation
- **email**: Email automation
- **social-media**: Social media automation
- **analytics**: Analytics and reporting
- **DevOps**: DevOps and CI/CD workflows
- **security**: Security and monitoring

## Task

Based on the user's request:
1. Identify the search criteria (query, category, tags, complexity)
2. Make a request to `/api/workflows/n8n` with appropriate query parameters
3. Present the results in a clear, organized format
4. Highlight the most relevant workflows
5. Provide the workflow ID and a summary for each result
6. Suggest similar or related workflows if appropriate

Remember to format the response in a user-friendly way with:
- Workflow names and descriptions
- Categories and tags
- Complexity level
- Source repository
- Number of nodes in the workflow
- Required credentials/services
