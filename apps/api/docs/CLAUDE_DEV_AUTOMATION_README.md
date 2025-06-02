# Claude Dev Automation System

This document describes the Claude Dev automation system integrated into The New Fuse API server.

## Overview

The Claude Dev automation system provides AI-powered automation capabilities for development tasks, including:

- Code review and analysis
- API documentation generation  
- Unit test creation
- Data analysis and insights
- Custom automation templates

## Components

### 1. ClaudeDevAutomationService
Core service that manages automation templates and execution.

### 2. ClaudeDevAutomationController
REST API endpoints for managing automations.

### 3. ClaudeDevAutomationModule
NestJS module that wires everything together.

### 4. TNFClaudeDevMCPServer
MCP (Model Context Protocol) server for Claude integration.

### 5. CLI Tool
Command-line interface for interacting with the automation system.

## API Endpoints

- `GET /api/claude-dev/templates` - List templates
- `GET /api/claude-dev/templates/:id` - Get template details
- `POST /api/claude-dev/automations` - Execute automation
- `GET /api/claude-dev/automations` - List automations
- `GET /api/claude-dev/automations/:id` - Get automation result
- `PUT /api/claude-dev/automations/:id/cancel` - Cancel automation
- `GET /api/claude-dev/stats` - Usage statistics

## CLI Usage

```bash
# From the API directory
cd apps/api

# List templates
yarn claude-dev templates

# Execute automation
yarn claude-dev run code-review params.json

# Check automation status
yarn claude-dev get <automation-id>

# View statistics
yarn claude-dev stats
```

## Configuration

Set these environment variables in `apps/api/.env`:

```
CLAUDE_DEV_ENABLED=true
CLAUDE_DEV_API_KEY=your_anthropic_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Templates

The system comes with built-in templates for:

- **code-review**: Automated code review with suggestions
- **api-documentation**: Generate API documentation
- **test-generation**: Create unit tests
- **data-analysis**: Analyze datasets and generate insights

## Custom Templates

You can create custom templates via the API or CLI with:

- Custom prompts with parameter placeholders
- Parameter validation rules
- Output format specifications
- Token estimation

## Security

- API authentication via bearer tokens
- User-scoped automation access
- Input validation and sanitization
- Rate limiting (configure as needed)

## Monitoring

- Usage statistics and metrics
- Error tracking and logging
- Performance monitoring
- Cost tracking

