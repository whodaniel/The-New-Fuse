# TNF Log-to-DOM Protocol

**AI Observability Bridge for TNF Pages**

## Overview

The TNF Log-to-DOM protocol enables supervising AIs to read internal agent logs
from TNF pages in real-time without requiring DevTools access. This solves the
fundamental "black box" problem where browser-based agents are invisible to
orchestration layers.

### Problem Statement

Traditional browser console logs are hidden inside the browser's DevTools -
invisible to any external AI or monitoring system. When running agents on TNF
pages:

- Supervising AIs cannot see agent state
- Heartbeats for liability monitoring require backend infrastructure
- Debugging requires manual copy/paste from DevTools

### Solution

The Log-to-DOM protocol routes logs to a hidden DOM element (`#tnf-ai-monitor`)
that:

1. Stores log entries as text in the page's HTML tree
2. Is invisible to end-users but readable by AIs with DOM access
3. Provides "heartbeat" signaling for liability monitoring
4. Auto-initializes when using the TNF `Layout` component

## Primitives

### useTNFLogger Hook

Provides logging utilities for agent components:

```typescript
import { useTNFLogger } from '@the-new-fuse/ui-consolidated';

const AgentComponent = () => {
  const { log, info, warn, error, debug, heartbeat, getRecentLogs } =
    useTNFLogger({
      agentId: 'my-agent-name',
      maxLogs: 50,
    });

  // Log at different levels
  info('Agent started', { version: '1.0.0' });
  warn('High memory usage', { usage: '85%' });
  error('Connection failed', { host: 'localhost', port: 6379 });
  debug('Processing message', { queueSize: 10 });

  // Heartbeat for liability monitoring
  useEffect(() => {
    const interval = setInterval(() => heartbeat({ active: true }), 5000);
    return () => clearInterval(interval);
  }, []);

  // Retrieve recent logs for debugging
  const recent = getRecentLogs();
};
```

### Hook API

| Method                      | Description                           |
| --------------------------- | ------------------------------------- |
| log(message, data?, level?) | Log with custom level (default: info) |
| info(message, data?)        | Log info level                        |
| warn(message, data?)        | Log warning level                     |
| error(message, data?)       | Log error level                       |
| debug(message, data?)       | Log debug level                       |
| heartbeat(metadata?)        | Emit heartbeat signal                 |
| getRecentLogs()             | Get array of recent log entries       |

### Utilities

```typescript
import {
  readTNFAIMonitor,
  getTNFMonitorState,
} from '@the-new-fuse/ui-consolidated';

// Read full monitor content as text
const monitorContent = readTNFAIMonitor();
// Output: "[2026-04-24T10:00:00Z] [MY-AGENT] [INFO] Agent started..."

// Get heartbeat status
const state = getTNFMonitorState();
// Returns: { isAccessible: true, lastHeartbeat: "2026-04-24T10:00:00Z", agentId: "my-agent-name" }
```

### TNFMonitorState Interface

```typescript
interface TNFMonitorState {
  isAccessible: boolean; // Monitor exists and has content
  lastHeartbeat: string | null; // ISO timestamp of last heartbeat
  agentId: string | null; // Agent that sent last heartbeat
}

interface TNFLogEntry {
  timestamp: string; // ISO 8601
  agentId: string; // Agent identifier
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown; // Optional metadata object
}
```

## Usage Scenarios

### Scenario A: Real-Time Agent Logging

A Redis Synaptic Bus component logs all message activity:

```tsx
import { useTNFLogger } from '@the-new-fuse/ui-consolidated';

const RedisSynapticBus = () => {
  const { log, error } = useTNFLogger({ agentId: 'redis-synaptic-bus' });

  const handleMessage = async (message) => {
    log('Processing message', { id: message.id, type: message.type });

    try {
      await processMessage(message);
      log('Message processed successfully', { id: message.id });
    } catch (err) {
      error('Message processing failed', {
        id: message.id,
        error: err.message,
      });
    }
  };
};
```

### Scenario B: Liability Heartbeat

Agents emit heartbeats for liability tracking:

```tsx
import { useTNFLogger } from '@the-new-fuse/ui-consolidated';

const AgentLifecycle = ({ agentId }) => {
  const { heartbeat } = useTNFLogger({ agentId });

  useEffect(() => {
    const interval = setInterval(() => {
      heartbeat({ status: 'alive', tasksProcessed: taskCount });
    }, 5000);

    return () => clearInterval(interval);
  }, []);
};
```

If the heartbeat stops, the supervising AI knows the agent has "flatlined" -
critical for liability monitoring.

### Scenario C: Cross-AI State Inspection

Any supervising AI can read agent state from the DOM:

```javascript
// Read from any TNF page
const monitor = document.getElementById('tnf-ai-monitor');
console.log(monitor.textContent);

// Check if agent is alive
const state = getTNFMonitorState();
if (!state.isAccessible || !state.lastHeartbeat) {
  console.warn('Agent not responding - possible flatline');
}
```

## Integration

### Layout Auto-Initialization

The TNF Layout component automatically creates the hidden monitor on page load:

```tsx
import { Layout } from '@the-new-fuse/ui-consolidated';

// Monitor is auto-created - no setup required
const App = () => (
  <Layout>
    <MyAgentComponent />
  </Layout>
);
```

### Manual Initialization

For pages not using Layout:

```tsx
import { getOrCreateMonitor } from '@the-new-fuse/ui-consolidated';

const App = () => {
  useEffect(() => {
    getOrCreateMonitor(); // Creates hidden #tnf-ai-monitor
  }, []);

  return <MyComponent />;
};
```

## Security Model

| Property   | Value                                                 |
| ---------- | ----------------------------------------------------- |
| Visibility | Hidden from users (position: absolute; left: -9999px) |
| Access     | Readable by any AI with DOM access                    |
| Data       | Contains only non-sensitive operational logs          |
| Size       | Limited to 100 entries max                            |

The monitor contains only operational metadata - never secrets or user data.

## File Reference

- Hook: packages/ui-consolidated/src/hooks/useTNFLogger.ts
- Exports: @the-new-fuse/ui-consolidated
- Layout Integration: packages/ui-consolidated/src/components/Layout/Layout.tsx

## Related Protocols

- TNF Resource Strategy Protocol - LLM resource management
- TWIP Terminal Macro Board - Terminal identification surfaces
- TNF Cron Governance Protocol - Agent lifecycle management
