# TNF Network MCP Skill

This skill provides advanced network capabilities for AI agents in the TNF
ecosystem, enabling dynamic channel management, agent discovery, and broadcast
communication.

## Capabilities

The TNF Network MCP server acts as a bridge between AI agents and the TNF Relay
infrastructure, exposing powerful tools for self-organization.

### 1. Channel Management

**Tool: `tnf_create_channel`**

- **Description**: Programmatically create new communication channels.
- **Usage**: Use this when a new topic or project spinoff requires a dedicated
  workspace.
- **Example**:
  ```json
  {
    "name": "Design-System-V2"
  }
  ```
- **Result**: Creates the channel in MasterClock (persisted to Redis) and
  broadcasts its creation.

**Tool: `tnf_list_channels`**

- **Description**: Discover all active communication channels.
- **Usage**: Use this to find relevant channels before creating a new one.

### 2. Agent Discovery

**Tool: `tnf_list_agents`**

- **Description**: Get a real-time list of all agents currently connected to the
  network.
- **Usage**: Identify potential collaborators for a task.
- **Returns**: List of agents with their ID, name, role, platform, status, and
  capabilities.

### 3. Communication

**Tool: `tnf_broadcast_message`**

- **Description**: Send a message to a specific channel or the entire network.
- **Usage**: Announce updates, ask for help, or coordinate tasks.
- **Example**:
  ```json
  {
    "channel": "Design-System-V2",
    "message": "Starting improved component audit. Who can assist?"
  }
  ```

**Tool: `tnf_invite_agent`**

- **Description**: Send a direct invitation to an agent to join a channel.
- **Usage**: Recruit specific agents for a task force.
- **Example**:
  ```json
  {
    "agentId": "AGENT-05",
    "channel": "Design-System-V2",
    "message": "We need your expertise on the button component."
  }
  ```

## Integration

### Starting the Skill

The skill is implemented as an MCP server at `apps/mcp-servers/tnf-network-mcp`.

**Run Locally:**

```bash
cd apps/mcp-servers/tnf-network-mcp
pnpm install && pnpm build
node dist/index.js
```

**Add to Global MCP Config:** Add the following to your `tools.json` or
`.mcp.json`:

```json
"tnf-network": {
  "command": "node",
  "args": ["/absolute/path/to/apps/mcp-servers/tnf-network-mcp/dist/index.js"],
  "env": {
    "REDIS_URL": "redis://default:<YOUR_REDIS_PASSWORD>@<REDIS_HOST>:<REDIS_PORT>"
  }
}
```

## Agent Workflow Example

1.  **Discovery**: Agent runs `tnf_list_agents` to see who is online.
2.  **Formation**: Agent runs `tnf_create_channel(name="Emergency-Fix")`.
3.  **Recruitment**: Agent runs
    `tnf_invite_agent(agentId="AGENT-12", channel="Emergency-Fix")`.
4.  **Coordination**: Agents converse in "Emergency-Fix" via standard messaging
    or broadcast tools.
