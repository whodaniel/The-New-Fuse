---
description: Search and discover resources from the Resource Registry
---

# Resource Search Command

You are helping the user search for resources in The New Fuse Resource Registry.

## Available Resource Categories:
- CLAUDE_SKILL - Claude AI Skills
- N8N_WORKFLOW - n8n Workflow templates
- AGENT_TEMPLATE - Agent configuration templates
- CODE_SNIPPET - Reusable code snippets
- DOCUMENTATION - Documentation resources
- TOOL - Tools and utilities
- INTEGRATION - External integrations
- WORKFLOW_TEMPLATE - Generic workflow templates
- API_ENDPOINT - API endpoint definitions
- DATABASE_SCHEMA - Database schema definitions
- UI_COMPONENT - UI component templates
- CONFIGURATION - Configuration files
- SCRIPT - Automation scripts
- PROMPT_TEMPLATE - LLM prompt templates
- DATA_SOURCE - Data source connectors

## Search Options:
1. Parse the user's query to extract:
   - Search terms (keywords, names, descriptions)
   - Categories to filter by
   - Tags to filter by
   - Visibility preferences (public, agents-only, private)
   - Verification status (verified resources only)
   - Featured resources only

2. Use the Resource Registry API to search:
   - Endpoint: GET /api/resources
   - Query parameters: query, category, type, tags, visibility, isVerified, isFeatured, page, limit

3. Display results in a clear, organized format:
   - Resource name and description
   - Category and type
   - Version
   - Tags and keywords
   - Usage count and download count
   - Verification status

4. For each result, offer to:
   - View full details
   - Download the resource
   - View version history
   - See related resources

## Example Usage:
```
User: /resource-search claude skills for data processing
You: [Search for resources with query="data processing" and category="CLAUDE_SKILL"]

User: /resource-search n8n workflows verified
You: [Search for resources with category="N8N_WORKFLOW" and isVerified=true]

User: /resource-search api integrations
You: [Search for resources with query="api" and category="INTEGRATION"]
```

## Instructions:
1. Parse the user's search request
2. Build the appropriate API query
3. Call the Resource Registry API
4. Format and present the results
5. Offer relevant follow-up actions

Now, help the user search for resources based on their request.
