# Jules Integration Package

This package provides a service to manage Google Jules as a TNF agent. It
handles the registration of the Jules agent, the delegation of tasks to the
Jules API, and communication with the Jules API.

## Core Components

### `JulesApiClient`

A lightweight wrapper for the Jules REST API. It handles authentication and the
details of making requests to the Jules API endpoints.

### `JulesAgentAdapter`

The main service for integrating Jules as a TNF agent. It orchestrates the
registration of the agent in the TNF system, the creation of tasks, and the
delegation of those tasks to Jules.

## Usage

To use the adapter, instantiate it with the necessary dependencies:

```typescript
import { JulesAgentAdapter } from '@the-new-fuse/jules-integration';
import { RedisAgentRegistry } from '@the-new-fuse/agent';
import {
  DrizzleAgentRepository,
  DrizzleTaskRepository,
} from '@the-new-fuse/database';
import Redis from 'ioredis';

const agentRegistry = new RedisAgentRegistry();
const agentRepo = new DrizzleAgentRepository();
const taskRepo = new DrizzleTaskRepository();
const redis = new Redis();

const julesAdapter = new JulesAgentAdapter(
  agentRegistry,
  agentRepo,
  taskRepo,
  redis
);

// Delegate a task to Jules
async function delegate() {
  const result = await julesAdapter.delegateTask({
    tenantId: 'some-tenant-id',
    taskDescription: 'Implement a new feature in the frontend',
    repo: 'github.com/my-org/my-repo',
  });

  console.log('Task delegated:', result);
}
```
