# Tool Discovery Protocol Implementation

**The New Fuse VSCode Extension v9.1.0+**

This document describes the implementation of Anthropic's Tool Discovery
Protocol in The New Fuse, enabling dynamic tool loading to reduce token usage
and improve tool selection accuracy.

## Overview

The Tool Discovery Protocol solves two critical challenges when working with
large tool libraries:

1. **Context Efficiency**: Tool definitions can consume massive portions of the
   context window (50 tools ≈ 10-20K tokens).
2. **Tool Selection Accuracy**: Claude's ability to correctly select tools
   degrades significantly with more than 30-50 tools.

## How It Works

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Active Tools      │────▶│    Claude Request    │────▶│  Anthropic API  │
│   (Non-deferred)    │     │   + Beta Headers     │     │                 │
└─────────────────────┘     └──────────────────────┘     └─────────────────┘
                                      │                          │
┌─────────────────────┐               │                          │
│   Deferred Tools    │               ▼                          ▼
│   (Lazy Loaded)     │     ┌──────────────────────┐     ┌─────────────────┐
│                     │◀────│  Tool Search Result  │◀────│  tool_search_*  │
└─────────────────────┘     │  (tool_references)   │     │    calls        │
                            └──────────────────────┘     └─────────────────┘
```

### Flow

1. **Initial Request**: Only active (non-deferred) tools are sent to Claude.
2. **Tool Search**: If Claude needs additional tools, it calls
   `tool_search_tool_*`.
3. **Discovery**: The search returns `tool_reference` blocks pointing to
   relevant tools.
4. **Loading**: Referenced tools are loaded from deferred to active.
5. **Execution**: Claude can now use the discovered tools.

## Implementation Files

| File                                       | Purpose                                     |
| ------------------------------------------ | ------------------------------------------- |
| `src/services/ToolSearchService.ts`        | BM25 + regex search, tool indexing          |
| `src/services/AIService.ts`                | Beta headers, defer_loading in requests     |
| `src/services/MCPService.ts`               | Tool deferral, on-demand loading            |
| `src/services/ToolOrchestrationService.ts` | Search integration, tool_reference handling |
| `src/core/types.ts`                        | Type definitions for protocol               |
| `src/core/config.ts`                       | Configuration management                    |

## Configuration

### VSCode Settings

```json
{
  "theNewFuse.toolSearch.enabled": true,
  "theNewFuse.toolSearch.maxResults": 5,
  "theNewFuse.toolSearch.defaultMethod": "bm25",
  "theNewFuse.toolSearch.alwaysLoadedTools": [
    "read_file",
    "write_file",
    "list_directory",
    "search_files"
  ],
  "theNewFuse.toolSearch.deferredCategories": [
    "google",
    "automation",
    "external",
    "database"
  ]
}
```

### MCP Server Configuration

```json
{
  "theNewFuse.mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
      "enabled": true,
      "default_defer_loading": false,
      "always_loaded_tools": ["read_file", "write_file"]
    },
    {
      "name": "google-drive",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-google-drive"],
      "enabled": true,
      "default_defer_loading": true
    }
  ]
}
```

## Search Algorithms

### BM25 (Recommended)

Best for natural language queries. Uses relevance ranking based on term
frequency and inverse document frequency.

```typescript
// Example: Claude searches for tools
const result = searchService.searchByBM25('send a message to slack');
// Returns: [slack_send_message, slack_post_reaction, ...]
```

### Regex

Best for exact pattern matching when you know the tool name format.

```typescript
// Example: Claude searches for tools
const result = searchService.searchByRegex('slack_.*');
// Returns: [slack_send_message, slack_read_channel, ...]
```

## API Integration

### Beta Headers

When tool search is enabled, the following headers are added to Anthropic API
requests:

```
anthropic-beta: advanced-tool-use-2025-11-20,mcp-client-2025-11-20
```

### Tool Definition Format

Tools sent to the API include the `defer_loading` flag:

```json
{
  "name": "read_file",
  "description": "Read file contents",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" }
    },
    "required": ["path"]
  },
  "defer_loading": false
}
```

### Response Handling

The implementation handles these new response types:

- `server_tool_use`: Server-side tool search invocation
- `tool_search_tool_result`: Search results with `tool_reference` blocks

## Type Definitions

```typescript
// Tool with deferral support
interface MCPTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  defer_loading?: boolean; // Lazy load via search
  always_load?: boolean; // Never defer
  category?: string; // For filtering
  keywords?: string[]; // For BM25 indexing
}

// Search configuration
interface ToolSearchConfig {
  enabled: boolean;
  maxResults: number;
  defaultMethod: 'regex' | 'bm25';
  alwaysLoadedTools: string[];
  deferredCategories: string[];
}

// Search result
interface ToolSearchResult {
  tools: ToolDefinition[];
  search_query: string;
  search_method: 'regex' | 'bm25';
  total_available: number;
  processing_time_ms: number;
}
```

## Performance Metrics

| Metric                 | Before      | After      | Improvement    |
| ---------------------- | ----------- | ---------- | -------------- |
| Token Usage (50 tools) | ~15K tokens | ~2K tokens | ~85% reduction |
| Opus 4 Accuracy        | 49%         | 74%        | +25%           |
| Opus 4.5 Accuracy      | 79.5%       | 88.1%      | +8.6%          |
| Max Supported Tools    | ~50         | 10,000+    | 200x           |

## Best Practices

### Which Tools to Defer

**Always Load (defer_loading: false):**

- Frequently used tools (read_file, write_file, etc.)
- Core filesystem operations
- Essential debugging tools

**Defer (defer_loading: true):**

- External API integrations (Google, Slack, GitHub)
- Database operations
- Browser automation
- Specialized domain tools

### Optimal Configuration

1. Keep 3-5 most frequently used tools as non-deferred
2. Defer tools from external services
3. Use BM25 for natural language discovery
4. Use regex when you know exact tool patterns

## Troubleshooting

| Issue                     | Solution                                        |
| ------------------------- | ----------------------------------------------- |
| Tools not being deferred  | Check `default_defer_loading` on server config  |
| Search returns no results | Verify tools are indexed; check search pattern  |
| Beta headers not added    | Ensure `enableToolSearch: true` in request      |
| Tool reference not found  | Tool may not be in deferred set; check spelling |

## External References

- [Anthropic Tool Search Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [Scaling MCP Tools Guide](https://unified.to/blog/scaling_mcp_tools_with_anthropic_defer_loading)
