# @the-new-fuse/agent

Core Agent Runtime for The New Fuse, featuring the Unified Agent architecture
and assimilated Clawdbot capabilities.

## Features

- **UnifiedAgent**: A single, extensible agent implementation
  (`src/implementations/unified_agent.ts`) capable of handling versatile tasks.
- **ClawdEngine Integration**: Native support for **Clawdbot** protocols and
  skills.
- **Protocol Support**: A2A, MCP, and Clawdbot WebSocket protocols.

## Clawdbot Assimilation

The agent includes an assimilated `ClawdEngine` that can execute native Clawdbot
skills (`.md` files) directly.

### Usage

1.  **Skills Directory**: The engine scans `~/.clawd/skills` for Markdown skill
    files.
2.  **Execute Skill**:

    ```typescript
    const agent = createUnifiedAgent('my-agent', 'Worker', 'worker');
    await agent.start();

    // Execute a Clawdbot skill
    const result = await agent.executeTask({
      id: 'task-1',
      type: 'clawd',
      priority: 'high',
      requester: 'user',
      payload: { skill: 'system-status', args: {} },
    });
    ```

3.  **Create Skills**: Add `.md` files to `~/.clawd/skills` with YAML
    frontmatter `triggers: []` and an `Implementation` code block.

## Examples

See `examples/` directory for usage scripts:

- `demo-unified-clawd.ts`: Full demonstration of UnifiedAgent execution Clawdbot
  skills.
- `demo-clawd-assimilation.ts`: Low-level engine test.
