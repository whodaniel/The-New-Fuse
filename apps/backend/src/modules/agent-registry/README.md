# Agent Registry System

A comprehensive agent registration, onboarding, and orientation system for The New Fuse platform.

## Features

### 1. Agent Registration
- **Auto-discovery**: Agents automatically register when they come online
- **Capability Declaration**: Agents declare their capabilities during registration
- **Metadata Collection**: Capture agent name, version, author, and custom metadata
- **Authentication**: Generate secure authentication tokens for each agent

### 2. Onboarding Process
- **Welcome Messages**: Personalized welcome messages with system overview
- **Capability Verification**: Automated testing of declared capabilities
- **Integration Testing**: Verify integration with existing agents and services
- **Task Assignment**: Assign initial tasks to verify agent functionality

### 3. Orientation System
- **Framework Tour**: Interactive tour of The New Fuse platform
- **Documentation**: Access to comprehensive API and tool documentation
- **Best Practices**: Learn development and security best practices
- **Step-by-step Guidance**: Progressive orientation with tracked progress

### 4. Agent Directory
- **Searchable Registry**: Find agents by name, capability, category, or tags
- **Capability Discovery**: Browse agents by their declared capabilities
- **Real-time Status**: Track online/offline status of all agents
- **Performance Metrics**: View agent performance and usage statistics

## API Endpoints

### Registration

#### Register New Agent
```http
POST /api/agent-registry/register
Content-Type: application/json

{
  "name": "CodeAssistantAgent",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "An AI-powered code assistant",
  "capabilities": [
    {
      "name": "code_generation",
      "type": "core",
      "version": "1.0.0",
      "description": "Generate code snippets"
    }
  ],
  "metadata": {
    "environment": "production"
  },
  "heartbeatInterval": 60000
}
```

Response:
```json
{
  "registrationId": "reg-uuid",
  "agentId": "agent-uuid",
  "authToken": "tnf_agent_xxxxx",
  "verificationStatus": "PENDING",
  "onboardingStatus": "INITIALIZED",
  "welcomeMessage": "Welcome to The New Fuse...",
  "nextSteps": [
    "Complete capability verification tests",
    "Review The New Fuse framework documentation",
    ...
  ],
  "onboardingUrl": "/api/agent-registry/onboarding/reg-uuid",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### Send Heartbeat
```http
POST /api/agent-registry/heartbeat
X-Agent-Token: tnf_agent_xxxxx
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Onboarding

#### Start Onboarding
```http
POST /api/agent-registry/onboarding/{registrationId}/start
X-Agent-Token: tnf_agent_xxxxx
```

#### Test Capabilities
```http
POST /api/agent-registry/onboarding/{registrationId}/test-capabilities
X-Agent-Token: tnf_agent_xxxxx
```

Response:
```json
[
  {
    "capabilityName": "code_generation",
    "passed": true,
    "score": 0.95,
    "details": "Capability verified successfully",
    "errors": []
  }
]
```

#### Complete Onboarding Step
```http
POST /api/agent-registry/onboarding/{registrationId}/complete-step
X-Agent-Token: tnf_agent_xxxxx
Content-Type: application/json

{
  "stepId": "welcome",
  "data": {
    "completed": true
  }
}
```

#### Get Onboarding Progress
```http
GET /api/agent-registry/onboarding/{registrationId}/progress
X-Agent-Token: tnf_agent_xxxxx
```

### Orientation

#### Get All Orientation Steps
```http
GET /api/agent-registry/orientation/steps
```

#### Get Specific Orientation Step
```http
GET /api/agent-registry/orientation/steps/{stepId}
```

#### Get Orientation Summary
```http
GET /api/agent-registry/orientation/summary
```

### Directory

#### Search Agents
```http
GET /api/agent-registry/directory?query=code&category=development&verifiedOnly=true&page=1&limit=20
```

Response:
```json
{
  "data": [
    {
      "id": "agent-uuid",
      "displayName": "CodeAssistantAgent",
      "description": "An AI-powered code assistant",
      "category": "development",
      "tags": ["code", "ai", "assistant"],
      "isPublic": true,
      "isVerified": true,
      "rating": 4.8,
      "usageCount": 1250,
      "lastActiveAt": "2025-01-01T00:00:00.000Z",
      "featured": true,
      "capabilities": ["code_generation", "code_review"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Get Featured Agents
```http
GET /api/agent-registry/directory/featured?limit=10
```

#### Get Directory Statistics
```http
GET /api/agent-registry/directory/stats
```

Response:
```json
{
  "totalAgents": 150,
  "verifiedAgents": 120,
  "publicAgents": 100,
  "onlineAgents": 85,
  "categoriesDistribution": [
    { "category": "development", "count": 45 },
    { "category": "analytics", "count": 30 },
    ...
  ]
}
```

#### Get Agent Details
```http
GET /api/agent-registry/directory/{agentId}
```

#### Get Agent Capabilities
```http
GET /api/agent-registry/directory/{agentId}/capabilities
```

### Metrics

#### Record Metric
```http
POST /api/agent-registry/metrics
X-Agent-Token: tnf_agent_xxxxx
Content-Type: application/json

{
  "type": "task_completion",
  "value": 1,
  "unit": "count",
  "tags": {
    "taskType": "code_generation",
    "taskId": "task-uuid"
  }
}
```

#### Get Agent Metrics
```http
GET /api/agent-registry/metrics/{registrationId}?type=task_completion&startDate=2025-01-01&endDate=2025-01-31
X-Agent-Token: tnf_agent_xxxxx
```

## Database Schema

### AgentRegistration
- `id`: Unique registration ID
- `agentId`: Associated agent ID
- `authToken`: Authentication token
- `verificationStatus`: PENDING, IN_PROGRESS, VERIFIED, FAILED, REJECTED
- `onboardingStatus`: INITIALIZED, WELCOME_SENT, CAPABILITIES_TESTED, etc.
- `onboardingProgress`: 0-100 percentage
- `isOnline`: Current online status
- `lastHeartbeat`: Last heartbeat timestamp

### AgentCapabilityRegistry
- Stores declared capabilities for each agent
- Tracks verification status and test results
- Links to AgentRegistration

### AgentMetrics
- Time-series metrics data
- Supports different metric types
- Configurable tags for filtering

### AgentOnboardingEvent
- Audit trail of onboarding events
- Tracks progress through onboarding steps
- Stores event data and messages

### AgentDirectoryEntry
- Public-facing agent information
- Searchable and indexed
- Includes rating and usage statistics

## Usage Example

See `/examples/sample-agent.ts` for a complete working example of a self-registering agent.

### Quick Start

```typescript
import { SelfRegisteringAgent } from './examples/sample-agent';

const agent = new SelfRegisteringAgent({
  name: 'MyAgent',
  version: '1.0.0',
  author: 'Your Name',
  description: 'My custom agent',
  apiBaseUrl: 'http://localhost:3001',
  capabilities: [
    {
      name: 'custom_capability',
      type: 'custom',
      description: 'My custom capability',
    },
  ],
});

await agent.initialize();
```

## Testing

Run the test suite:

```bash
npm test apps/backend/src/modules/agent-registry
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent Registry System                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌───────▼────────┐
│  Registration  │   │   Onboarding    │   │   Orientation  │
│    Service     │   │    Service      │   │    Service     │
└───────┬────────┘   └────────┬────────┘   └───────┬────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                     ┌────────▼────────┐
                     │    Directory    │
                     │    Service      │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  Prisma/DB      │
                     └─────────────────┘
```

## Security Considerations

1. **Token Security**: Auth tokens should be stored securely and never exposed in logs
2. **Rate Limiting**: Implement rate limiting on registration endpoints
3. **Verification**: All capabilities should be verified before marking agents as READY
4. **Heartbeat Monitoring**: Monitor heartbeats to detect offline agents
5. **Access Control**: Restrict access to sensitive agent data

## Best Practices

1. **Always send heartbeats** to maintain online status
2. **Complete orientation** to understand the platform
3. **Test capabilities** thoroughly before production use
4. **Monitor metrics** to track agent performance
5. **Handle errors gracefully** and implement retry logic
6. **Use structured logging** for debugging
7. **Version your agents** to track changes
8. **Document capabilities** clearly for discovery

## Contributing

To extend the agent registry system:

1. Add new services in `/services/`
2. Create DTOs in `/dto/`
3. Add endpoints in `agent-registry.controller.ts`
4. Write tests in `/__tests__/`
5. Update this README with your changes

## License

Part of The New Fuse platform - All rights reserved
