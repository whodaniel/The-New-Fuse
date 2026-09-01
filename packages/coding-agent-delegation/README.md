# @the-new-fuse/jules-skill

A skill package for integrating with Google's Jules CLI, enabling AI agents to
delegate coding tasks to Jules asynchronously.

## What is Jules?

[Jules](https://jules.google) is Google's autonomous AI coding agent that can
work on coding tasks asynchronously. This package provides:

1. **JulesClient** - Programmatic TypeScript interface to the Jules CLI
2. **MCP Server** - Model Context Protocol server exposing Jules as tools for AI
   agents
3. **Task Templates** - Reusable task definitions for common operations

## Installation

```bash
pnpm install @the-new-fuse/jules-skill
```

## Prerequisites

1. **Jules CLI installed**:

   ```bash
   # Install Jules CLI (if not already installed)
   # See: https://jules.google/cli
   ```

2. **Logged in to Jules**:
   ```bash
   jules login
   ```

## Usage

### Programmatic Client

```typescript
import { JulesClient } from '@the-new-fuse/jules-skill';

const client = new JulesClient();

// Check if Jules is available
const isAvailable = await client.isAvailable();

// Create a new session
const session = await client.createSession({
  task: 'Implement user authentication with OAuth2',
  repository: 'myorg/myrepo', // optional
  workspaceContext: 'This is a NestJS backend with PostgreSQL', // optional
});

console.log(`Session created: ${session.id}`);

// List all sessions
const sessions = await client.listSessions({ limit: 10 });

// Pull session results
const result = await client.pullSession({
  sessionId: '123456',
  apply: true, // Apply patch to local repo
});
```

### Batch Operations

```typescript
import { julesClient } from '@the-new-fuse/jules-skill';

// Submit multiple tasks in parallel
const result = await julesClient.createSessions([
  { task: 'Add unit tests for UserService' },
  { task: 'Add unit tests for AuthService' },
  { task: 'Add unit tests for PaymentService' },
  { task: 'Add unit tests for NotificationService' },
]);

console.log(`Submitted: ${result.submitted}, Failed: ${result.failed}`);
```

## MCP Server

The package includes an MCP (Model Context Protocol) server that exposes Jules
as tools for AI agents.

### Starting the MCP Server

```bash
# From package directory
pnpm mcp:start

# Or with ts-node for development
pnpm mcp:dev
```

### MCP Configuration

Add to your MCP client configuration (e.g., Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "jules": {
      "command": "node",
      "args": ["/path/to/packages/jules-skill/dist/mcp-server.js"],
      "env": {}
    }
  }
}
```

### Available Tools

| Tool                    | Description                         |
| ----------------------- | ----------------------------------- |
| `jules_create_session`  | Create a new Jules coding session   |
| `jules_list_sessions`   | List all Jules sessions             |
| `jules_get_session`     | Get details of a specific session   |
| `jules_pull_session`    | Pull results of a completed session |
| `jules_teleport`        | Clone and apply session changes     |
| `jules_submit_batch`    | Submit multiple tasks in parallel   |
| `jules_list_templates`  | List available task templates       |
| `jules_submit_template` | Submit a predefined template        |
| `jules_check_status`    | Check Jules CLI availability        |

### Available Resources

The MCP server also exposes task templates from `.jules/tasks/` as resources
that can be read and used by AI agents.

## Task Templates

Task templates are stored in `.jules/tasks/` directory. Each template follows
the format:

```markdown
<instruction>...</instruction> <workspace_context>...</workspace_context>
<mission_brief>

## Task: Task Name

Steps and instructions...

### Success Criteria

- Criteria 1
- Criteria 2 </mission_brief>
```

### Creating Templates

```typescript
import { JulesTaskTemplate } from '@the-new-fuse/jules-skill';

const template: JulesTaskTemplate = {
  id: '17',
  name: 'Implement User Dashboard',
  description: 'Create a user dashboard component',
  category: 'frontend',
  instruction: `
    1. Create UserDashboard.tsx component
    2. Add state management
    3. Implement data fetching
    4. Add styling
  `,
  workspaceContext: 'React 18 with TypeScript, TailwindCSS',
  complexity: 4,
  tags: ['frontend', 'react', 'dashboard'],
};
```

## Bash Script

A convenience bash script is provided for quick task submission:

```bash
# Submit all tasks
./scripts/submit-jules-tasks.sh

# Submit with parallelism
./scripts/submit-jules-tasks.sh --parallel 8

# Submit specific tasks
./scripts/submit-jules-tasks.sh --task 01 02 03 04

# Dry run (preview)
./scripts/submit-jules-tasks.sh --dry-run
```

## API Reference

### JulesClient

```typescript
class JulesClient {
  constructor(options?: { cwd?: string });

  // Status
  isAvailable(): Promise<boolean>;
  getVersion(): Promise<string | null>;
  isLoggedIn(): Promise<boolean>;

  // Sessions
  createSession(options: CreateSessionOptions): Promise<JulesSession>;
  createSessions(tasks: CreateSessionOptions[]): Promise<BatchSubmissionResult>;
  listSessions(options?: ListSessionsOptions): Promise<JulesSession[]>;
  getSession(sessionId: string): Promise<JulesSession | null>;
  pullSession(options: PullSessionOptions): Promise<JulesCommandResult>;
  teleport(sessionId: string): Promise<JulesCommandResult>;

  // Repositories
  listRepositories(): Promise<string[]>;

  // Templates
  submitTemplate(
    template: JulesTaskTemplate,
    options?: { repository?: string }
  ): Promise<JulesSession>;
}
```

### Types

```typescript
interface CreateSessionOptions {
  task: string;
  repository?: string;
  parallel?: number;
  workspaceContext?: string;
}

interface JulesSession {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  repository?: string;
  task: string;
  createdAt: Date;
  completedAt?: Date;
  patchUrl?: string;
  error?: string;
}
```

## License

MIT
