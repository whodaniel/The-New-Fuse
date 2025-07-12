# Enhanced Debugging Tools for Multi-Agent Communication

Comprehensive debugging and analysis toolkit for A2A (Agent-to-Agent) protocol communication in The New Fuse platform.

## Overview

This package provides advanced debugging capabilities for multi-agent communication systems, including:

- **Real-time message tracing** with comprehensive capture and analysis
- **Conversation flow visualization** and performance analysis
- **Agent monitoring** with detailed performance metrics
- **Interactive debugging interface** with filtering and real-time updates
- **Message analysis** with bottleneck identification and recommendations
- **Export capabilities** for offline analysis and reporting

## Features

### 🔍 **Message Tracing & Capture**
- Real-time message interception and logging
- Configurable capture filters (agent, message type, priority, keywords)
- Payload capture with optional compression
- Stack trace capture for error analysis
- Performance metrics collection (latency, bandwidth, processing time)

### 📊 **Conversation Analysis**
- Multi-agent conversation tracing
- Flow diagram generation
- Bottleneck identification
- Communication pattern analysis
- Efficiency scoring and recommendations

### 🎯 **Agent Debugging**
- Individual agent performance monitoring
- Message statistics (sent, received, processed, failed)
- Response time analysis
- Reliability scoring
- Activity tracking and status monitoring

### 🚀 **Real-Time Debugging**
- Live message streaming via Server-Sent Events
- Interactive debugging interface
- Configurable debug sessions
- Message filtering and search
- Export and replay capabilities

## Architecture

```
packages/debugging/
├── src/
│   ├── a2a-debugger.service.ts    # Core debugging service
│   ├── debugger.controller.ts     # REST API endpoints
│   └── debugging.module.ts        # NestJS module configuration
└── frontend/
    └── A2ADebugger.tsx            # React debugging interface
```

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables:

```env
# Debugging Configuration
DEBUG_ENABLED=true
DEBUG_MAX_SESSIONS=50
DEBUG_MAX_MESSAGES_PER_SESSION=10000
DEBUG_MESSAGE_BUFFER_SIZE=5000
DEBUG_CLEANUP_INTERVAL=300000
DEBUG_REAL_TIME_THROTTLE=100

# Cache Configuration (for persistence)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Usage

### Creating Debug Sessions

#### Via API
```bash
curl -X POST http://localhost:3000/api/debugging/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Agent Communication Debug",
    "description": "Debugging workflow coordination issues",
    "settings": {
      "capturePayloads": true,
      "realTimeUpdates": true,
      "maxMessages": 5000,
      "verboseLogging": true
    }
  }'
```

#### Programmatic Usage
```typescript
import { A2ADebuggerService } from '@packages/debugging';

// Create debug session
const sessionId = await debuggerService.createDebugSession(
  'My Debug Session',
  'Testing agent communication',
  {
    capturePayloads: true,
    realTimeUpdates: true,
    maxMessages: 5000,
  }
);

// Set as active session
await debuggerService.setActiveSession(sessionId);

// Messages will now be automatically captured
```

### Message Capture and Analysis

#### Manual Message Capture
```typescript
// Capture a specific message
await debuggerService.captureMessage({
  id: 'msg_123',
  fromAgent: 'agent_1',
  toAgent: 'agent_2',
  type: 'task_assignment',
  payload: { task: 'process_data' },
  priority: 2,
  timestamp: Date.now(),
});

// Analyze captured message
const analysis = await debuggerService.analyzeMessage('msg_123');
console.log('Performance Score:', analysis.analysis.performanceScore);
console.log('Recommendations:', analysis.analysis.suggestions);
```

#### Conversation Tracing
```typescript
// Start conversation trace
const conversationId = await debuggerService.startConversationTrace([
  'coordinator_agent',
  'worker_agent_1',
  'worker_agent_2',
]);

// Analyze conversation
const conversationAnalysis = await debuggerService.analyzeConversation(conversationId);
console.log('Efficiency:', conversationAnalysis.analysis.efficiency);
console.log('Bottlenecks:', conversationAnalysis.analysis.bottlenecks);
```

### Real-Time Debugging

#### Server-Sent Events Stream
```javascript
// Connect to real-time debug stream
const eventSource = new EventSource('/api/debugging/sessions/session_123/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'messageCapture':
      console.log('New message captured:', data.message);
      break;
    case 'conversationUpdate':
      console.log('Conversation updated:', data.conversation);
      break;
    case 'agentUpdate':
      console.log('Agent metrics updated:', data.agent);
      break;
  }
};
```

#### WebSocket Integration
```typescript
// In your A2A service, integrate with debugger
import { A2ADebuggerService } from '@packages/debugging';

@Injectable()
export class MyA2AService {
  constructor(private debuggerService: A2ADebuggerService) {}
  
  async sendMessage(message: A2AMessage): Promise<A2AResponse> {
    // Capture message for debugging
    await this.debuggerService.captureMessage(message);
    
    const response = await this.actualSendMessage(message);
    
    // Capture response
    await this.debuggerService.captureMessageResponse(message.id, response);
    
    return response;
  }
}
```

## API Endpoints

### Debug Session Management
- `POST /api/debugging/sessions` - Create new debug session
- `GET /api/debugging/sessions` - Get all debug sessions
- `GET /api/debugging/sessions/:id` - Get specific debug session
- `PUT /api/debugging/sessions/:id/active` - Set active session
- `PUT /api/debugging/sessions/:id/stop` - Stop debug session
- `DELETE /api/debugging/sessions/:id` - Delete debug session

### Message Capture & Analysis
- `GET /api/debugging/sessions/:id/messages` - Get captured messages
- `POST /api/debugging/messages/:id/analyze` - Analyze specific message
- `POST /api/debugging/capture/manual` - Manually capture message

### Conversation Tracing
- `POST /api/debugging/conversations/trace` - Start conversation trace
- `GET /api/debugging/conversations/:id` - Get conversation trace
- `POST /api/debugging/conversations/:id/analyze` - Analyze conversation
- `PUT /api/debugging/conversations/:id/end` - End conversation trace

### Agent Debugging
- `GET /api/debugging/agents` - Get monitored agents
- `GET /api/debugging/agents/:id` - Get agent debug info
- `GET /api/debugging/agents/:id/messages` - Get agent message history

### Real-Time & Utilities
- `GET /api/debugging/sessions/:id/stream` - Real-time debug stream
- `GET /api/debugging/dashboard` - Debug dashboard data
- `GET /api/debugging/sessions/:id/export` - Export session data
- `PUT /api/debugging/sessions/:id/filters` - Update debug filters

## Debug Filters

### Available Filter Types
```typescript
interface DebugFilter {
  type: 'agent' | 'messageType' | 'priority' | 'keyword' | 'timeRange';
  value: any;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  enabled: boolean;
}
```

### Example Filters
```typescript
const filters: DebugFilter[] = [
  {
    type: 'agent',
    value: 'coordinator_agent',
    operator: 'equals',
    enabled: true,
  },
  {
    type: 'messageType',
    value: 'task_assignment',
    operator: 'equals',
    enabled: true,
  },
  {
    type: 'priority',
    value: 2,
    operator: 'less',
    enabled: true,
  },
  {
    type: 'keyword',
    value: 'error',
    operator: 'contains',
    enabled: true,
  },
];
```

## Message Analysis

### Performance Metrics
- **Routing Efficiency**: Measures optimal vs actual routing path
- **Latency Analysis**: Categorizes response times and identifies bottlenecks
- **Error Analysis**: Tracks error types and recoverability
- **Performance Score**: Overall performance rating (0-100)

### Analysis Categories
```typescript
interface MessageAnalysis {
  messageId: string;
  analysis: {
    routingEfficiency: number;           // 0-100%
    latencyAnalysis: {
      category: 'excellent' | 'good' | 'acceptable' | 'slow' | 'critical';
      bottlenecks: string[];
      recommendations: string[];
    };
    errorAnalysis: {
      hasErrors: boolean;
      errorTypes: string[];
      recoverability: 'automatic' | 'manual' | 'critical';
    };
    performanceScore: number;            // 0-100
    suggestions: string[];
  };
}
```

## Frontend Integration

### React Component Usage
```typescript
import A2ADebugger from '@packages/debugging/A2ADebugger';

function App() {
  return (
    <div>
      <A2ADebugger />
    </div>
  );
}
```

### Features of the React Interface
- **Real-time message tracking** with live updates
- **Interactive message table** with filtering and sorting
- **Conversation flow visualization** with timeline view
- **Agent monitoring dashboard** with performance metrics
- **Analytics charts** for latency trends and message distribution
- **Export functionality** for session data
- **Configurable debug sessions** with custom settings

## Advanced Features

### Debug Session Settings
```typescript
interface DebugSettings {
  capturePayloads: boolean;      // Include message payloads
  captureStackTraces: boolean;   // Include error stack traces
  maxMessages: number;           // Maximum messages per session
  maxConversations: number;      // Maximum conversations per session
  retentionTime: number;         // How long to keep data (ms)
  realTimeUpdates: boolean;      // Enable real-time streaming
  verboseLogging: boolean;       // Detailed logging
}
```

### Performance Optimization
- **Message buffering** for high-throughput scenarios
- **Intelligent filtering** to reduce noise
- **Automatic cleanup** of old sessions and data
- **Compression** for large payloads
- **Real-time throttling** to prevent UI overload

### Export Formats
- **JSON**: Complete session data with all metadata
- **CSV**: Tabular format for spreadsheet analysis
- **XLSX**: Excel format with multiple sheets

## Troubleshooting

### Common Issues

#### Messages Not Being Captured
```bash
# Check if debug session is active
curl -X GET http://localhost:3000/api/debugging/sessions

# Verify session status
curl -X GET http://localhost:3000/api/debugging/sessions/{sessionId}

# Check debug filters
curl -X GET http://localhost:3000/api/debugging/sessions/{sessionId}/filters
```

#### High Memory Usage
```env
# Reduce message buffer size
DEBUG_MESSAGE_BUFFER_SIZE=1000

# Decrease max messages per session
DEBUG_MAX_MESSAGES_PER_SESSION=5000

# Enable compression
DEBUG_ENABLE_COMPRESSION=true
```

#### Real-Time Updates Not Working
```bash
# Check Server-Sent Events connection
curl -H "Accept: text/event-stream" \
     http://localhost:3000/api/debugging/sessions/{sessionId}/stream

# Verify WebSocket configuration
# Check firewall and proxy settings
```

### Debug Mode
```env
# Enable verbose logging
DEBUG_VERBOSE_LOGGING=true

# Enable stack trace capture
DEBUG_CAPTURE_STACK_TRACES=true

# Increase log level
LOG_LEVEL=debug
```

## Contributing

### Adding Custom Analysis
```typescript
// Extend message analysis
class CustomMessageAnalyzer {
  analyze(message: A2ADebugMessage): CustomAnalysis {
    // Custom analysis logic
    return {
      customMetric: this.calculateCustomMetric(message),
      recommendations: this.generateCustomRecommendations(message),
    };
  }
}
```

### Custom Debug Filters
```typescript
// Add custom filter type
interface CustomDebugFilter extends DebugFilter {
  type: 'customType';
  customProperty: any;
}
```

## Performance Considerations

### Resource Usage
- **Memory**: ~100MB for 10K messages with payloads
- **CPU**: Minimal overhead during normal operation
- **Network**: Real-time updates use ~1KB/s per active session
- **Storage**: Redis storage for session persistence

### Optimization Tips
1. **Use targeted filters** to capture only relevant messages
2. **Disable payload capture** for high-volume scenarios
3. **Set appropriate retention times** to prevent memory leaks
4. **Use batched exports** for large datasets
5. **Monitor session count** and clean up old sessions

## License

MIT License - see LICENSE file for details