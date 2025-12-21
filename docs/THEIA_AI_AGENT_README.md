# @fuse/theia-ai-agent

Advanced AI Agent system for Theia IDE with memory, flow orchestration, and code analysis.

**Ported from SkIDEancer's Windsurf-inspired AI platform.**

## Features

### 🤖 Agent Service with Memory

- **Short-term memory**: Session-based context retention
- **Long-term memory**: Persistent storage across sessions
- **Conversation history**: Full chat history with metadata
- **Tool registration**: Extensible tool system

### 🌊 AI Flow Service (Cascade Equivalent)

- **Graph-based execution**: DAG-based workflow orchestration
- **Topological sorting**: Automatic dependency resolution
- **Built-in steps**: LLM query, code analysis, transform, conditional, loop, merge
- **Cancellation support**: Cancel running flows

### 📊 Code Analysis Capability

- **LLM-powered analysis**: Deep code pattern detection
- **Security scanning**: XSS, SQL injection, hardcoded secrets
- **Code metrics**: Complexity, maintainability, testability, security
- **Auto-fix generation**: Suggested fixes with one-click apply

### 💡 Suggestion Processor

- **Context-aware completions**: Based on cursor position and code context
- **Multi-language support**: TypeScript, JavaScript, Python, Java, Go, Rust
- **Import detection**: Automatically suggest missing imports
- **Refactoring suggestions**: Convert promise chains, extract variables

## Directory Structure

```
packages/theia-ai-agent/
├── src/
│   ├── browser/                    # Frontend (browser) code
│   │   ├── ai-agent-frontend-module.ts
│   │   ├── ai-agent-view-contribution.ts
│   │   ├── ai-agent-widget.tsx
│   │   └── index.ts
│   ├── common/                     # Shared code
│   │   ├── types.ts                # All interfaces and types
│   │   ├── agent-service.ts        # Agent with memory
│   │   ├── ai-flow-service.ts      # Flow orchestration
│   │   ├── capabilities/
│   │   │   ├── code-analysis.ts
│   │   │   ├── suggestion-processor.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── node/                       # Backend (server) code
│       ├── ai-agent-backend-module.ts
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

### Open AI Agent Panel

```
Command Palette > AI Agent: Open Panel
```

### Analyze Current File

```
Command Palette > AI Agent: Analyze Current File
```

### Clear Memory

```
Command Palette > AI Agent: Clear Memory
```

## API Examples

### Using Agent Service

```typescript
import { AgentService } from "@fuse/theia-ai-agent";

// Process user input
const response = await agentService.process("analyze this code");

// Remember something
agentService.remember("userPreference", "dark-theme", "long");

// Recall later
const pref = agentService.recall("userPreference", "long");
```

### Using AI Flow Service

```typescript
import { AIFlowService, IAIFlowGraph } from "@fuse/theia-ai-agent";

// Define a flow
const flow: IAIFlowGraph = {
  id: "code-review",
  name: "Code Review Flow",
  nodes: [
    { id: "analyze", type: "code-analysis", data: { code: "..." } },
    { id: "llm", type: "llm-query", data: { prompt: "Review this..." } },
    { id: "merge", type: "merge", data: {} },
  ],
  edges: [
    { id: "e1", source: "analyze", target: "merge" },
    { id: "e2", source: "llm", target: "merge" },
  ],
};

// Execute flow
const result = await flowService.executeGraph(flow);
```

### Registering Custom Capability

```typescript
import { IAgentCapability } from "@fuse/theia-ai-agent";

const myCapability: IAgentCapability = {
  id: "myCustomCapability",
  name: "My Custom",
  description: "Does something custom",
  version: "1.0.0",
  provider: "MyCompany",
  execute: async (context) => {
    return {
      content: "Custom response",
      confidence: 0.9,
    };
  },
};

agentService.registerCapability(myCapability);
```

## License

MIT
