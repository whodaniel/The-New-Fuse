# Redis-Based Coordination for Multi-Agent Code Collaboration

This module enables distributed task distribution, shared state, concurrency control, and code search among VS Code agent extensions using Redis Stack.

## Key Components

- **Redis Streams**: Central task queue (`agent_tasks`) with consumer groups (`code_agents_group`) for reliable distribution and pending-message recovery (XAUTOCLAIM).
- **Task Registry**: Redis Hash (`agent:tasks:registry`) tracks task metadata, status, and assigned agent.
- **Distributed Locks**: `SET key NX PX` + Lua unlock ensures exclusive file edits per agent.
- **RediSearch Index**: Full-text index (`code_index`) on workspace files for fast semantic search.

## Services

- **A2ACoordinator (`src/services/A2ACoordinator.ts`)**
  - `initialize()`: Connects Redis, ensures stream & consumer group exist.
  - `addTask(task)`: Enqueue and register new tasks.
  - `startWorker(agentId, handler)`: Claim, lock, execute handler, update status, release lock, ack.

- **TaskHandler (`src/services/TaskHandler.ts`)**
  - Implements file-edit logic via VS Code API: prepends a comment, applies edit, saves document.

- **CodeIndexer (`src/services/CodeIndexer.ts`)**
  - `initialize()`: Creates RediSearch index with TEXT+TAG schema.
  - `indexWorkspace(rootDir)`: Recursively hSet file content to Redis hashes.
  - `search(term)`: Full-text query returning file paths.

## VS Code Integration

Three commands have been added to the extension:

- **thefuse.indexWorkspace**: Index all workspace files into the RediSearch index.
- **thefuse.searchCode**: Prompt for search term, list matches, open selected file.
- **thefuse.enqueueTask**: Interactive prompt (type, file, description, priority) to enqueue code tasks.

Invoke via the Command Palette or UI buttons in various WebView panels.

## Workflow Example
1. Launch the extension in Dev Host (F5).
2. Run **Index Workspace** → receive file count.
3. Run **Search Code** → open file from results.
4. Run **Enqueue Task** → choose file & details.
5. Watch agents (`agentA`/`agentB`) annotate the file with a comment:
   ```ts
   // [agentA] processed task task-1617890000000 at 2025-04-29T12:34:56.789Z
   ```

This architecture ensures scalable, reliable coordination among multiple AI coder extensions using Redis primitives.