# Complete MCP Specifications Guide

This comprehensive guide consolidates all Model Context Protocol (MCP) specifications, implementation details, server extensions, and troubleshooting information.

## Table of Contents

1. [MCP Protocol Specification](#mcp-protocol-specification)
2. [Server Implementation](#server-implementation)
3. [Server Extensions](#server-extensions)
4. [Tasks Reference](#tasks-reference)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Integration](#advanced-integration)

## MCP Protocol Specification

The Model Context Protocol (MCP) is a standardized communication protocol for inter-LLM communication in the Fuse framework. It enables different AI models and agents to share context, execute capabilities, and coordinate on complex tasks.

### Protocol Structure

MCP messages follow a structured format:

```typescript
interface MCPMessage<T = unknown> {
    version: string;
    messageId: string;
    timestamp: number;
    source: {
        id: string;
        type: 'ai_agent' | 'user' | 'system';
        capabilities: string[];
    };
    target: {
        id: string;
        type: 'ai_agent' | 'user' | 'system';
    };
    content: {
        type: MCPMessageType;
        action: string;
        data: T;
        priority: 'low' | 'medium' | 'high';
    };
    metadata?: {
        correlationId?: string;
        sessionId?: string;
        context?: any;
    };
}
```

### Message Types

#### Request Messages
Used to request a capability or action from another agent:

```json
{
  "version": "1.0",
  "messageType": "request",
  "id": "req-123",
  "timestamp": "2025-04-10T15:30:00Z",
  "source": {
    "agentId": "source-agent-id",
    "name": "Source Agent Name"
  },
  "target": {
    "agentId": "target-agent-id",
    "name": "Target Agent Name"
  },
  "content": {
    "capability": "text-analysis",
    "action": "sentiment-analysis",
    "parameters": {
      "text": "I really enjoyed using this new feature!",
      "options": {
        "detailed": true,
        "confidence": true
      }
    },
    "contextId": "conversation-123"
  },
  "metadata": {
    "correlationId": "task-456",
    "sessionId": "session-789"
  }
}
```

#### Response Messages
Used to respond to requests:

```json
{
  "version": "1.0",
  "messageType": "response",
  "id": "resp-124",
  "requestId": "req-123",
  "timestamp": "2025-04-10T15:30:02Z",
  "source": {
    "agentId": "target-agent-id",
    "name": "Target Agent Name"
  },
  "target": {
    "agentId": "source-agent-id",
    "name": "Source Agent Name"
  },
  "content": {
    "success": true,
    "result": {
      "sentiment": "positive",
      "confidence": 0.89,
      "emotions": ["joy", "satisfaction"],
      "detailed_analysis": {
        "positive_indicators": ["enjoyed", "new feature"],
        "intensity": "moderate"
      }
    }
  }
}
```

#### Event Messages
Used for notifications and asynchronous updates:

```json
{
  "version": "1.0",
  "messageType": "event",
  "id": "event-125",
  "timestamp": "2025-04-10T15:31:00Z",
  "source": {
    "agentId": "monitoring-agent",
    "name": "System Monitor"
  },
  "content": {
    "eventType": "status_change",
    "data": {
      "agentId": "worker-agent-1",
      "previousStatus": "idle",
      "currentStatus": "busy",
      "taskId": "task-456"
    }
  }
}
```

### Communication Patterns

#### Synchronous Communication
```typescript
async function syncRequest(message: MCPMessage): Promise<MCPMessage> {
  const response = await sendMessage(message);
  return response;
}
```

#### Asynchronous Communication
```typescript
function asyncRequest(message: MCPMessage, callback: (response: MCPMessage) => void) {
  sendMessage(message);
  registerCallback(message.id, callback);
}
```

#### Broadcast Communication
```typescript
function broadcastEvent(event: MCPMessage) {
  const targets = getActiveAgents();
  targets.forEach(target => {
    sendMessage({...event, target});
  });
}
```

## Server Implementation

### Basic MCP Server Setup

```typescript
import { MCPServer } from '@fuse/mcp-server';

const server = new MCPServer({
  name: 'Fuse MCP Server',
  version: '1.0.0',
  port: 3711,
  capabilities: [
    'file-operations',
    'code-analysis',
    'agent-communication'
  ]
});

// Register tools
server.registerTool('analyzeCode', {
  description: 'Analyze code for issues and improvements',
  parameters: {
    code: { type: 'string', required: true },
    language: { type: 'string', required: true },
    options: { type: 'object', required: false }
  },
  handler: async (params) => {
    // Implementation
    return {
      issues: [],
      suggestions: [],
      metrics: {}
    };
  }
});

// Start server
await server.start();
```

### Tool Registration

```typescript
interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, ParameterDefinition>;
  handler: (params: any, context: MCPContext) => Promise<any>;
}

interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  enum?: any[];
  default?: any;
}

interface MCPContext {
  userId?: string;
  sessionId: string;
  agentId: string;
  permissions: string[];
  metadata: Record<string, any>;
}
```

### Error Handling

```typescript
class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// Common error codes
const MCP_ERROR_CODES = {
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TIMEOUT: 'TIMEOUT',
  AGENT_UNAVAILABLE: 'AGENT_UNAVAILABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};
```

## Server Extensions

### Advanced Tool Development

#### Tools with Complex Parameter Handling

```typescript
import { z } from 'zod';

// Define schema with nested objects and validations
const DeploymentSchema = z.object({
  environment: z.enum(['dev', 'staging', 'production']),
  options: z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    enableFeatures: z.array(z.string()).optional(),
    rollback: z.boolean().default(true)
  }),
  timestamp: z.string().datetime().transform(str => new Date(str))
});

export const deploymentTools = {
  deployApplication: async (params: any, context: MCPContext) => {
    const validated = DeploymentSchema.parse(params);
    
    // Implementation
    return { 
      success: true, 
      deploymentId: `deploy-${Date.now()}`, 
      environment: validated.environment, 
      version: validated.options.version 
    };
  }
};
```

#### Stateful Tools with Memory

```typescript
class StatefulTool {
  private state: Map<string, any> = new Map();

  async processWithState(params: any, context: MCPContext) {
    const sessionKey = `${context.sessionId}:${context.agentId}`;
    
    // Get previous state
    const previousState = this.state.get(sessionKey) || {};
    
    // Process with state
    const result = await this.process(params, previousState);
    
    // Update state
    this.state.set(sessionKey, result.newState);
    
    return result.output;
  }

  private async process(params: any, state: any) {
    // Implementation that uses and updates state
    return {
      output: {},
      newState: {}
    };
  }
}
```

### External System Integration

#### Database Integration

```typescript
import { Pool } from 'pg';

class DatabaseTool {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async executeQuery(params: { query: string; parameters?: any[] }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(params.query, params.parameters);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(f => f.name)
      };
    } finally {
      client.release();
    }
  }
}
```

#### API Integration

```typescript
class APIIntegrationTool {
  private baseURL: string;
  private apiKey: string;

  async callExternalAPI(params: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    headers?: Record<string, string>;
  }) {
    const response = await fetch(`${this.baseURL}${params.endpoint}`, {
      method: params.method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...params.headers
      },
      body: params.data ? JSON.stringify(params.data) : undefined
    });

    if (!response.ok) {
      throw new MCPError(
        'API_ERROR',
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }
}
```

### Multi-Agent Coordination

#### Agent Registry

```typescript
interface AgentInfo {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  lastSeen: Date;
  metadata: Record<string, any>;
}

class AgentRegistry {
  private agents: Map<string, AgentInfo> = new Map();

  registerAgent(agent: AgentInfo) {
    this.agents.set(agent.id, {
      ...agent,
      lastSeen: new Date()
    });
  }

  findAgentsByCapability(capability: string): AgentInfo[] {
    return Array.from(this.agents.values())
      .filter(agent => 
        agent.capabilities.includes(capability) && 
        agent.status === 'online'
      );
  }

  async routeMessage(message: MCPMessage): Promise<string[]> {
    if (message.target.id === 'auto') {
      // Auto-route based on required capability
      const capability = message.content.action;
      const availableAgents = this.findAgentsByCapability(capability);
      
      if (availableAgents.length === 0) {
        throw new MCPError(
          'NO_AVAILABLE_AGENTS',
          `No agents available for capability: ${capability}`
        );
      }

      // Load balancing - select least busy agent
      const targetAgent = availableAgents.reduce((prev, current) => 
        prev.status === 'online' ? prev : current
      );

      return [targetAgent.id];
    }

    return [message.target.id];
  }
}
```

#### Task Coordination

```typescript
interface Task {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedAgent?: string;
  dependencies: string[];
  data: any;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class TaskCoordinator {
  private tasks: Map<string, Task> = new Map();
  private agentRegistry: AgentRegistry;

  constructor(agentRegistry: AgentRegistry) {
    this.agentRegistry = agentRegistry;
  }

  async submitTask(taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const task: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(task.id, task);
    
    // Check if dependencies are satisfied
    if (await this.areDependenciesSatisfied(task)) {
      await this.assignTask(task);
    }

    return task.id;
  }

  private async areDependenciesSatisfied(task: Task): Promise<boolean> {
    return task.dependencies.every(depId => {
      const dep = this.tasks.get(depId);
      return dep && dep.status === 'completed';
    });
  }

  private async assignTask(task: Task) {
    const availableAgents = this.agentRegistry.findAgentsByCapability(task.type);
    
    if (availableAgents.length === 0) {
      throw new MCPError(
        'NO_AVAILABLE_AGENTS',
        `No agents available for task type: ${task.type}`
      );
    }

    const agent = availableAgents[0]; // Simple assignment
    task.assignedAgent = agent.id;
    task.status = 'running';
    task.updatedAt = new Date();

    // Send task to agent
    await this.sendTaskToAgent(task, agent.id);
  }

  private async sendTaskToAgent(task: Task, agentId: string) {
    const message: MCPMessage = {
      version: '1.0',
      messageId: `msg-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        id: 'task-coordinator',
        type: 'system',
        capabilities: ['task-coordination']
      },
      target: {
        id: agentId,
        type: 'ai_agent'
      },
      content: {
        type: 'task-assignment',
        action: task.type,
        data: task.data,
        priority: 'medium'
      },
      metadata: {
        taskId: task.id,
        correlationId: task.id
      }
    };

    // Send message through MCP
    await this.sendMessage(message);
  }
}
```

## Tasks Reference

### Core MCP Tasks

#### Communication Tasks
- **send_message**: Send message to specific agent
- **broadcast_message**: Send message to multiple agents
- **subscribe_events**: Subscribe to event notifications
- **unsubscribe_events**: Unsubscribe from events

#### Agent Management Tasks
- **register_agent**: Register new agent in the system
- **update_agent_status**: Update agent availability status
- **query_agents**: Find agents by capabilities
- **get_agent_info**: Get detailed agent information

#### Tool Execution Tasks
- **execute_tool**: Execute a specific tool with parameters
- **list_tools**: Get available tools and their descriptions
- **get_tool_schema**: Get parameter schema for a tool
- **validate_parameters**: Validate tool parameters

### Task Parameter Schemas

```typescript
// Message sending task
interface SendMessageTask {
  targetAgentId: string;
  content: {
    action: string;
    data: any;
    priority?: 'low' | 'medium' | 'high';
  };
  options?: {
    timeout?: number;
    retries?: number;
    waitForResponse?: boolean;
  };
}

// Tool execution task
interface ExecuteToolTask {
  toolName: string;
  parameters: Record<string, any>;
  context?: {
    sessionId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  };
}

// Agent query task
interface QueryAgentsTask {
  criteria: {
    capabilities?: string[];
    type?: string;
    status?: 'online' | 'offline' | 'busy';
    metadata?: Record<string, any>;
  };
  options?: {
    limit?: number;
    sortBy?: 'lastSeen' | 'name' | 'capabilities';
  };
}
```

## Troubleshooting

### Common Issues

#### Connection Problems
```typescript
// Check MCP server status
async function checkMCPStatus() {
  try {
    const response = await fetch('http://localhost:3711/health');
    return response.ok;
  } catch (error) {
    console.error('MCP server not responding:', error);
    return false;
  }
}

// Implement connection retry logic
async function connectWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await connectToMCP();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

#### Message Delivery Issues
```typescript
// Message acknowledgment system
class MessageTracker {
  private pendingMessages: Map<string, {
    message: MCPMessage;
    timestamp: number;
    retries: number;
  }> = new Map();

  async sendWithTracking(message: MCPMessage, maxRetries = 3) {
    this.pendingMessages.set(message.messageId, {
      message,
      timestamp: Date.now(),
      retries: 0
    });

    try {
      await this.sendMessage(message);
      // Wait for acknowledgment with timeout
      await this.waitForAck(message.messageId, 5000);
    } catch (error) {
      await this.handleDeliveryFailure(message.messageId, error);
    }
  }

  private async handleDeliveryFailure(messageId: string, error: any) {
    const tracked = this.pendingMessages.get(messageId);
    if (!tracked) return;

    tracked.retries++;
    if (tracked.retries < 3) {
      // Retry with exponential backoff
      setTimeout(() => {
        this.sendMessage(tracked.message);
      }, 1000 * Math.pow(2, tracked.retries));
    } else {
      // Give up and notify sender
      this.pendingMessages.delete(messageId);
      throw new MCPError('MESSAGE_DELIVERY_FAILED', `Failed to deliver message after ${tracked.retries} retries`);
    }
  }
}
```

#### Performance Issues
```typescript
// Message rate limiting
class RateLimiter {
  private tokens: Map<string, number> = new Map();
  private refillInterval: NodeJS.Timeout;

  constructor(private tokensPerMinute: number = 60) {
    this.refillInterval = setInterval(() => {
      this.refillTokens();
    }, 60000); // Refill every minute
  }

  canSend(agentId: string): boolean {
    const tokens = this.tokens.get(agentId) || this.tokensPerMinute;
    return tokens > 0;
  }

  consumeToken(agentId: string): boolean {
    const tokens = this.tokens.get(agentId) || this.tokensPerMinute;
    if (tokens > 0) {
      this.tokens.set(agentId, tokens - 1);
      return true;
    }
    return false;
  }

  private refillTokens() {
    for (const [agentId] of this.tokens) {
      this.tokens.set(agentId, this.tokensPerMinute);
    }
  }
}
```

### Debugging Tools

#### Message Inspector
```typescript
class MessageInspector {
  private messageLog: MCPMessage[] = [];
  private maxLogSize = 1000;

  logMessage(message: MCPMessage, direction: 'sent' | 'received') {
    this.messageLog.push({
      ...message,
      metadata: {
        ...message.metadata,
        direction,
        loggedAt: Date.now()
      }
    });

    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog.shift();
    }
  }

  searchMessages(criteria: {
    agentId?: string;
    messageType?: string;
    timeRange?: { start: number; end: number };
    content?: string;
  }): MCPMessage[] {
    return this.messageLog.filter(msg => {
      if (criteria.agentId && 
          msg.source.id !== criteria.agentId && 
          msg.target.id !== criteria.agentId) return false;
      
      if (criteria.messageType && msg.content.type !== criteria.messageType) return false;
      
      if (criteria.timeRange && 
          (msg.timestamp < criteria.timeRange.start || 
           msg.timestamp > criteria.timeRange.end)) return false;
      
      if (criteria.content && 
          !JSON.stringify(msg.content).includes(criteria.content)) return false;
      
      return true;
    });
  }

  generateReport(): {
    totalMessages: number;
    messagesByType: Record<string, number>;
    messagesByAgent: Record<string, number>;
    averageResponseTime: number;
  } {
    const report = {
      totalMessages: this.messageLog.length,
      messagesByType: {} as Record<string, number>,
      messagesByAgent: {} as Record<string, number>,
      averageResponseTime: 0
    };

    let responseTimes: number[] = [];

    this.messageLog.forEach(msg => {
      // Count by type
      report.messagesByType[msg.content.type] = 
        (report.messagesByType[msg.content.type] || 0) + 1;

      // Count by agent
      report.messagesByAgent[msg.source.id] = 
        (report.messagesByAgent[msg.source.id] || 0) + 1;

      // Calculate response times for request-response pairs
      if (msg.content.type === 'response' && msg.metadata?.requestId) {
        const request = this.messageLog.find(m => 
          m.messageId === msg.metadata!.requestId
        );
        if (request) {
          responseTimes.push(msg.timestamp - request.timestamp);
        }
      }
    });

    if (responseTimes.length > 0) {
      report.averageResponseTime = 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    return report;
  }
}
```

## Advanced Integration

### Custom Protocol Extensions

```typescript
// Extend MCP with custom message types
interface CustomMCPMessage extends MCPMessage {
  content: MCPMessage['content'] & {
    customData?: {
      encryption?: 'aes256' | 'rsa';
      compression?: 'gzip' | 'brotli';
      priority?: 'critical' | 'normal' | 'low';
    };
  };
}

class ExtendedMCPServer extends MCPServer {
  async handleCustomMessage(message: CustomMCPMessage) {
    // Handle encryption
    if (message.content.customData?.encryption) {
      message = await this.decryptMessage(message);
    }

    // Handle compression
    if (message.content.customData?.compression) {
      message = await this.decompressMessage(message);
    }

    // Process with priority
    if (message.content.customData?.priority === 'critical') {
      return await this.processHighPriority(message);
    }

    return await super.handleMessage(message);
  }
}
```

### Integration with External Services

```typescript
// Slack integration
class SlackMCPBridge {
  private slackClient: any;
  private mcpServer: MCPServer;

  constructor(slackToken: string, mcpServer: MCPServer) {
    this.slackClient = new WebClient(slackToken);
    this.mcpServer = mcpServer;
  }

  async bridgeSlackToMCP(slackMessage: any) {
    const mcpMessage: MCPMessage = {
      version: '1.0',
      messageId: `slack-${slackMessage.ts}`,
      timestamp: parseInt(slackMessage.ts) * 1000,
      source: {
        id: `slack-${slackMessage.user}`,
        type: 'user',
        capabilities: []
      },
      target: {
        id: 'slack-bot-agent',
        type: 'ai_agent'
      },
      content: {
        type: 'user-message',
        action: 'process-text',
        data: {
          text: slackMessage.text,
          channel: slackMessage.channel,
          user: slackMessage.user
        },
        priority: 'medium'
      }
    };

    return await this.mcpServer.handleMessage(mcpMessage);
  }
}
```

This complete MCP specifications guide consolidates all protocol definitions, implementation details, server extensions, troubleshooting information, and advanced integration patterns. All technical specifications and implementation details have been preserved while providing a comprehensive reference for MCP development and deployment.
