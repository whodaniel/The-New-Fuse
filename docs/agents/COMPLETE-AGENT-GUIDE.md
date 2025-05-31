# Complete Agent Development Guide

This comprehensive guide provides everything you need to develop, integrate, and deploy agents within The New Fuse platform ecosystem.

## Table of Contents

1. [Agent Integration Overview](#agent-integration-overview)
2. [Agent Architecture](#agent-architecture)
3. [Development Guide](#development-guide)
4. [Agent-to-Agent (A2A) Protocol](#agent-to-agent-a2a-protocol)
5. [Integration Process](#integration-process)
6. [API Reference](#api-reference)
7. [Security Guidelines](#security-guidelines)
8. [Best Practices](#best-practices)
9. [Examples and Code Templates](#examples-and-code-templates)

## Agent Integration Overview

### What are Agents?

In The New Fuse ecosystem, agents are autonomous software components that provide specific capabilities and can communicate with other agents through the Model Context Protocol (MCP). Agents can be specialized for particular tasks such as:

- Text analysis and processing
- Code generation and review
- Data processing and transformation
- Domain-specific operations
- Integration with external services

### Quick Start Integration Process

1. **Register your agent** using the `/api/v1/agents/register` endpoint
2. **Complete capability assessment** and submit capability manifest
3. **Establish secure communication channels** via WebSocket or HTTP
4. **Join the agent network** and configure peer discovery
5. **Begin collaborative tasks** through the workflow system

## Agent Architecture

### Core Components

An agent in The New Fuse consists of the following core components:

1. **Agent Identity**: Unique identification and metadata
2. **Capability Registry**: Declaration of agent capabilities and actions
3. **Request Handler**: Processing of incoming requests and messages
4. **Context Manager**: Management of conversational and operational context
5. **Communication Interface**: Integration with MCP and A2A protocols
6. **Security Layer**: Authentication, authorization, and encryption

### General Structure

```typescript
class MyCustomAgent implements Agent {
  // Agent identity
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Capability registry
  capabilities: Capability[];
  
  constructor() {
    this.id = 'my-custom-agent';
    this.name = 'My Custom Agent';
    this.description = 'Provides custom processing capabilities';
    this.version = '1.0.0';
    this.capabilities = this.defineCapabilities();
  }
  
  // Register the agent with The New Fuse
  async register(): Promise<void> {
    const registrationData = {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      capabilities: this.capabilities,
      endpoints: this.getEndpoints(),
      security: this.getSecurityConfig()
    };
    
    const response = await fetch('/api/v1/agents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });
    
    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    this.agentToken = result.token;
  }
  
  // Define agent capabilities
  defineCapabilities(): Capability[] {
    return [
      {
        id: 'text-processing',
        name: 'Text Processing',
        description: 'Process and analyze text content',
        actions: [
          {
            id: 'summarize',
            name: 'Summarize Text',
            description: 'Generate a summary of provided text',
            parameters: [
              {
                name: 'text',
                type: 'string',
                required: true,
                description: 'The text to summarize'
              },
              {
                name: 'maxLength',
                type: 'number',
                required: false,
                description: 'Maximum length of summary',
                default: 200
              }
            ]
          },
          {
            id: 'analyze-sentiment',
            name: 'Analyze Sentiment',
            description: 'Analyze the sentiment of text',
            parameters: [
              {
                name: 'text',
                type: 'string',
                required: true,
                description: 'The text to analyze'
              }
            ]
          }
        ]
      }
    ];
  }
  
  // Handle incoming requests
  async handleRequest(request: Request): Promise<Response> {
    try {
      const { capability, action, parameters } = request;
      
      // Validate request
      await this.validateRequest(request);
      
      // Route to appropriate handler
      if (capability === 'text-processing') {
        return await this.handleTextProcessing(action, parameters);
      }
      
      throw new Error(`Unsupported capability: ${capability}`);
    } catch (error) {
      return {
        status: 'error',
        error: {
          code: 'processing_error',
          message: error.message
        }
      };
    }
  }
  
  // Handle text processing actions
  async handleTextProcessing(action: string, parameters: any): Promise<Response> {
    switch (action) {
      case 'summarize':
        return await this.handleSummarize(parameters);
      case 'analyze-sentiment':
        return await this.handleSentimentAnalysis(parameters);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }
  
  // Implementation of specific actions
  async handleSummarize(parameters: any): Promise<Response> {
    const { text, maxLength = 200 } = parameters;
    
    // Implement summarization logic
    const summary = await this.performSummarization(text, maxLength);
    
    return {
      status: 'success',
      data: { 
        summary,
        originalLength: text.length,
        summaryLength: summary.length
      }
    };
  }
  
  async handleSentimentAnalysis(parameters: any): Promise<Response> {
    const { text } = parameters;
    
    // Implement sentiment analysis logic
    const sentiment = await this.performSentimentAnalysis(text);
    
    return {
      status: 'success',
      data: {
        sentiment: sentiment.label,
        confidence: sentiment.confidence,
        details: sentiment.details
      }
    };
  }
}
```

## Development Guide

### Setting Up Your Development Environment

1. **Install Dependencies**
   ```bash
   npm install @new-fuse/agent-sdk
   npm install @new-fuse/mcp-client
   ```

2. **Initialize Agent Project**
   ```bash
   npx @new-fuse/create-agent my-agent
   cd my-agent
   npm install
   ```

3. **Configure Environment**
   ```bash
   # .env file
   AGENT_ID=my-custom-agent
   AGENT_NAME="My Custom Agent"
   FUSE_API_BASE_URL=https://api.newfuse.dev
   REDIS_URL=redis://localhost:6379
   ```

### Agent Lifecycle Management

#### Initialization
```typescript
class AgentLifecycle {
  async initialize(): Promise<void> {
    // 1. Load configuration
    await this.loadConfiguration();
    
    // 2. Initialize communication systems
    await this.initializeCommunication();
    
    // 3. Register with platform
    await this.register();
    
    // 4. Start health monitoring
    this.startHealthMonitoring();
    
    // 5. Begin accepting requests
    this.startRequestHandling();
  }
  
  async shutdown(): Promise<void> {
    // Graceful shutdown process
    await this.stopRequestHandling();
    await this.cleanupResources();
    await this.unregister();
  }
}
```

#### Error Handling and Recovery
```typescript
class ErrorHandler {
  async handleError(error: Error, context: RequestContext): Promise<void> {
    // Log error
    this.logger.error('Agent error', { error, context });
    
    // Attempt recovery based on error type
    if (error instanceof NetworkError) {
      await this.handleNetworkError(error);
    } else if (error instanceof ValidationError) {
      await this.handleValidationError(error, context);
    } else {
      await this.handleGenericError(error, context);
    }
    
    // Report to monitoring system
    await this.reportError(error, context);
  }
}
```

### Testing Your Agent

```typescript
import { AgentTestSuite } from '@new-fuse/agent-testing';

describe('MyCustomAgent', () => {
  let agent: MyCustomAgent;
  let testSuite: AgentTestSuite;
  
  beforeEach(async () => {
    agent = new MyCustomAgent();
    testSuite = new AgentTestSuite(agent);
    await testSuite.setup();
  });
  
  test('should handle text summarization', async () => {
    const request = {
      capability: 'text-processing',
      action: 'summarize',
      parameters: {
        text: 'This is a long text that needs to be summarized...',
        maxLength: 100
      }
    };
    
    const response = await agent.handleRequest(request);
    
    expect(response.status).toBe('success');
    expect(response.data.summary).toBeDefined();
    expect(response.data.summary.length).toBeLessThanOrEqual(100);
  });
  
  test('should handle capability discovery', async () => {
    const capabilities = agent.getCapabilities();
    
    expect(capabilities).toHaveLength(1);
    expect(capabilities[0].id).toBe('text-processing');
    expect(capabilities[0].actions).toHaveLength(2);
  });
});
```

## Agent-to-Agent (A2A) Protocol

### Overview

The Agent-to-Agent (A2A) protocol enables direct communication between AI agents in the Fuse framework, allowing them to share context and coordinate on complex tasks.

### Protocol Structure

#### A2A Message V1 (Flat Structure)
```typescript
interface A2AMessageV1 {
    id: string;
    type: string;
    timestamp: number;
    sender: string;
    recipient?: string;
    payload: any;
    metadata: {
        priority: 'low' | 'medium' | 'high';
        timeout?: number;
        retryCount?: number;
        protocol_version: '1.0';
    };
}
```

#### A2A Message V2 (Header/Body Structure)
```typescript
interface A2AMessageV2 {
    header: {
        id: string;
        type: string;
        version: string;
        priority: 'low' | 'medium' | 'high';
        source: string;
        target?: string;
    };
    body: {
        content: any;
        metadata: {
            sent_at: number;
            timeout?: number;
            retries?: number;
            trace_id?: string;
        };
    };
}
```

### Message Types

```typescript
enum A2AMessageType {
    TASK_REQUEST = 'TASK_REQUEST',
    QUERY = 'QUERY',
    RESPONSE = 'RESPONSE',
    NOTIFICATION = 'NOTIFICATION',
    ERROR = 'ERROR',
    HEARTBEAT = 'HEARTBEAT',
    CAPABILITY_DISCOVERY = 'CAPABILITY_DISCOVERY',
    WORKFLOW_STEP = 'WORKFLOW_STEP'
}
```

### Protocol Adapters

A2A supports multiple protocol adapters for different agent types:

```typescript
interface ProtocolAdapter {
    name: string;
    version: string;
    supportedProtocols: string[];
    canHandle(protocol: string): boolean;
    adaptMessage(message: A2AMessage, targetProtocol: string): Promise<any>;
}

class GoogleA2AAdapter implements ProtocolAdapter {
    readonly name = 'google-a2a-adapter';
    readonly version = '1.0.0';
    readonly supportedProtocols = ['a2a-v2.0', 'google-a2a-v1.0'];

    canHandle(protocol: string): boolean {
        return this.supportedProtocols.includes(protocol);
    }

    async adaptMessage(message: A2AMessage, targetProtocol: string): Promise<GoogleA2AMessage> {
        if (targetProtocol === 'google-a2a-v1.0') {
            return this.convertToGoogleFormat(message);
        }
        throw new Error(`Unsupported target protocol: ${targetProtocol}`);
    }
}
```

### Communication Implementation

```typescript
class A2ACommunicationManager {
    private websocketServer: WebSocketServer;
    private clients: Map<string, WebSocket> = new Map();
    
    constructor(port: number) {
        this.websocketServer = new WebSocketServer({ port });
        this.initializeWebSocketServer();
    }
    
    private initializeWebSocketServer(): void {
        this.websocketServer.on('connection', (ws: WebSocket, request) => {
            const agentId = this.extractAgentId(request);
            this.clients.set(agentId, ws);
            
            ws.on('message', async (data) => {
                try {
                    const message: A2AMessage = JSON.parse(data.toString());
                    await this.handleMessage(message);
                } catch (error) {
                    console.error(`Error handling WebSocket message: ${error.message}`);
                }
            });
            
            ws.on('close', () => {
                this.clients.delete(agentId);
            });
        });
    }
    
    async sendMessage(agentId: string, message: A2AMessage): Promise<void> {
        const client = this.clients.get(agentId);
        if (!client) {
            throw new Error(`Agent ${agentId} not connected`);
        }
        client.send(JSON.stringify(message));
    }
    
    async handleMessage(message: A2AMessage): Promise<void> {
        // Route message based on type and recipient
        switch (message.type) {
            case A2AMessageType.TASK_REQUEST:
                await this.handleTaskRequest(message);
                break;
            case A2AMessageType.QUERY:
                await this.handleQuery(message);
                break;
            case A2AMessageType.CAPABILITY_DISCOVERY:
                await this.handleCapabilityDiscovery(message);
                break;
            default:
                console.warn(`Unknown message type: ${message.type}`);
        }
    }
}
```

## Integration Process

### Step-by-Step Integration

#### 1. Registration
```typescript
async function registerAgent(agentConfig: AgentConfig): Promise<RegistrationResult> {
    const registrationPayload = {
        id: agentConfig.id,
        name: agentConfig.name,
        description: agentConfig.description,
        version: agentConfig.version,
        capabilities: agentConfig.capabilities,
        endpoints: {
            health: `${agentConfig.baseUrl}/health`,
            capabilities: `${agentConfig.baseUrl}/capabilities`,
            execute: `${agentConfig.baseUrl}/execute`
        },
        security: {
            authMethod: 'bearer',
            encryptionSupported: true
        }
    };
    
    const response = await fetch('/api/v1/agents/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${agentConfig.apiKey}`
        },
        body: JSON.stringify(registrationPayload)
    });
    
    if (!response.ok) {
        throw new Error(`Registration failed: ${await response.text()}`);
    }
    
    return await response.json();
}
```

#### 2. Capability Assessment
```typescript
async function submitCapabilityManifest(manifest: CapabilityManifest): Promise<void> {
    const response = await fetch('/api/v1/agents/capabilities', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.agentToken}`
        },
        body: JSON.stringify(manifest)
    });
    
    if (!response.ok) {
        throw new Error(`Capability submission failed: ${await response.text()}`);
    }
}
```

#### 3. Communication Setup
```typescript
class CommunicationSetup {
    async establishWebSocket(): Promise<WebSocket> {
        const ws = new WebSocket(`wss://api.newfuse.dev/agents/ws?token=${this.agentToken}`);
        
        ws.on('open', () => {
            console.log('WebSocket connection established');
            this.sendHeartbeat();
        });
        
        ws.on('message', (data) => {
            this.handleIncomingMessage(JSON.parse(data.toString()));
        });
        
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        
        return ws;
    }
    
    setupMessageQueue(): void {
        // Configure Redis-based message queue
        this.messageQueue = new MessageQueue({
            redis: { host: 'localhost', port: 6379 },
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 50
            }
        });
    }
}
```

#### 4. Network Integration
```typescript
async function joinAgentNetwork(): Promise<void> {
    // Join mesh network
    await this.meshNetwork.join({
        agentId: this.id,
        capabilities: this.capabilities,
        endpoints: this.endpoints
    });
    
    // Configure peer discovery
    this.peerDiscovery.start({
        interval: 30000, // 30 seconds
        maxPeers: 50
    });
    
    // Setup collaboration protocols
    await this.setupCollaborationProtocols();
}
```

#### 5. Task Management
```typescript
class TaskManager {
    private taskQueue: Queue;
    private taskHandlers: Map<string, TaskHandler> = new Map();
    
    async initializeTaskQueue(): Promise<void> {
        this.taskQueue = new Queue('agent-tasks', {
            redis: { host: 'localhost', port: 6379 }
        });
        
        this.taskQueue.process('*', async (job) => {
            const { taskType, payload } = job.data;
            const handler = this.taskHandlers.get(taskType);
            
            if (!handler) {
                throw new Error(`No handler for task type: ${taskType}`);
            }
            
            return await handler.execute(payload);
        });
    }
    
    registerTaskHandler(taskType: string, handler: TaskHandler): void {
        this.taskHandlers.set(taskType, handler);
    }
    
    async submitTask(taskType: string, payload: any): Promise<string> {
        const job = await this.taskQueue.add(taskType, payload);
        return job.id;
    }
}
```

## API Reference

### Core Agent API Endpoints

#### Registration
- **POST** `/api/v1/agents/register`
  - Register a new agent with the platform
  - **Body**: `AgentRegistrationPayload`
  - **Response**: `RegistrationResult`

#### Capabilities
- **GET** `/api/v1/agents/{agentId}/capabilities`
  - Retrieve agent capabilities
  - **Response**: `Capability[]`

- **POST** `/api/v1/agents/capabilities`
  - Submit capability manifest
  - **Body**: `CapabilityManifest`

#### Execution
- **POST** `/api/v1/agents/{agentId}/execute`
  - Execute agent capability
  - **Body**: `ExecutionRequest`
  - **Response**: `ExecutionResult`

#### Health and Status
- **GET** `/api/v1/agents/{agentId}/health`
  - Check agent health status
  - **Response**: `HealthStatus`

- **GET** `/api/v1/agents/{agentId}/status`
  - Get detailed agent status
  - **Response**: `AgentStatus`

### Data Models

```typescript
interface AgentRegistrationPayload {
    id: string;
    name: string;
    description: string;
    version: string;
    capabilities: Capability[];
    endpoints: AgentEndpoints;
    security: SecurityConfig;
}

interface Capability {
    id: string;
    name: string;
    description: string;
    actions: Action[];
    category?: string;
    tags?: string[];
}

interface Action {
    id: string;
    name: string;
    description: string;
    parameters: Parameter[];
    returnType?: string;
}

interface Parameter {
    name: string;
    type: string;
    required: boolean;
    description: string;
    default?: any;
    validation?: ValidationRule[];
}

interface ExecutionRequest {
    capability: string;
    action: string;
    parameters: Record<string, any>;
    context?: ExecutionContext;
}

interface ExecutionResult {
    status: 'success' | 'error' | 'pending';
    data?: any;
    error?: ErrorDetails;
    executionId?: string;
    duration?: number;
}
```

## Security Guidelines

### Authentication and Authorization

```typescript
class SecurityManager {
    private jwtSecret: string;
    private permissions: Map<string, Permission[]> = new Map();
    
    async authenticateAgent(token: string): Promise<AgentIdentity> {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
            return {
                id: decoded.sub,
                name: decoded.name,
                capabilities: decoded.capabilities,
                permissions: this.permissions.get(decoded.sub) || []
            };
        } catch (error) {
            throw new UnauthorizedError('Invalid authentication token');
        }
    }
    
    async authorizeAction(agent: AgentIdentity, capability: string, action: string): Promise<boolean> {
        const requiredPermission = `${capability}:${action}`;
        return agent.permissions.some(p => p.matches(requiredPermission));
    }
    
    encryptMessage(message: any, recipientPublicKey: string): EncryptedMessage {
        // Implement message encryption
        const encrypted = crypto.encrypt(JSON.stringify(message), recipientPublicKey);
        return {
            encryptedData: encrypted.data,
            nonce: encrypted.nonce,
            algorithm: 'AES-256-GCM'
        };
    }
}
```

### Input Validation

```typescript
class InputValidator {
    validateExecutionRequest(request: ExecutionRequest): ValidationResult {
        const errors: string[] = [];
        
        // Validate capability exists
        if (!this.capabilities.has(request.capability)) {
            errors.push(`Unknown capability: ${request.capability}`);
        }
        
        // Validate action exists
        const capability = this.capabilities.get(request.capability);
        if (capability && !capability.actions.some(a => a.id === request.action)) {
            errors.push(`Unknown action: ${request.action}`);
        }
        
        // Validate parameters
        const action = capability?.actions.find(a => a.id === request.action);
        if (action) {
            errors.push(...this.validateParameters(request.parameters, action.parameters));
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    private validateParameters(provided: Record<string, any>, expected: Parameter[]): string[] {
        const errors: string[] = [];
        
        // Check required parameters
        for (const param of expected.filter(p => p.required)) {
            if (!(param.name in provided)) {
                errors.push(`Missing required parameter: ${param.name}`);
            }
        }
        
        // Validate parameter types
        for (const [name, value] of Object.entries(provided)) {
            const param = expected.find(p => p.name === name);
            if (param && !this.isValidType(value, param.type)) {
                errors.push(`Invalid type for parameter ${name}: expected ${param.type}`);
            }
        }
        
        return errors;
    }
}
```

### Rate Limiting

```typescript
class RateLimiter {
    private limits: Map<string, RateLimit> = new Map();
    private counters: Map<string, Counter> = new Map();
    
    async checkLimit(agentId: string, capability: string): Promise<boolean> {
        const key = `${agentId}:${capability}`;
        const limit = this.limits.get(capability) || { requests: 100, window: 60000 }; // 100 req/min default
        
        let counter = this.counters.get(key);
        if (!counter || Date.now() - counter.windowStart > limit.window) {
            counter = { count: 0, windowStart: Date.now() };
            this.counters.set(key, counter);
        }
        
        if (counter.count >= limit.requests) {
            return false; // Rate limit exceeded
        }
        
        counter.count++;
        return true;
    }
}
```

## Best Practices

### 1. Agent Design Principles

- **Single Responsibility**: Each agent should have a clear, focused purpose
- **Stateless Operations**: Design agents to be stateless when possible
- **Idempotent Actions**: Ensure actions can be safely retried
- **Error Resilience**: Implement comprehensive error handling
- **Resource Management**: Properly manage memory, connections, and other resources

### 2. Performance Optimization

```typescript
class PerformanceOptimizer {
    // Connection pooling
    private connectionPool: Pool;
    
    // Caching strategy
    private cache: Cache;
    
    // Async processing
    async processRequestsInBatches(requests: Request[]): Promise<Response[]> {
        const batches = this.createBatches(requests, 10); // Process 10 at a time
        const results: Response[] = [];
        
        for (const batch of batches) {
            const batchResults = await Promise.all(
                batch.map(request => this.processRequest(request))
            );
            results.push(...batchResults);
        }
        
        return results;
    }
    
    // Resource cleanup
    async cleanup(): Promise<void> {
        await this.connectionPool.end();
        await this.cache.flush();
    }
}
```

### 3. Monitoring and Observability

```typescript
class AgentMonitoring {
    private metrics: MetricsCollector;
    private logger: Logger;
    
    recordExecution(capability: string, action: string, duration: number, success: boolean): void {
        this.metrics.increment('agent.executions.total', {
            capability,
            action,
            status: success ? 'success' : 'error'
        });
        
        this.metrics.histogram('agent.execution.duration', duration, {
            capability,
            action
        });
    }
    
    logHealthCheck(): void {
        const healthData = {
            timestamp: Date.now(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connections: this.getActiveConnections(),
            queueSize: this.getQueueSize()
        };
        
        this.logger.info('Agent health check', healthData);
    }
}
```

### 4. Testing Strategies

```typescript
// Unit testing
describe('Agent Capabilities', () => {
    test('should validate input parameters', async () => {
        const agent = new TestAgent();
        const request = {
            capability: 'text-processing',
            action: 'summarize',
            parameters: { text: 'Test content' }
        };
        
        const response = await agent.handleRequest(request);
        expect(response.status).toBe('success');
    });
});

// Integration testing
describe('Agent Integration', () => {
    test('should communicate with other agents', async () => {
        const agentA = new TestAgentA();
        const agentB = new TestAgentB();
        
        const message = await agentA.sendMessage(agentB.id, {
            type: 'QUERY',
            payload: { question: 'What is your status?' }
        });
        
        expect(message.response).toBeDefined();
    });
});

// Load testing
describe('Agent Performance', () => {
    test('should handle concurrent requests', async () => {
        const agent = new TestAgent();
        const requests = Array(100).fill(null).map(() => createTestRequest());
        
        const startTime = Date.now();
        const responses = await Promise.all(
            requests.map(req => agent.handleRequest(req))
        );
        const duration = Date.now() - startTime;
        
        expect(responses.every(r => r.status === 'success')).toBe(true);
        expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
});
```

## Examples and Code Templates

### Example 1: Data Processing Agent

```typescript
class DataProcessingAgent extends BaseAgent {
    constructor() {
        super({
            id: 'data-processor',
            name: 'Data Processing Agent',
            description: 'Processes and transforms data in various formats'
        });
    }
    
    defineCapabilities(): Capability[] {
        return [
            {
                id: 'data-transformation',
                name: 'Data Transformation',
                description: 'Transform data between formats',
                actions: [
                    {
                        id: 'csv-to-json',
                        name: 'CSV to JSON',
                        description: 'Convert CSV data to JSON format',
                        parameters: [
                            { name: 'csvData', type: 'string', required: true, description: 'CSV data to convert' },
                            { name: 'includeHeaders', type: 'boolean', required: false, description: 'Include headers in output', default: true }
                        ]
                    }
                ]
            }
        ];
    }
    
    async handleDataTransformation(action: string, parameters: any): Promise<Response> {
        switch (action) {
            case 'csv-to-json':
                return await this.convertCsvToJson(parameters);
            default:
                throw new Error(`Unsupported action: ${action}`);
        }
    }
    
    private async convertCsvToJson(params: { csvData: string; includeHeaders?: boolean }): Promise<Response> {
        try {
            const { csvData, includeHeaders = true } = params;
            const lines = csvData.trim().split('\n');
            
            if (lines.length === 0) {
                throw new Error('No data provided');
            }
            
            const headers = includeHeaders ? lines[0].split(',') : [];
            const dataLines = includeHeaders ? lines.slice(1) : lines;
            
            const jsonData = dataLines.map(line => {
                const values = line.split(',');
                if (includeHeaders) {
                    return headers.reduce((obj, header, index) => {
                        obj[header.trim()] = values[index]?.trim() || '';
                        return obj;
                    }, {} as Record<string, string>);
                } else {
                    return values.map(v => v.trim());
                }
            });
            
            return {
                status: 'success',
                data: {
                    format: 'json',
                    records: jsonData.length,
                    data: jsonData
                }
            };
        } catch (error) {
            return {
                status: 'error',
                error: {
                    code: 'conversion_error',
                    message: error.message
                }
            };
        }
    }
}
```

### Example 2: External API Integration Agent

```typescript
class APIIntegrationAgent extends BaseAgent {
    private httpClient: AxiosInstance;
    
    constructor() {
        super({
            id: 'api-integrator',
            name: 'API Integration Agent',
            description: 'Integrates with external APIs and services'
        });
        
        this.httpClient = axios.create({
            timeout: 30000,
            headers: { 'User-Agent': 'NewFuse-Agent/1.0' }
        });
    }
    
    defineCapabilities(): Capability[] {
        return [
            {
                id: 'external-api',
                name: 'External API Integration',
                description: 'Make requests to external APIs',
                actions: [
                    {
                        id: 'fetch-weather',
                        name: 'Fetch Weather Data',
                        description: 'Get weather information for a location',
                        parameters: [
                            { name: 'location', type: 'string', required: true, description: 'Location to get weather for' },
                            { name: 'units', type: 'string', required: false, description: 'Temperature units', default: 'metric' }
                        ]
                    }
                ]
            }
        ];
    }
    
    async handleExternalAPI(action: string, parameters: any): Promise<Response> {
        switch (action) {
            case 'fetch-weather':
                return await this.fetchWeatherData(parameters);
            default:
                throw new Error(`Unsupported action: ${action}`);
        }
    }
    
    private async fetchWeatherData(params: { location: string; units?: string }): Promise<Response> {
        try {
            const { location, units = 'metric' } = params;
            const apiKey = process.env.WEATHER_API_KEY;
            
            if (!apiKey) {
                throw new Error('Weather API key not configured');
            }
            
            const response = await this.httpClient.get(
                `https://api.openweathermap.org/data/2.5/weather`,
                {
                    params: {
                        q: location,
                        units,
                        appid: apiKey
                    }
                }
            );
            
            const weatherData = response.data;
            
            return {
                status: 'success',
                data: {
                    location: weatherData.name,
                    country: weatherData.sys.country,
                    temperature: weatherData.main.temp,
                    description: weatherData.weather[0].description,
                    humidity: weatherData.main.humidity,
                    windSpeed: weatherData.wind.speed,
                    units
                }
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return {
                    status: 'error',
                    error: {
                        code: 'api_error',
                        message: `Weather API error: ${error.response?.data?.message || error.message}`
                    }
                };
            }
            
            return {
                status: 'error',
                error: {
                    code: 'processing_error',
                    message: error.message
                }
            };
        }
    }
}
```

### Example 3: Database Agent

```typescript
class DatabaseAgent extends BaseAgent {
    private prisma: PrismaClient;
    
    constructor() {
        super({
            id: 'database-agent',
            name: 'Database Agent',
            description: 'Performs database operations with security constraints'
        });
        
        this.prisma = new PrismaClient();
    }
    
    defineCapabilities(): Capability[] {
        return [
            {
                id: 'database-operations',
                name: 'Database Operations',
                description: 'Perform read-only database operations',
                actions: [
                    {
                        id: 'query-data',
                        name: 'Query Data',
                        description: 'Execute a safe read-only query',
                        parameters: [
                            { name: 'table', type: 'string', required: true, description: 'Table to query' },
                            { name: 'fields', type: 'array', required: false, description: 'Fields to select' },
                            { name: 'filter', type: 'object', required: false, description: 'Filter conditions' },
                            { name: 'limit', type: 'number', required: false, description: 'Maximum number of records', default: 100 }
                        ]
                    }
                ]
            }
        ];
    }
    
    async handleDatabaseOperations(action: string, parameters: any): Promise<Response> {
        switch (action) {
            case 'query-data':
                return await this.queryData(parameters);
            default:
                throw new Error(`Unsupported action: ${action}`);
        }
    }
    
    private async queryData(params: { 
        table: string; 
        fields?: string[]; 
        filter?: any; 
        limit?: number 
    }): Promise<Response> {
        try {
            const { table, fields, filter, limit = 100 } = params;
            
            // Validate table access
            this.validateTableAccess(table);
            
            // Build query
            const selectObj = this.buildSelectObject(fields);
            const query = {
                select: selectObj,
                where: filter,
                take: Math.min(limit, 1000) // Enforce maximum limit
            };
            
            // Execute query using Prisma
            const results = await (this.prisma as any)[table].findMany(query);
            
            return {
                status: 'success',
                data: {
                    table,
                    records: results,
                    count: results.length
                }
            };
        } catch (error) {
            return {
                status: 'error',
                error: {
                    code: 'database_error',
                    message: error.message
                }
            };
        }
    }
    
    private validateTableAccess(table: string): void {
        const allowedTables = ['products', 'categories', 'public_data'];
        
        if (!allowedTables.includes(table)) {
            throw new Error(`Access to table '${table}' is not allowed`);
        }
    }
    
    private buildSelectObject(fields?: string[]): Record<string, boolean> | undefined {
        if (!fields || fields.length === 0) {
            return undefined; // Select all fields
        }
        
        return fields.reduce((acc, field) => {
            acc[field] = true;
            return acc;
        }, {} as Record<string, boolean>);
    }
}
```

### Agent Template Generator

```typescript
// Use this template to quickly create new agents
export class AgentTemplate extends BaseAgent {
    constructor(config: AgentConfig) {
        super(config);
    }
    
    defineCapabilities(): Capability[] {
        return [
            {
                id: 'your-capability-id',
                name: 'Your Capability Name',
                description: 'Description of what your capability does',
                actions: [
                    {
                        id: 'your-action-id',
                        name: 'Your Action Name',
                        description: 'Description of your action',
                        parameters: [
                            {
                                name: 'parameter1',
                                type: 'string',
                                required: true,
                                description: 'Description of parameter1'
                            }
                            // Add more parameters as needed
                        ]
                    }
                    // Add more actions as needed
                ]
            }
            // Add more capabilities as needed
        ];
    }
    
    async handleYourCapability(action: string, parameters: any): Promise<Response> {
        switch (action) {
            case 'your-action-id':
                return await this.handleYourAction(parameters);
            default:
                throw new Error(`Unsupported action: ${action}`);
        }
    }
    
    private async handleYourAction(parameters: any): Promise<Response> {
        try {
            // Implement your action logic here
            const result = await this.performYourOperation(parameters);
            
            return {
                status: 'success',
                data: result
            };
        } catch (error) {
            return {
                status: 'error',
                error: {
                    code: 'operation_error',
                    message: error.message
                }
            };
        }
    }
    
    private async performYourOperation(parameters: any): Promise<any> {
        // Your implementation here
        return {};
    }
}
```

## VS Code Integration

The New Fuse VS Code extension provides seamless integration with the A2A protocol:

```typescript
// Initialize the protocol registry
const protocolRegistry = new ProtocolRegistry(context);

// Initialize the unified communication manager
const communicationManager = new CommunicationManager(context, {
    agentId: 'thefuse.main',
    agentName: 'The New Fuse',
    capabilities: ['orchestration', 'agent-discovery', 'workflow-execution'],
    version: '1.0.0',
    apiVersion: '1.0.0',
    debug: false
});

// Initialize communication manager
communicationManager.initialize(redisClient).then(() => {
    console.log('Communication manager initialized');
}).catch(error => {
    console.error(`Error initializing communication manager: ${error.message}`);
});
```

## Support and Resources

### Getting Help

- **Documentation**: Complete documentation at [docs.newfuse.dev](https://docs.newfuse.dev)
- **Community**: Join our Discord community for discussions and support
- **GitHub**: Report issues and contribute at [github.com/newfuse/agents](https://github.com/newfuse/agents)
- **Support Email**: agent-support@newfuse.dev

### Additional Resources

- [MCP Specification](../protocols/MCP-COMPLETE-GUIDE.md)
- [API Documentation](../api/README.md)
- [Troubleshooting Guide](../troubleshooting/MCP-TROUBLESHOOTING-COMPLETE.md)
- [Getting Started Guide](../getting-started/COMPLETE-GETTING-STARTED.md)

---

This guide provides comprehensive information for developing, integrating, and deploying agents within The New Fuse platform. Follow the examples and best practices outlined here to create powerful, secure, and efficient agents that integrate seamlessly with the ecosystem.
