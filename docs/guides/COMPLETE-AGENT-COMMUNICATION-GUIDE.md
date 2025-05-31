# Complete Agent Communication Guide

This comprehensive guide consolidates all agent communication documentation including the TNF Agent Relay, inter-extension communication, workflow builder, and collaboration features.

## Table of Contents

1. [Agent Communication Overview](#agent-communication-overview)
2. [TNF Agent Relay System](#tnf-agent-relay-system)
3. [Agent Communication Protocols](#agent-communication-protocols)
4. [Inter-Extension Communication](#inter-extension-communication)
5. [Workflow Builder](#workflow-builder)
6. [Collaboration Features](#collaboration-features)
7. [Agent Monitoring](#agent-monitoring)
8. [Terminal Agent Integration](#terminal-agent-integration)
9. [VS Code Agent Integration](#vs-code-agent-integration)
10. [Advanced Configuration](#advanced-configuration)

## Agent Communication Overview

The New Fuse provides a comprehensive agent communication framework that enables AI agents to collaborate across different environments including VS Code extensions, Chrome extensions, terminal applications, and external services.

### Core Components

- **TNF Agent Relay** - Central communication hub for macOS
- **WebSocket Server** - Real-time communication backbone
- **Redis Bridge** - Persistent message queuing and storage
- **File Protocol** - Cross-platform message exchange
- **MCP Integration** - Model Context Protocol support

### Communication Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   VS Code       │    │   Chrome        │    │   Terminal      │
│   Extension     │    │   Extension     │    │   Agents        │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │   TNF Agent Relay         │
                    │   (Communication Hub)     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   Message Routing         │
                    │   - WebSocket Server      │
                    │   - Redis Bridge          │
                    │   - File Protocol         │
                    │   - MCP Integration       │
                    └───────────────────────────┘
```

## TNF Agent Relay System

### Overview

The TNF Agent Communication Relay is a macOS application that serves as the central communication hub for AI agents across different environments. It handles message routing, agent discovery, and protocol translation.

### Installation

#### Automatic Installation (Recommended)

```bash
# Download and install TNF Agent Relay
curl -sSL https://raw.githubusercontent.com/your-org/tnf-relay/main/install.sh | bash

# Or using the included script
bash scripts/install-tnf-relay.sh
```

#### Manual Installation

1. **Create the relay application:**
   ```bash
   # Navigate to the relay directory
   cd scripts/tnf-agent-relay

   # Run the creation script
   ./create-tnf-relay-direct.sh
   ```

2. **Grant system permissions:**
   - Open System Preferences → Security & Privacy → Privacy
   - Select "Accessibility" from the left sidebar
   - Click the lock to make changes
   - Click "+" and add TNF-Agent-Relay.app

3. **Launch the relay:**
   ```bash
   open ~/Desktop/TNF-Agent-Relay.app
   ```

### Relay Configuration

```applescript
-- TNF Agent Relay Configuration
property relayConfig : {
    -- Agent discovery settings
    agentDiscoveryInterval: 30,
    discoveryMethods: {"websocket", "redis", "file", "mcp"},
    
    -- Message handling
    messageRetryAttempts: 3,
    messageTimeout: 5000,
    maxQueueSize: 1000,
    
    -- Logging and monitoring
    logLevel: "info",
    logRetentionDays: 7,
    metricsEnabled: true,
    
    -- Protocol settings
    enabledProtocols: {"websocket", "redis", "file", "mcp"},
    websocketPort: 3711,
    redisConnection: "redis://localhost:6379",
    
    -- Security settings
    enableAuthentication: false,
    allowedOrigins: {"*"},
    rateLimitEnabled: true,
    maxConnectionsPerIP: 10
}
```

### Core Relay Functions

#### Agent Registration
```applescript
-- Register a new agent
on registerAgent(agentInfo)
    set agentID to (id of agentInfo)
    set agentRecord to {
        id: agentID,
        name: (name of agentInfo),
        type: (agentType of agentInfo),
        capabilities: (capabilities of agentInfo),
        status: "online",
        lastSeen: (current date),
        connectionInfo: (connectionInfo of agentInfo)
    }
    
    set end of agentRegistry to agentRecord
    logMessage("Agent registered: " & agentID, "info")
    
    -- Broadcast agent availability
    broadcastAgentStatus(agentID, "online")
end registerAgent
```

#### Message Routing
```applescript
-- Route message between agents
on routeMessage(messageData)
    set sourceAgent to (source of messageData)
    set targetAgent to (target of messageData)
    set messageContent to (content of messageData)
    
    -- Find target agent
    set targetInfo to findAgent(targetAgent)
    if targetInfo is missing value then
        logMessage("Target agent not found: " & targetAgent, "error")
        return false
    end if
    
    -- Route based on agent connection type
    set connectionType to (connectionType of targetInfo)
    if connectionType is "websocket" then
        return sendWebSocketMessage(targetInfo, messageData)
    else if connectionType is "redis" then
        return sendRedisMessage(targetInfo, messageData)
    else if connectionType is "file" then
        return sendFileMessage(targetInfo, messageData)
    else if connectionType is "mcp" then
        return sendMCPMessage(targetInfo, messageData)
    end if
end routeMessage
```

#### Agent Discovery
```applescript
-- Discover available agents
on discoverAgents()
    set discoveredAgents to {}
    
    -- WebSocket discovery
    set wsAgents to discoverWebSocketAgents()
    set discoveredAgents to discoveredAgents & wsAgents
    
    -- Redis discovery
    set redisAgents to discoverRedisAgents()
    set discoveredAgents to discoveredAgents & redisAgents
    
    -- File protocol discovery
    set fileAgents to discoverFileAgents()
    set discoveredAgents to discoveredAgents & fileAgents
    
    -- MCP discovery
    set mcpAgents to discoverMCPAgents()
    set discoveredAgents to discoveredAgents & mcpAgents
    
    -- Update agent registry
    updateAgentRegistry(discoveredAgents)
    
    return discoveredAgents
end discoverAgents
```

## Agent Communication Protocols

### WebSocket Protocol

#### Message Format
```typescript
interface AgentMessage {
  version: string;
  messageId: string;
  timestamp: number;
  source: {
    agentId: string;
    agentType: string;
    capabilities: string[];
  };
  target: {
    agentId: string;
    agentType?: string;
  };
  content: {
    type: 'request' | 'response' | 'event' | 'broadcast';
    action: string;
    data: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  metadata?: {
    correlationId?: string;
    sessionId?: string;
    context?: any;
  };
}
```

#### WebSocket Client Implementation
```typescript
class AgentWebSocketClient {
  private ws: WebSocket | null = null;
  private agentId: string;
  private capabilities: string[];
  private messageHandlers: Map<string, Function[]> = new Map();

  constructor(agentId: string, capabilities: string[]) {
    this.agentId = agentId;
    this.capabilities = capabilities;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:3711');
      
      this.ws.onopen = () => {
        this.registerAgent();
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onclose = () => {
        this.handleDisconnection();
      };

      this.ws.onerror = (error) => {
        reject(error);
      };
    });
  }

  private registerAgent() {
    const registrationMessage: AgentMessage = {
      version: '1.0',
      messageId: `reg-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        agentId: this.agentId,
        agentType: 'generic',
        capabilities: this.capabilities
      },
      target: {
        agentId: 'tnf-relay'
      },
      content: {
        type: 'request',
        action: 'register',
        data: {
          agentId: this.agentId,
          capabilities: this.capabilities,
          status: 'online'
        },
        priority: 'high'
      }
    };

    this.send(registrationMessage);
  }

  send(message: AgentMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(messageType: string, handler: Function): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  private handleMessage(message: AgentMessage): void {
    const handlers = this.messageHandlers.get(message.content.action) || [];
    handlers.forEach(handler => handler(message));
  }
}
```

### Redis Protocol

#### Redis Bridge Configuration
```typescript
import Redis from 'ioredis';

class RedisBridge {
  private redis: Redis;
  private subscriber: Redis;
  private agentId: string;

  constructor(agentId: string, redisUrl: string = 'redis://localhost:6379') {
    this.agentId = agentId;
    this.redis = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
  }

  async initialize(): Promise<void> {
    // Subscribe to agent-specific and broadcast channels
    await this.subscriber.subscribe(
      `agent:${this.agentId}`,
      'broadcast:all',
      'system:events'
    );

    this.subscriber.on('message', (channel, message) => {
      this.handleRedisMessage(channel, JSON.parse(message));
    });

    // Register agent in Redis
    await this.registerInRedis();
  }

  private async registerInRedis(): Promise<void> {
    const agentInfo = {
      agentId: this.agentId,
      status: 'online',
      lastSeen: Date.now(),
      capabilities: this.capabilities,
      connectionType: 'redis'
    };

    await this.redis.hset(
      'agents:registry',
      this.agentId,
      JSON.stringify(agentInfo)
    );

    // Set expiration for agent registration
    await this.redis.expire(`agent:${this.agentId}:heartbeat`, 60);
  }

  async sendMessage(targetAgentId: string, message: any): Promise<void> {
    const redisMessage = {
      ...message,
      timestamp: Date.now(),
      source: { agentId: this.agentId }
    };

    if (targetAgentId === 'broadcast') {
      await this.redis.publish('broadcast:all', JSON.stringify(redisMessage));
    } else {
      await this.redis.publish(
        `agent:${targetAgentId}`,
        JSON.stringify(redisMessage)
      );
    }
  }

  private handleRedisMessage(channel: string, message: any): void {
    // Process incoming Redis messages
    console.log(`Received message on ${channel}:`, message);
  }
}
```

### File Protocol

#### File-Based Communication
```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

class FileProtocol {
  private messagePath: string;
  private agentId: string;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.messagePath = path.join(
      process.env.HOME || process.env.USERPROFILE || '/tmp',
      '.tnf-messages'
    );
    
    // Ensure message directory exists
    if (!fs.existsSync(this.messagePath)) {
      fs.mkdirSync(this.messagePath, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    // Watch for incoming messages
    this.watcher = chokidar.watch(
      path.join(this.messagePath, 'incoming'),
      { ignoreInitial: true }
    );

    this.watcher.on('add', async (filePath) => {
      await this.processIncomingMessage(filePath);
    });

    // Create agent-specific directories
    const incomingPath = path.join(this.messagePath, 'incoming');
    const outgoingPath = path.join(this.messagePath, 'outgoing');
    
    [incomingPath, outgoingPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async sendMessage(targetAgentId: string, message: any): Promise<void> {
    const messageData = {
      ...message,
      source: { agentId: this.agentId },
      target: { agentId: targetAgentId },
      timestamp: Date.now(),
      messageId: `${this.agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const fileName = `${messageData.messageId}.json`;
    const filePath = path.join(this.messagePath, 'outgoing', fileName);

    await fs.promises.writeFile(
      filePath,
      JSON.stringify(messageData, null, 2)
    );
  }

  private async processIncomingMessage(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const message = JSON.parse(content);

      // Check if message is for this agent
      if (message.target.agentId === this.agentId || message.target.agentId === 'broadcast') {
        this.handleMessage(message);
      }

      // Clean up processed message
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error('Error processing message file:', error);
    }
  }

  private handleMessage(message: any): void {
    console.log('Received file message:', message);
    // Emit event or call handlers
  }

  cleanup(): void {
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
```

## Inter-Extension Communication

### VS Code ↔ Chrome Extension Communication

#### Shared Message Interface
```typescript
interface InterExtensionMessage {
  type: 'code-analysis' | 'ui-update' | 'sync-request' | 'collaboration';
  payload: any;
  source: 'vscode' | 'chrome';
  target: 'vscode' | 'chrome' | 'broadcast';
  timestamp: number;
  correlationId?: string;
}
```

#### VS Code Extension Communication Handler
```typescript
import * as vscode from 'vscode';

class VSCodeCommunicationHandler {
  private webSocketClient: AgentWebSocketClient;
  private fileProtocol: FileProtocol;

  constructor() {
    this.webSocketClient = new AgentWebSocketClient(
      'vscode-extension',
      ['code-analysis', 'file-operations', 'ui-integration']
    );
    this.fileProtocol = new FileProtocol('vscode-extension');
  }

  async initialize(): Promise<void> {
    await this.webSocketClient.connect();
    await this.fileProtocol.initialize();

    // Register message handlers
    this.webSocketClient.onMessage('code-analysis', this.handleCodeAnalysis.bind(this));
    this.webSocketClient.onMessage('ui-update', this.handleUIUpdate.bind(this));

    // Register VS Code commands
    this.registerCommands();
  }

  private registerCommands(): void {
    vscode.commands.registerCommand('thefuse.sendMessage', async () => {
      const message = await vscode.window.showInputBox({
        prompt: 'Enter message for Chrome extension'
      });

      if (message) {
        await this.sendToChromeExtension({
          type: 'collaboration',
          payload: { message },
          source: 'vscode',
          target: 'chrome',
          timestamp: Date.now()
        });
      }
    });
  }

  async sendToChromeExtension(message: InterExtensionMessage): Promise<void> {
    // Try WebSocket first, fallback to file protocol
    try {
      await this.webSocketClient.send({
        version: '1.0',
        messageId: `vscode-${Date.now()}`,
        timestamp: Date.now(),
        source: {
          agentId: 'vscode-extension',
          agentType: 'vscode',
          capabilities: ['code-analysis', 'file-operations']
        },
        target: {
          agentId: 'chrome-extension'
        },
        content: {
          type: 'request',
          action: message.type,
          data: message.payload,
          priority: 'medium'
        }
      });
    } catch (error) {
      // Fallback to file protocol
      await this.fileProtocol.sendMessage('chrome-extension', message);
    }
  }

  private handleCodeAnalysis(message: any): void {
    // Handle code analysis requests from other extensions
    const { code, language } = message.content.data;
    
    // Perform VS Code specific analysis
    const analysis = this.analyzeCode(code, language);
    
    // Send response back
    this.webSocketClient.send({
      version: '1.0',
      messageId: `response-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        agentId: 'vscode-extension',
        agentType: 'vscode',
        capabilities: ['code-analysis']
      },
      target: {
        agentId: message.source.agentId
      },
      content: {
        type: 'response',
        action: 'code-analysis-result',
        data: analysis,
        priority: 'medium'
      },
      metadata: {
        correlationId: message.messageId
      }
    });
  }
}
```

#### Chrome Extension Communication Handler
```typescript
class ChromeCommunicationHandler {
  private webSocketClient: WebSocket | null = null;
  private messageQueue: any[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    await this.connectWebSocket();
    this.setupMessageListeners();
  }

  private async connectWebSocket(): Promise<void> {
    try {
      this.webSocketClient = new WebSocket('ws://localhost:3711');
      
      this.webSocketClient.onopen = () => {
        console.log('Chrome extension connected to TNF relay');
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
        this.registerWithRelay();
      };

      this.webSocketClient.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.webSocketClient.onclose = () => {
        this.handleDisconnection();
      };

      this.webSocketClient.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.handleDisconnection();
    }
  }

  private registerWithRelay(): void {
    const registrationMessage = {
      version: '1.0',
      messageId: `chrome-reg-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        agentId: 'chrome-extension',
        agentType: 'chrome',
        capabilities: ['web-interaction', 'dom-manipulation', 'user-interface']
      },
      target: {
        agentId: 'tnf-relay'
      },
      content: {
        type: 'request',
        action: 'register',
        data: {
          agentId: 'chrome-extension',
          status: 'online'
        },
        priority: 'high'
      }
    };

    this.send(registrationMessage);
  }

  send(message: any): void {
    if (this.webSocketClient && this.webSocketClient.readyState === WebSocket.OPEN) {
      this.webSocketClient.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  private handleDisconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      
      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.connectWebSocket();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: any): void {
    switch (message.content.action) {
      case 'ui-update':
        this.handleUIUpdate(message.content.data);
        break;
      case 'dom-manipulation':
        this.handleDOMManipulation(message.content.data);
        break;
      case 'collaboration-request':
        this.handleCollaborationRequest(message.content.data);
        break;
    }
  }
}
```

## Workflow Builder

### Workflow Definition

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: Record<string, any>;
  metadata: {
    author: string;
    created: string;
    modified: string;
    tags: string[];
  };
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent-task' | 'user-input' | 'condition' | 'loop' | 'parallel';
  agentId?: string;
  action: string;
  inputs: Record<string, any>;
  outputs: Record<string, string>;
  conditions?: WorkflowCondition[];
  nextSteps: string[];
  errorHandling: {
    retryCount: number;
    fallbackStep?: string;
    continueOnError: boolean;
  };
}

interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'event' | 'webhook';
  configuration: any;
  enabled: boolean;
}
```

### Workflow Engine Implementation

```typescript
class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executionContext: Map<string, WorkflowExecution> = new Map();
  private agentRegistry: AgentRegistry;

  constructor(agentRegistry: AgentRegistry) {
    this.agentRegistry = agentRegistry;
  }

  async executeWorkflow(workflowId: string, inputs: Record<string, any>): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflowId,
      status: 'running',
      startTime: Date.now(),
      currentStep: workflow.steps[0].id,
      variables: { ...workflow.variables, ...inputs },
      stepResults: new Map(),
      errors: []
    };

    this.executionContext.set(executionId, execution);

    try {
      await this.executeStep(execution, workflow.steps[0]);
      return executionId;
    } catch (error) {
      execution.status = 'failed';
      execution.errors.push(error.message);
      throw error;
    }
  }

  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    execution.currentStep = step.id;

    try {
      let stepResult: any;

      switch (step.type) {
        case 'agent-task':
          stepResult = await this.executeAgentTask(step, execution.variables);
          break;
        case 'user-input':
          stepResult = await this.executeUserInput(step);
          break;
        case 'condition':
          stepResult = await this.executeCondition(step, execution.variables);
          break;
        case 'parallel':
          stepResult = await this.executeParallel(step, execution);
          break;
      }

      execution.stepResults.set(step.id, stepResult);

      // Update variables with step outputs
      if (step.outputs) {
        Object.entries(step.outputs).forEach(([outputKey, variableName]) => {
          if (stepResult && stepResult[outputKey] !== undefined) {
            execution.variables[variableName] = stepResult[outputKey];
          }
        });
      }

      // Execute next steps
      for (const nextStepId of step.nextSteps) {
        const workflow = this.workflows.get(execution.workflowId)!;
        const nextStep = workflow.steps.find(s => s.id === nextStepId);
        if (nextStep) {
          await this.executeStep(execution, nextStep);
        }
      }

    } catch (error) {
      await this.handleStepError(execution, step, error);
    }
  }

  private async executeAgentTask(step: WorkflowStep, variables: Record<string, any>): Promise<any> {
    const agent = this.agentRegistry.getAgent(step.agentId!);
    if (!agent) {
      throw new Error(`Agent not found: ${step.agentId}`);
    }

    // Resolve input variables
    const resolvedInputs = this.resolveVariables(step.inputs, variables);

    // Send task to agent
    const taskMessage = {
      version: '1.0',
      messageId: `task-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        agentId: 'workflow-engine',
        agentType: 'system',
        capabilities: ['workflow-execution']
      },
      target: {
        agentId: step.agentId
      },
      content: {
        type: 'request',
        action: step.action,
        data: resolvedInputs,
        priority: 'medium'
      }
    };

    return await agent.sendMessage(taskMessage);
  }

  private resolveVariables(inputs: Record<string, any>, variables: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};

    Object.entries(inputs).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // Variable reference
        const variableName = value.slice(2, -2).trim();
        resolved[key] = variables[variableName];
      } else {
        resolved[key] = value;
      }
    });

    return resolved;
  }
}
```

## Collaboration Features

### Real-Time Collaboration

```typescript
class CollaborationManager {
  private sessions: Map<string, CollaborationSession> = new Map();
  private webSocketServer: WebSocketServer;

  constructor() {
    this.webSocketServer = new WebSocketServer({ port: 3712 });
    this.setupWebSocketHandlers();
  }

  createSession(initiatorId: string, participants: string[]): string {
    const sessionId = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CollaborationSession = {
      id: sessionId,
      initiator: initiatorId,
      participants: new Set(participants),
      activeParticipants: new Set(),
      sharedState: {},
      messageHistory: [],
      startTime: Date.now(),
      status: 'active'
    };

    this.sessions.set(sessionId, session);

    // Invite participants
    participants.forEach(participantId => {
      this.inviteParticipant(sessionId, participantId);
    });

    return sessionId;
  }

  joinSession(sessionId: string, participantId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.participants.has(participantId)) {
      return false;
    }

    session.activeParticipants.add(participantId);
    
    // Notify other participants
    this.broadcastToSession(sessionId, {
      type: 'participant-joined',
      participantId,
      timestamp: Date.now()
    }, participantId);

    return true;
  }

  shareCodeChanges(sessionId: string, participantId: string, changes: CodeChange[]): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.activeParticipants.has(participantId)) {
      return;
    }

    const changeMessage = {
      type: 'code-changes',
      participantId,
      changes,
      timestamp: Date.now()
    };

    session.messageHistory.push(changeMessage);
    this.broadcastToSession(sessionId, changeMessage, participantId);
  }

  private broadcastToSession(sessionId: string, message: any, excludeParticipant?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.activeParticipants.forEach(participantId => {
      if (participantId !== excludeParticipant) {
        this.sendToParticipant(participantId, {
          sessionId,
          ...message
        });
      }
    });
  }

  private sendToParticipant(participantId: string, message: any): void {
    // Send via appropriate communication channel
    // This could be WebSocket, agent relay, etc.
  }
}

interface CollaborationSession {
  id: string;
  initiator: string;
  participants: Set<string>;
  activeParticipants: Set<string>;
  sharedState: Record<string, any>;
  messageHistory: any[];
  startTime: number;
  status: 'active' | 'paused' | 'ended';
}

interface CodeChange {
  file: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  newText: string;
  changeType: 'insert' | 'delete' | 'replace';
}
```

### Collaborative Completion

```typescript
class CollaborativeCompletion {
  private completionSessions: Map<string, CompletionSession> = new Map();
  private agentClients: Map<string, AgentWebSocketClient> = new Map();

  async requestCollaborativeCompletion(
    code: string,
    position: Position,
    context: CompletionContext
  ): Promise<CompletionResult[]> {
    
    const sessionId = `completion-${Date.now()}`;
    const session: CompletionSession = {
      id: sessionId,
      code,
      position,
      context,
      responses: [],
      startTime: Date.now()
    };

    this.completionSessions.set(sessionId, session);

    // Request completions from multiple agents
    const agentRequests = [
      this.requestFromAgent('copilot-agent', code, position, context),
      this.requestFromAgent('claude-agent', code, position, context),
      this.requestFromAgent('local-analyzer', code, position, context)
    ];

    const responses = await Promise.allSettled(agentRequests);
    const validResponses = responses
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<CompletionResult>).value);

    // Merge and rank completions
    const mergedCompletions = this.mergeCompletions(validResponses);
    session.responses = mergedCompletions;

    return mergedCompletions;
  }

  private async requestFromAgent(
    agentId: string,
    code: string,
    position: Position,
    context: CompletionContext
  ): Promise<CompletionResult> {
    
    const agent = this.agentClients.get(agentId);
    if (!agent) {
      throw new Error(`Agent not available: ${agentId}`);
    }

    const requestMessage = {
      version: '1.0',
      messageId: `completion-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        agentId: 'completion-manager',
        agentType: 'system',
        capabilities: ['completion-coordination']
      },
      target: {
        agentId: agentId
      },
      content: {
        type: 'request',
        action: 'code-completion',
        data: {
          code,
          position,
          context
        },
        priority: 'high'
      }
    };

    return await agent.send(requestMessage);
  }

  private mergeCompletions(responses: CompletionResult[]): CompletionResult[] {
    // Implement completion merging logic
    // This could involve ranking, deduplication, and quality scoring
    return responses.sort((a, b) => b.confidence - a.confidence);
  }
}
```

## Agent Monitoring

### Monitoring Dashboard

```typescript
class AgentMonitoringDashboard {
  private metrics: Map<string, AgentMetrics> = new Map();
  private healthChecks: Map<string, HealthCheckResult> = new Map();

  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    const metrics = this.metrics.get(agentId);
    const health = this.healthChecks.get(agentId);

    return {
      agentId,
      status: health?.status || 'unknown',
      lastSeen: metrics?.lastActivity || 0,
      messageCount: metrics?.messageCount || 0,
      errorCount: metrics?.errorCount || 0,
      averageResponseTime: metrics?.averageResponseTime || 0,
      capabilities: metrics?.capabilities || [],
      memoryUsage: health?.memoryUsage || 0,
      cpuUsage: health?.cpuUsage || 0
    };
  }

  async performHealthCheck(agentId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Send ping message to agent
      const pingResult = await this.pingAgent(agentId);
      const responseTime = Date.now() - startTime;

      const healthResult: HealthCheckResult = {
        agentId,
        status: 'healthy',
        responseTime,
        timestamp: Date.now(),
        memoryUsage: pingResult.memoryUsage || 0,
        cpuUsage: pingResult.cpuUsage || 0,
        errors: []
      };

      this.healthChecks.set(agentId, healthResult);
      return healthResult;

    } catch (error) {
      const healthResult: HealthCheckResult = {
        agentId,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: Date.now(),
        memoryUsage: 0,
        cpuUsage: 0,
        errors: [error.message]
      };

      this.healthChecks.set(agentId, healthResult);
      return healthResult;
    }
  }

  private async pingAgent(agentId: string): Promise<any> {
    // Implementation depends on agent communication method
    return { status: 'ok', memoryUsage: 0, cpuUsage: 0 };
  }

  generateReport(): MonitoringReport {
    const agentStatuses = Array.from(this.metrics.keys()).map(agentId => 
      this.getAgentStatus(agentId)
    );

    return {
      timestamp: Date.now(),
      totalAgents: agentStatuses.length,
      healthyAgents: agentStatuses.filter(a => a.status === 'healthy').length,
      unhealthyAgents: agentStatuses.filter(a => a.status === 'unhealthy').length,
      totalMessages: agentStatuses.reduce((sum, a) => sum + a.messageCount, 0),
      totalErrors: agentStatuses.reduce((sum, a) => sum + a.errorCount, 0),
      averageResponseTime: agentStatuses.reduce((sum, a) => sum + a.averageResponseTime, 0) / agentStatuses.length,
      agentDetails: agentStatuses
    };
  }
}
```

## Terminal Agent Integration

### Terminal Agent Implementation

```bash
#!/bin/bash
# TNF Terminal Agent

# Configuration
AGENT_ID="tnf-terminal-agent"
RELAY_PORT=3711
LOG_FILE="$HOME/.tnf/terminal-agent.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Register with TNF relay
register_agent() {
    log "Registering terminal agent with TNF relay"
    
    # Create registration message
    cat > /tmp/tnf-register.json << EOF
{
    "version": "1.0",
    "messageId": "terminal-reg-$(date +%s)",
    "timestamp": $(date +%s)000,
    "source": {
        "agentId": "$AGENT_ID",
        "agentType": "terminal",
        "capabilities": ["shell-execution", "file-operations", "system-monitoring"]
    },
    "target": {
        "agentId": "tnf-relay"
    },
    "content": {
        "type": "request",
        "action": "register",
        "data": {
            "agentId": "$AGENT_ID",
            "status": "online",
            "environment": {
                "shell": "$SHELL",
                "platform": "$(uname -s)",
                "arch": "$(uname -m)"
            }
        },
        "priority": "high"
    }
}
EOF

    # Send registration via curl if WebSocket is available
    if command -v curl > /dev/null; then
        curl -s -X POST "http://localhost:$RELAY_PORT/register" \
            -H "Content-Type: application/json" \
            -d @/tmp/tnf-register.json || log "Failed to register via HTTP"
    fi
    
    # Also try file protocol
    cp /tmp/tnf-register.json "$HOME/.tnf-messages/outgoing/" 2>/dev/null || true
    
    rm -f /tmp/tnf-register.json
}

# Handle incoming commands
handle_command() {
    local message="$1"
    local action=$(echo "$message" | jq -r '.content.action')
    local data=$(echo "$message" | jq -r '.content.data')
    
    case "$action" in
        "execute-shell")
            execute_shell_command "$data"
            ;;
        "list-files")
            list_files "$data"
            ;;
        "monitor-system")
            monitor_system
            ;;
        *)
            log "Unknown action: $action"
            ;;
    esac
}

# Execute shell command
execute_shell_command() {
    local command_data="$1"
    local command=$(echo "$command_data" | jq -r '.command')
    local working_dir=$(echo "$command_data" | jq -r '.workingDirectory // "."')
    
    log "Executing command: $command in directory: $working_dir"
    
    # Change to working directory
    cd "$working_dir" || {
        send_error "Failed to change to directory: $working_dir"
        return 1
    }
    
    # Execute command and capture output
    local output
    local exit_code
    output=$(eval "$command" 2>&1)
    exit_code=$?
    
    # Send result back
    send_command_result "$command" "$output" "$exit_code"
}

# Send command result
send_command_result() {
    local command="$1"
    local output="$2"
    local exit_code="$3"
    
    cat > /tmp/tnf-result.json << EOF
{
    "version": "1.0",
    "messageId": "terminal-result-$(date +%s)",
    "timestamp": $(date +%s)000,
    "source": {
        "agentId": "$AGENT_ID",
        "agentType": "terminal",
        "capabilities": ["shell-execution"]
    },
    "target": {
        "agentId": "request-sender"
    },
    "content": {
        "type": "response",
        "action": "command-result",
        "data": {
            "command": "$command",
            "output": "$output",
            "exitCode": $exit_code,
            "timestamp": $(date +%s)
        },
        "priority": "medium"
    }
}
EOF

    # Send via file protocol
    cp /tmp/tnf-result.json "$HOME/.tnf-messages/outgoing/" 2>/dev/null || true
    rm -f /tmp/tnf-result.json
}

# Monitor for incoming messages
monitor_messages() {
    local message_dir="$HOME/.tnf-messages/incoming"
    
    if ! command -v fswatch > /dev/null; then
        log "fswatch not available, using polling"
        poll_messages
        return
    fi
    
    log "Monitoring for messages using fswatch"
    fswatch -o "$message_dir" | while read num_changes; do
        for file in "$message_dir"/*.json; do
            if [[ -f "$file" ]]; then
                handle_message_file "$file"
            fi
        done
    done
}

# Polling fallback for message monitoring
poll_messages() {
    local message_dir="$HOME/.tnf-messages/incoming"
    
    while true; do
        for file in "$message_dir"/*.json; do
            if [[ -f "$file" ]]; then
                handle_message_file "$file"
            fi
        done
        sleep 1
    done
}

# Handle individual message file
handle_message_file() {
    local file="$1"
    local message
    
    message=$(cat "$file" 2>/dev/null) || return
    
    # Check if message is for this agent
    local target_agent=$(echo "$message" | jq -r '.target.agentId')
    if [[ "$target_agent" == "$AGENT_ID" || "$target_agent" == "broadcast" ]]; then
        log "Processing message from file: $(basename "$file")"
        handle_command "$message"
    fi
    
    # Remove processed message
    rm -f "$file"
}

# Main execution
main() {
    log "Starting TNF Terminal Agent"
    
    # Create necessary directories
    mkdir -p "$HOME/.tnf-messages/incoming"
    mkdir -p "$HOME/.tnf-messages/outgoing"
    
    # Register with relay
    register_agent
    
    # Start monitoring for messages
    monitor_messages
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

## VS Code Agent Integration

### VS Code Agent Extension

```typescript
import * as vscode from 'vscode';

class VSCodeAgent {
  private agentId = 'vscode-agent';
  private capabilities = [
    'code-analysis',
    'file-operations',
    'ui-interaction',
    'debugging',
    'git-operations'
  ];
  
  private webSocketClient: AgentWebSocketClient;
  private statusBarItem: vscode.StatusBarItem;
  private outputChannel: vscode.OutputChannel;

  constructor(context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel('TNF VS Code Agent');
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 
      100
    );
    
    this.initialize(context);
  }

  private async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.statusBarItem.text = '$(loading~spin) TNF Connecting...';
    this.statusBarItem.show();

    try {
      this.webSocketClient = new AgentWebSocketClient(this.agentId, this.capabilities);
      await this.webSocketClient.connect();
      
      this.statusBarItem.text = '$(check) TNF Connected';
      this.statusBarItem.color = '#00ff00';
      
      this.registerMessageHandlers();
      this.registerCommands(context);
      
      this.outputChannel.appendLine('TNF VS Code Agent initialized successfully');
    } catch (error) {
      this.statusBarItem.text = '$(error) TNF Error';
      this.statusBarItem.color = '#ff0000';
      this.outputChannel.appendLine(`Failed to initialize: ${error.message}`);
    }
  }

  private registerMessageHandlers(): void {
    this.webSocketClient.onMessage('analyze-code', this.handleCodeAnalysis.bind(this));
    this.webSocketClient.onMessage('run-command', this.handleRunCommand.bind(this));
    this.webSocketClient.onMessage('get-file-content', this.handleGetFileContent.bind(this));
    this.webSocketClient.onMessage('write-file', this.handleWriteFile.bind(this));
    this.webSocketClient.onMessage('git-operation', this.handleGitOperation.bind(this));
  }

  private registerCommands(context: vscode.ExtensionContext): void {
    const commands = [
      vscode.commands.registerCommand('tnf.sendMessage', this.sendMessage.bind(this)),
      vscode.commands.registerCommand('tnf.analyzeCurrentFile', this.analyzeCurrentFile.bind(this)),
      vscode.commands.registerCommand('tnf.startCollaboration', this.startCollaboration.bind(this)),
      vscode.commands.registerCommand('tnf.showAgentStatus', this.showAgentStatus.bind(this))
    ];

    commands.forEach(cmd => context.subscriptions.push(cmd));
  }

  private async handleCodeAnalysis(message: any): Promise<void> {
    const { code, language, analysisType } = message.content.data;
    
    try {
      let analysis: any;
      
      switch (analysisType) {
        case 'syntax':
          analysis = await this.performSyntaxAnalysis(code, language);
          break;
        case 'complexity':
          analysis = await this.performComplexityAnalysis(code, language);
          break;
        case 'security':
          analysis = await this.performSecurityAnalysis(code, language);
          break;
        default:
          analysis = await this.performFullAnalysis(code, language);
      }

      await this.sendResponse(message, {
        success: true,
        analysis,
        timestamp: Date.now()
      });
    } catch (error) {
      await this.sendError(message, error.message);
    }
  }

  private async performSyntaxAnalysis(code: string, language: string): Promise<any> {
    // Use VS Code's built-in language services
    const document = await vscode.workspace.openTextDocument({
      content: code,
      language: language
    });

    // Get diagnostics from VS Code
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    
    return {
      type: 'syntax',
      issues: diagnostics.map(diag => ({
        severity: diag.severity,
        message: diag.message,
        range: {
          start: { line: diag.range.start.line, character: diag.range.start.character },
          end: { line: diag.range.end.line, character: diag.range.end.character }
        },
        source: diag.source
      })),
      isValid: diagnostics.length === 0
    };
  }

  private async handleRunCommand(message: any): Promise<void> {
    const { command, args } = message.content.data;
    
    try {
      // Execute VS Code command
      const result = await vscode.commands.executeCommand(command, ...args);
      
      await this.sendResponse(message, {
        success: true,
        result,
        command,
        timestamp: Date.now()
      });
    } catch (error) {
      await this.sendError(message, `Command execution failed: ${error.message}`);
    }
  }

  private async handleGetFileContent(message: any): Promise<void> {
    const { filePath } = message.content.data;
    
    try {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      
      await this.sendResponse(message, {
        success: true,
        content: document.getText(),
        language: document.languageId,
        lineCount: document.lineCount,
        filePath,
        timestamp: Date.now()
      });
    } catch (error) {
      await this.sendError(message, `Failed to read file: ${error.message}`);
    }
  }

  private async handleWriteFile(message: any): Promise<void> {
    const { filePath, content, createIfNotExists } = message.content.data;
    
    try {
      const uri = vscode.Uri.file(filePath);
      
      // Check if file exists
      try {
        await vscode.workspace.fs.stat(uri);
      } catch {
        if (!createIfNotExists) {
          throw new Error('File does not exist and createIfNotExists is false');
        }
      }
      
      await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
      
      await this.sendResponse(message, {
        success: true,
        filePath,
        bytesWritten: Buffer.byteLength(content, 'utf8'),
        timestamp: Date.now()
      });
    } catch (error) {
      await this.sendError(message, `Failed to write file: ${error.message}`);
    }
  }

  private async sendResponse(originalMessage: any, data: any): Promise<void> {
    const response = {
      version: '1.0',
      messageId: `vscode-response-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        agentId: this.agentId,
        agentType: 'vscode',
        capabilities: this.capabilities
      },
      target: {
        agentId: originalMessage.source.agentId
      },
      content: {
        type: 'response',
        action: `${originalMessage.content.action}-result`,
        data,
        priority: 'medium'
      },
      metadata: {
        correlationId: originalMessage.messageId
      }
    };

    await this.webSocketClient.send(response);
  }

  private async sendError(originalMessage: any, errorMessage: string): Promise<void> {
    const response = {
      version: '1.0',
      messageId: `vscode-error-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        agentId: this.agentId,
        agentType: 'vscode',
        capabilities: this.capabilities
      },
      target: {
        agentId: originalMessage.source.agentId
      },
      content: {
        type: 'response',
        action: 'error',
        data: {
          error: errorMessage,
          originalAction: originalMessage.content.action
        },
        priority: 'high'
      },
      metadata: {
        correlationId: originalMessage.messageId
      }
    };

    await this.webSocketClient.send(response);
  }

  dispose(): void {
    this.statusBarItem.dispose();
    this.outputChannel.dispose();
    if (this.webSocketClient) {
      this.webSocketClient.disconnect();
    }
  }
}
```

## Advanced Configuration

### Agent Configuration Schema

```typescript
interface AgentConfiguration {
  agentId: string;
  agentType: 'vscode' | 'chrome' | 'terminal' | 'service' | 'relay';
  displayName: string;
  description: string;
  version: string;
  
  capabilities: AgentCapability[];
  protocols: ProtocolConfiguration[];
  
  communication: {
    primaryProtocol: 'websocket' | 'redis' | 'file' | 'mcp';
    fallbackProtocols: string[];
    maxRetries: number;
    timeoutMs: number;
    heartbeatIntervalMs: number;
  };
  
  resources: {
    maxMemoryMB: number;
    maxCpuPercent: number;
    maxConcurrentTasks: number;
  };
  
  security: {
    authenticationRequired: boolean;
    allowedOrigins: string[];
    rateLimitRpm: number;
    encryptionEnabled: boolean;
  };
  
  monitoring: {
    metricsEnabled: boolean;
    healthCheckIntervalMs: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logRetentionDays: number;
  };
  
  customSettings: Record<string, any>;
}

interface AgentCapability {
  name: string;
  version: string;
  description: string;
  parameters: CapabilityParameter[];
  permissions: string[];
}

interface ProtocolConfiguration {
  type: 'websocket' | 'redis' | 'file' | 'mcp';
  enabled: boolean;
  configuration: Record<string, any>;
  priority: number;
}
```

### Configuration Management

```typescript
class ConfigurationManager {
  private configPath: string;
  private configurations: Map<string, AgentConfiguration> = new Map();

  constructor(configPath: string) {
    this.configPath = configPath;
    this.loadConfigurations();
  }

  async loadConfigurations(): Promise<void> {
    try {
      const configFiles = await fs.promises.readdir(this.configPath);
      
      for (const file of configFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.configPath, file);
          const configData = await fs.promises.readFile(filePath, 'utf8');
          const config: AgentConfiguration = JSON.parse(configData);
          
          // Validate configuration
          this.validateConfiguration(config);
          
          this.configurations.set(config.agentId, config);
        }
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  }

  getConfiguration(agentId: string): AgentConfiguration | undefined {
    return this.configurations.get(agentId);
  }

  async updateConfiguration(agentId: string, updates: Partial<AgentConfiguration>): Promise<void> {
    const existing = this.configurations.get(agentId);
    if (!existing) {
      throw new Error(`Configuration not found for agent: ${agentId}`);
    }

    const updated = { ...existing, ...updates };
    this.validateConfiguration(updated);
    
    this.configurations.set(agentId, updated);
    
    // Save to file
    const filePath = path.join(this.configPath, `${agentId}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(updated, null, 2));
  }

  private validateConfiguration(config: AgentConfiguration): void {
    // Implement configuration validation logic
    if (!config.agentId || !config.agentType) {
      throw new Error('Invalid configuration: agentId and agentType are required');
    }
    
    // Validate capabilities
    if (!Array.isArray(config.capabilities)) {
      throw new Error('Invalid configuration: capabilities must be an array');
    }
    
    // Validate protocols
    if (!Array.isArray(config.protocols)) {
      throw new Error('Invalid configuration: protocols must be an array');
    }
  }
}
```

This complete agent communication guide consolidates all agent-related documentation including the TNF Agent Relay system, communication protocols, inter-extension communication, workflow builder, collaboration features, monitoring capabilities, and advanced configuration options. All technical details and implementation examples have been preserved while providing a comprehensive reference for agent communication development and deployment.
