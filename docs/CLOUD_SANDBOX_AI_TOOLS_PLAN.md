# TNF Cloud Sandbox: AI Tools Enhancement Plan

## Current Tools (12 total)

| Category       | Tools                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Browser**    | browser_navigate, browser_screenshot, browser_click, browser_type, browser_get_content, browser_evaluate, browser_wait |
| **Filesystem** | read_file, write_file, list_directory                                                                                  |
| **Shell**      | run_command                                                                                                            |
| **Utility**    | echo                                                                                                                   |

## Proposed LLM Tools (8 new)

### 1. llm_chat

```json
{
  "name": "llm_chat",
  "description": "Send a chat completion request to an LLM",
  "inputSchema": {
    "type": "object",
    "properties": {
      "provider": {
        "type": "string",
        "enum": ["openai", "anthropic", "gemini"],
        "default": "openai"
      },
      "model": { "type": "string", "default": "gpt-4" },
      "messages": { "type": "array", "items": { "type": "object" } },
      "system": { "type": "string", "description": "System prompt" },
      "temperature": { "type": "number", "default": 0.7 },
      "max_tokens": { "type": "integer", "default": 1000 }
    },
    "required": ["messages"]
  }
}
```

### 2. llm_embedding

```json
{
  "name": "llm_embedding",
  "description": "Generate text embeddings",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": { "type": "string" },
      "provider": { "type": "string", "default": "openai" },
      "model": { "type": "string", "default": "text-embedding-3-small" }
    },
    "required": ["text"]
  }
}
```

### 3. llm_function_call

```json
{
  "name": "llm_function_call",
  "description": "Execute LLM with function/tool calling capability",
  "inputSchema": {
    "type": "object",
    "properties": {
      "messages": { "type": "array" },
      "functions": { "type": "array", "description": "Available functions" },
      "auto_execute": { "type": "boolean", "default": true }
    },
    "required": ["messages", "functions"]
  }
}
```

### 4. llm_analyze_code

```json
{
  "name": "llm_analyze_code",
  "description": "Analyze code using AI",
  "inputSchema": {
    "type": "object",
    "properties": {
      "code": { "type": "string" },
      "language": { "type": "string" },
      "analysis_type": {
        "type": "string",
        "enum": ["review", "explain", "refactor", "security", "test"]
      }
    },
    "required": ["code"]
  }
}
```

### 5. llm_generate_code

```json
{
  "name": "llm_generate_code",
  "description": "Generate code from a description",
  "inputSchema": {
    "type": "object",
    "properties": {
      "description": { "type": "string" },
      "language": { "type": "string", "default": "typescript" },
      "context": { "type": "string", "description": "Existing code context" }
    },
    "required": ["description"]
  }
}
```

## Proposed Agent Tools (5 new)

### 6. agent_spawn

```json
{
  "name": "agent_spawn",
  "description": "Spawn a new agent with specific capabilities",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_type": {
        "type": "string",
        "enum": ["coder", "reviewer", "researcher", "coordinator"]
      },
      "task": { "type": "string" },
      "tools": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["agent_type", "task"]
  }
}
```

### 7. agent_message

```json
{
  "name": "agent_message",
  "description": "Send message to another agent via A2A protocol",
  "inputSchema": {
    "type": "object",
    "properties": {
      "to": { "type": "string", "description": "Target agent ID" },
      "message": { "type": "string" },
      "priority": {
        "type": "string",
        "enum": ["low", "normal", "high", "critical"]
      }
    },
    "required": ["to", "message"]
  }
}
```

### 8. agent_status

```json
{
  "name": "agent_status",
  "description": "Get status of all running agents",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_id": { "type": "string", "description": "Optional specific agent" }
    }
  }
}
```

## Proposed SkIDEancer/IDE Tools (4 new)

### 9. ide_open_file

```json
{
  "name": "ide_open_file",
  "description": "Open a file in the cloud IDE",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "line": { "type": "integer" }
    },
    "required": ["path"]
  }
}
```

### 10. ide_edit

```json
{
  "name": "ide_edit",
  "description": "Make edits to a file in the cloud IDE",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "edits": { "type": "array", "items": { "type": "object" } }
    },
    "required": ["path", "edits"]
  }
}
```

### 11. ide_run_terminal

```json
{
  "name": "ide_run_terminal",
  "description": "Execute command in IDE terminal",
  "inputSchema": {
    "type": "object",
    "properties": {
      "command": { "type": "string" },
      "terminal_id": { "type": "string" }
    },
    "required": ["command"]
  }
}
```

### 12. ide_search

```json
{
  "name": "ide_search",
  "description": "Search codebase in IDE",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "type": { "type": "string", "enum": ["text", "symbol", "file"] }
    },
    "required": ["query"]
  }
}
```

## Implementation Priority

### Phase 1 (Immediate)

1. llm_chat - Core LLM interaction
2. llm_generate_code - Code generation
3. llm_analyze_code - Code review

### Phase 2 (After SkIDEancer)

4. ide_open_file
5. ide_edit
6. ide_search

### Phase 3 (Agent Framework)

7. agent_spawn
8. agent_message
9. agent_status

### Phase 4 (Advanced)

10. llm_function_call
11. llm_embedding
12. ide_run_terminal

## Environment Variables Required

```bash
# In CloudRuntime cloud sandbox
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GEMINI_API_KEY=AIza...
```

## Total Tool Count After Enhancement: 29 Tools

- 7 Browser tools
- 3 Filesystem tools
- 1 Shell tool
- 1 Utility tool
- 5 LLM tools
- 5 Agent tools
- 4 IDE tools
- 3 Advanced tools
