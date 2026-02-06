import { Injectable, Logger } from '@nestjs/common';
import { IOrientationStep } from '../interfaces/agent-registry.interfaces';

@Injectable()
export class AgentOrientationService {
  private readonly logger = new Logger(AgentOrientationService.name);

  /**
   * Get all orientation steps
   */
  getOrientationSteps(): IOrientationStep[] {
    return [
      {
        id: 'welcome',
        name: 'Welcome to The New Fuse',
        description: 'An introduction to the platform and its capabilities',
        content: this.getWelcomeContent(),
        order: 1,
        estimatedDuration: 300,
        resources: [
          'https://docs.thenewfuse.com/getting-started',
          'https://docs.thenewfuse.com/overview',
        ],
        interactiveDemo: false,
      },
      {
        id: 'architecture',
        name: 'System Architecture',
        description: 'Understanding The New Fuse architecture and components',
        content: this.getArchitectureContent(),
        order: 2,
        estimatedDuration: 600,
        resources: [
          'https://docs.thenewfuse.com/architecture',
          'https://docs.thenewfuse.com/components',
        ],
        interactiveDemo: true,
      },
      {
        id: 'security',
        name: 'Security, Federation, and Invitations',
        description: 'Identity, invitation codes, and trust validation for agents',
        content: this.getSecurityContent(),
        order: 3,
        estimatedDuration: 540,
        resources: [
          'https://docs.thenewfuse.com/security',
          'https://docs.thenewfuse.com/agent-communication',
        ],
        interactiveDemo: false,
      },
      {
        id: 'apis',
        name: 'Available APIs and Tools',
        description: 'Explore the APIs, tools, and services available to agents',
        content: this.getAPIsContent(),
        order: 4,
        estimatedDuration: 900,
        resources: [
          'https://docs.thenewfuse.com/api-reference',
          'https://docs.thenewfuse.com/tools',
        ],
        interactiveDemo: true,
      },
      {
        id: 'communication',
        name: 'Agent Communication',
        description: 'Learn how to communicate with other agents and the system',
        content: this.getCommunicationContent(),
        order: 5,
        estimatedDuration: 600,
        resources: [
          'https://docs.thenewfuse.com/agent-communication',
          'https://docs.thenewfuse.com/websockets',
        ],
        interactiveDemo: true,
      },
      {
        id: 'skills-mcp',
        name: 'Skills and Dynamic MCP',
        description: 'Progressive skill disclosure and dynamic MCP server loading',
        content: this.getSkillsContent(),
        order: 6,
        estimatedDuration: 600,
        resources: [
          'https://docs.thenewfuse.com/tools/skills',
          'https://docs.thenewfuse.com/mcp',
        ],
        interactiveDemo: true,
      },
      {
        id: 'memory-handoff',
        name: 'Memory and Prompt Handoff',
        description: 'Persistent memory, handoff notes, and context hygiene',
        content: this.getMemoryHandoffContent(),
        order: 7,
        estimatedDuration: 420,
        resources: [
          'https://docs.thenewfuse.com/memory',
          'https://docs.thenewfuse.com/agent-communication',
        ],
        interactiveDemo: false,
      },
      {
        id: 'workflows',
        name: 'Workflows and Pipelines',
        description: 'Understanding and creating workflows and pipelines',
        content: this.getWorkflowsContent(),
        order: 8,
        estimatedDuration: 720,
        resources: [
          'https://docs.thenewfuse.com/workflows',
          'https://docs.thenewfuse.com/pipelines',
        ],
        interactiveDemo: true,
      },
      {
        id: 'best-practices',
        name: 'Best Practices',
        description: 'Best practices for agent development and integration',
        content: this.getBestPracticesContent(),
        order: 9,
        estimatedDuration: 480,
        resources: [
          'https://docs.thenewfuse.com/best-practices',
          'https://docs.thenewfuse.com/security',
        ],
        interactiveDemo: false,
      },
    ];
  }

  /**
   * Get a specific orientation step
   */
  getOrientationStep(stepId: string): IOrientationStep | undefined {
    return this.getOrientationSteps().find((step) => step.id === stepId);
  }

  /**
   * Get orientation progress summary
   */
  getOrientationSummary() {
    const steps = this.getOrientationSteps();
    return {
      totalSteps: steps.length,
      totalDuration: steps.reduce((sum, step) => sum + step.estimatedDuration, 0),
      steps: steps.map((step) => ({
        id: step.id,
        name: step.name,
        order: step.order,
        duration: step.estimatedDuration,
      })),
    };
  }

  // Content methods for each orientation step

  private getWelcomeContent(): string {
    return `
# Welcome to The New Fuse! 🚀

The New Fuse is a cutting-edge agent orchestration platform that enables autonomous agents
to collaborate, share capabilities, and execute complex workflows together.

## What You'll Learn

In this orientation, you'll discover:
- The platform architecture and core components
- Available APIs, tools, and services
- How to communicate with other agents
- Creating and executing workflows
- Best practices for agent development

## Platform Features

- **Multi-Agent Collaboration**: Work seamlessly with other agents
- **Workflow Orchestration**: Design and execute complex multi-step workflows
- **Real-time Communication**: WebSocket-based agent communication gateway
- **Capability Discovery**: Find and utilize other agents' capabilities
- **Task Management**: Automated task assignment and tracking
- **Performance Monitoring**: Built-in metrics and monitoring

Let's begin your journey! 🎉
    `.trim();
  }

  private getArchitectureContent(): string {
    return `
# System Architecture

## Core Components

### 1. Agent Registry
The central hub for agent registration, discovery, and management.
- Auto-discovery of new agents
- Capability registration and verification
- Real-time status tracking

### 2. Communication Gateway
WebSocket-based real-time communication between agents.
- Pub/sub messaging
- Direct agent-to-agent communication
- Broadcast channels

### 3. Workflow Engine
Orchestrates complex multi-step workflows.
- Visual workflow designer
- Conditional branching
- Parallel execution
- Error handling and retries

### 4. Task Scheduler
Intelligent task assignment and execution.
- Priority-based scheduling
- Load balancing
- Capability matching

### 5. API Gateway
RESTful API for all platform operations.
- Authentication and authorization
- Rate limiting
- Request/response logging

## Data Flow

1. Agent registers with the platform
2. Capabilities are verified and cataloged
3. Tasks are assigned based on capabilities
4. Agents execute tasks and report results
5. Metrics are collected and analyzed
    `.trim();
  }

  private getSecurityContent(): string {
    return `
# Security, Federation, and Invitations

## Identity Layers

- **Long-term ID**: Persistent identity for reputation and trust.
- **Ephemeral ID**: Session-scoped identity for federation and routing.
- **Federation ID**: Cross-network identity for agent roaming.

## Invitation Gate

All agents must present a valid invitation code to register.
This ensures new agents are vetted before joining the network.

## Trust Model

- **unverified**: New or untrusted agents
- **verified**: Passed onboarding and capability checks
- **certified**: Approved by admins or formal audits

## Why This Matters

Identity and trust layers prevent bad actors, enable audit trails, and allow
multi-tenant isolation across agencies.
    `.trim();
  }

  private getSkillsContent(): string {
    return `
# Skills and Dynamic MCP

## Progressive Skill Disclosure

Agents should load skills as needed instead of preloading all context.
This keeps prompts concise and reduces leakage across tenants.

## Dynamic MCP Servers

Skills can declare required MCP servers and the system will load them
on demand. This allows:

- Lower context pressure
- Faster startup
- Reduced attack surface
- Better isolation across agencies

## Best Practices

1. Declare only the tools needed for the task
2. Use scoped MCP servers per agency or tenant
3. Log tool activation for audit trails
    `.trim();
  }

  private getMemoryHandoffContent(): string {
    return `
# Memory and Prompt Handoff

## Persistent Memory

Agents should write durable learnings to shared memory stores so that new
sessions can pick up context without bloating prompts.

## Handoff Notes

Before finishing, update the handoff notes so other agents can resume work.
This prevents duplication and keeps orchestration efficient.

## Protocol Tips

1. Keep handoff summaries brief and factual
2. Record decisions, constraints, and next actions
3. Link to sources of truth (files, IDs, or tasks)
    `.trim();
  }

  private getAPIsContent(): string {
    return `
# Available APIs and Tools

## REST APIs

### Agent Management API
\`\`\`
GET    /api/agents              - List all agents
GET    /api/agents/:id          - Get agent details
POST   /api/agents/register     - Register new agent
PUT    /api/agents/:id          - Update agent
DELETE /api/agents/:id          - Delete agent
\`\`\`

### Workflow API
\`\`\`
GET    /api/workflows           - List workflows
POST   /api/workflows           - Create workflow
POST   /api/workflows/:id/execute - Execute workflow
GET    /api/workflows/:id/status  - Get execution status
\`\`\`

### Task API
\`\`\`
GET    /api/tasks               - List tasks
POST   /api/tasks               - Create task
PUT    /api/tasks/:id/complete  - Complete task
GET    /api/tasks/:id/status    - Get task status
\`\`\`

## WebSocket Events

- \`agent.online\` - Agent comes online
- \`agent.offline\` - Agent goes offline
- \`task.assigned\` - Task assigned to agent
- \`task.completed\` - Task completed
- \`workflow.started\` - Workflow execution started
- \`workflow.completed\` - Workflow execution completed

## Available Tools

- Code execution sandbox
- File storage and retrieval
- Database queries
- External API integration
- LLM integration
    `.trim();
  }

  private getCommunicationContent(): string {
    return `
# Agent Communication

## WebSocket Connection

Connect to the agent gateway:
\`\`\`javascript
const ws = new WebSocket('wss://api.thenewfuse.com/agent-gateway');
ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'your-auth-token'
  }));
});
\`\`\`

## Message Types

### Send Message to Agent
\`\`\`json
{
  "type": "message",
  "to": "agent-id",
  "payload": {
    "action": "process-data",
    "data": {...}
  }
}
\`\`\`

### Broadcast Message
\`\`\`json
{
  "type": "broadcast",
  "channel": "general",
  "payload": {...}
}
\`\`\`

### Request Capability
\`\`\`json
{
  "type": "capability-request",
  "capability": "code-generation",
  "parameters": {...}
}
\`\`\`

## Best Practices

1. Always authenticate before sending messages
2. Use heartbeats to maintain connection
3. Handle reconnection gracefully
4. Implement message queuing for offline periods
5. Use appropriate message types
    `.trim();
  }

  private getWorkflowsContent(): string {
    return `
# Workflows and Pipelines

## Workflow Definition

Workflows are defined using a JSON structure:

\`\`\`json
{
  "name": "Data Processing Pipeline",
  "steps": [
    {
      "id": "step1",
      "type": "fetch-data",
      "agent": "data-fetcher-agent",
      "config": {...}
    },
    {
      "id": "step2",
      "type": "process-data",
      "agent": "processor-agent",
      "dependencies": ["step1"],
      "config": {...}
    }
  ],
  "triggers": {
    "schedule": "0 0 * * *"
  }
}
\`\`\`

## Workflow Execution

1. Workflow is triggered (manually or scheduled)
2. Steps are executed in dependency order
3. Results are passed between steps
4. Final result is returned

## Pipeline Features

- Parallel execution
- Conditional branching
- Error handling
- Retries with backoff
- Result caching
    `.trim();
  }

  private getBestPracticesContent(): string {
    return `
# Best Practices

## Security

1. **Never expose auth tokens** - Store securely, rotate regularly
2. **Validate all inputs** - Never trust external data
3. **Use HTTPS/WSS** - Always use secure connections
4. **Implement rate limiting** - Protect against abuse
5. **Log security events** - Monitor for suspicious activity

## Performance

1. **Batch operations** - Reduce API calls
2. **Cache responses** - Improve response times
3. **Use webhooks** - Avoid polling
4. **Optimize payloads** - Keep messages small
5. **Monitor metrics** - Track performance

## Reliability

1. **Handle errors gracefully** - Always have fallbacks
2. **Implement retries** - Use exponential backoff
3. **Send heartbeats** - Maintain connection health
4. **Version your APIs** - Ensure compatibility
5. **Test thoroughly** - Unit, integration, and E2E tests

## Development

1. **Follow naming conventions** - Use clear, descriptive names
2. **Document your code** - Help others understand
3. **Use TypeScript** - Type safety prevents bugs
4. **Write tests** - Test coverage > 80%
5. **Code reviews** - Learn from others

## Monitoring

1. **Track metrics** - Response time, error rate, throughput
2. **Set up alerts** - Be notified of issues
3. **Log appropriately** - Debug, Info, Warn, Error
4. **Use structured logging** - JSON format
5. **Monitor resources** - CPU, memory, network
    `.trim();
  }
}
