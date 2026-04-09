# @the-new-fuse/ag-ui-core

AG-UI Protocol integration for The New Fuse - Connects AI agents to
self-contained visualization generation.

## Overview

This package implements Microsoft's AG-UI (Agent-User Interaction) protocol to
enable real-time communication between AI agents and The New Fuse platform, with
automatic generation of self-contained HTML visualizations.

## Features

✅ **AG-UI Protocol Compliance** - Full implementation of Microsoft's AG-UI
standard ✅ **WebSocket Communication** - Real-time bidirectional messaging ✅
**Self-Contained Visualizations** - Generate permanent HTML artifacts ✅
**NestJS Integration** - Seamless integration with The New Fuse backend ✅
**Session Management** - Track and manage agent sessions ✅ **Event-Driven
Architecture** - Listen to agent events ✅ **Extensible** - Easy to add custom
handlers

## Installation

```bash
pnpm add @the-new-fuse/ag-ui-core
```

## Usage

### With NestJS

```typescript
import { Module } from '@nestjs/common';
import { AGUIModule } from '@the-new-fuse/ag-ui-core';

@Module({
  imports: [AGUIModule],
})
export class AppModule {}
```

### Standalone

```typescript
import { AGUIOrchestrator } from '@the-new-fuse/ag-ui-core';

const orchestrator = new AGUIOrchestrator(8765);

// Listen to events
orchestrator.on('agent:connected', (session) => {
  console.log(`Agent connected: ${session.agentId}`);
});

orchestrator.on('visualization:generated', ({ filePath }) => {
  console.log(`Visualization created: ${filePath}`);
});

// Start server
orchestrator.start();
```

## AG-UI Protocol

### Message Format

All messages follow the AG-UI protocol specification:

```typescript
interface AGUIMessage {
  id: string;
  type: 'request' | 'response' | 'notification' | 'error';
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

### Built-in Methods

#### session.getState

Get session state variables.

**Request:**

```json
{
  "id": "1",
  "type": "request",
  "method": "session.getState",
  "params": { "key": "myVar" }
}
```

**Response:**

```json
{
  "id": "1",
  "type": "response",
  "result": { "value": "..." }
}
```

#### session.setState

Set session state variables.

**Request:**

```json
{
  "id": "2",
  "type": "request",
  "method": "session.setState",
  "params": { "key": "myVar", "value": "..." }
}
```

#### visualization.generate

Generate self-contained visualization.

**Request:**

```json
{
  "id": "3",
  "type": "request",
  "method": "visualization.generate",
  "params": {
    "type": "agent-flow",
    "data": { ... },
    "title": "Agent Communication Flow",
    "aiInsights": "<p>AI analysis here</p>"
  }
}
```

**Response:**

```json
{
  "id": "3",
  "type": "response",
  "result": {
    "success": true,
    "filePath": "/tmp/agent-flow-1234.html",
    "html": "<!DOCTYPE html>..."
  }
}
```

#### agent.getInfo

Get agent session information.

#### system.health

Get system health status.

## Custom Handlers

Register custom AG-UI methods:

```typescript
import { AGUIService } from '@the-new-fuse/ag-ui-core';

@Injectable()
export class MyService {
  constructor(private aguiService: AGUIService) {
    // Register custom handler
    this.aguiService.registerHandler('custom.analyze', async (params) => {
      // Your logic here
      return { result: 'analysis complete' };
    });
  }
}
```

## Visualization Types

Supported visualization types:

- `agent-flow` - Agent communication network graph
- `service-map` - Service architecture treemap
- `workflow-deps` - Workflow dependency graph
- `bundle-analysis` - Bundle size analysis
- `monitoring` - Real-time monitoring dashboard

## Programmatic Visualization Generation

Generate visualizations without WebSocket:

```typescript
import { AGUIService } from '@the-new-fuse/ag-ui-core';

@Injectable()
export class MyController {
  constructor(private aguiService: AGUIService) {}

  async generateReport() {
    const result = await this.aguiService.generateVisualization({
      type: 'agent-flow',
      data: {
        nodes: [...],
        edges: [...]
      },
      title: 'My Report',
      aiInsights: '<p>AI-generated insights</p>'
    });

    return result.filePath;
  }
}
```

## Events

Listen to orchestrator events:

```typescript
orchestrator.on('started', ({ port }) => {
  console.log(`AG-UI started on port ${port}`);
});

orchestrator.on('agent:connected', (session) => {
  console.log(`Agent ${session.agentId} connected`);
});

orchestrator.on('agent:disconnected', (session) => {
  console.log(`Agent ${session.agentId} disconnected`);
});

orchestrator.on('visualization:generated', ({ session, filePath }) => {
  console.log(`Visualization for ${session.agentId}: ${filePath}`);
});

orchestrator.on('error', ({ session, error }) => {
  console.error(`Error for ${session.agentId}:`, error);
});
```

## Statistics

Get service statistics:

```typescript
const stats = aguiService.getStatistics();
// {
//   totalSessions: 3,
//   activeAgents: 2,
//   oldestSession: 1234567890,
//   averageSessionAge: 45000,
//   uptime: 3600
// }
```

## Active Sessions

Get all active agent sessions:

```typescript
const sessions = aguiService.getActiveSessions();
// [
//   {
//     id: 'session-123',
//     agentId: 'my-agent',
//     createdAt: Date,
//     lastActivity: Date,
//     stateSize: 5
//   }
// ]
```

## Architecture

```
┌─────────────────────────────────────┐
│          AI Agent                    │
│  (Python, Node.js, etc.)            │
└────────────┬────────────────────────┘
             │ WebSocket (AG-UI Protocol)
             │
┌────────────▼────────────────────────┐
│      AGUIOrchestrator               │
│  • Message routing                  │
│  • Session management               │
│  • Event emission                   │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│   Visualization Generator           │
│  • D3.js embedded                   │
│  • Self-contained HTML              │
│  • Zero dependencies                │
└────────────┬────────────────────────┘
             │
             ▼
      permanent-viz.html
      (Shareable, offline-ready)
```

## Integration with The New Fuse

Add to your backend module:

```typescript
// apps/backend/src/app.module.ts
import { AGUIModule } from '@the-new-fuse/ag-ui-core';

@Module({
  imports: [
    // ... other imports
    AGUIModule,
  ],
})
export class AppModule {}
```

The AG-UI server will automatically start on port 8765 when the application
starts.

## Configuration

Environment variables:

```bash
AGUI_PORT=8765              # AG-UI WebSocket port
AGUI_ENABLE_LOGS=true       # Enable detailed logging
VIZ_OUTPUT_DIR=/tmp         # Directory for generated visualizations
```

## Example: Python Agent

See `examples/python-agent-example.py` for a complete working example:

```bash
cd packages/ag-ui-core/examples
pip install -r requirements.txt
python python-agent-example.py
```

Quick example:

```python
import asyncio
import websockets
import json

async def connect_to_agui():
    uri = "ws://localhost:8765"
    headers = {"X-Agent-Id": "my-python-agent"}

    async with websockets.connect(uri, extra_headers=headers) as ws:
        # Request visualization
        request = {
            "id": "1",
            "type": "request",
            "method": "visualization.generate",
            "params": {
                "type": "agent-flow",
                "data": {"nodes": [], "edges": []},
                "title": "My Analysis",
                "aiInsights": "<p>AI insights here</p>"
            }
        }

        await ws.send(json.dumps(request))
        response = await ws.recv()
        result = json.loads(response)

        print(f"Visualization created: {result['result']['filePath']}")

asyncio.run(connect_to_agui())
```

## Example: Node.js/TypeScript Agent

See `examples/nodejs-agent-example.ts` for a complete working example:

```bash
cd packages/ag-ui-core/examples
npm install
npm run node
```

## Benefits

- ✅ **Real-Time**: Live communication with agents
- ✅ **Permanent**: Self-contained HTML artifacts
- ✅ **Shareable**: Email, Slack, archive anywhere
- ✅ **Offline**: Works without internet
- ✅ **Compliant**: Follows AG-UI standard
- ✅ **Extensible**: Add custom methods easily

## License

MIT

## Links

- [AG-UI Protocol Specification](https://docs.ag-ui.com)
- [The New Fuse Documentation](../../../README.md)
- [Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/)
