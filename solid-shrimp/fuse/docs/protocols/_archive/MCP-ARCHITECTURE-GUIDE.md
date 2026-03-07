# MCP Capability Providers: Understanding the Architecture

## Overview

This document clarifies the architectural concept of MCP (Model Context Protocol) capability providers, commonly referred to as "MCP servers" in documentation.

## Key Concepts

### What is MCP?

The Model Context Protocol (MCP) is a standardized communication protocol that allows different AI models and agents to:
- Share context across interactions
- Execute specialized capabilities
- Coordinate on complex tasks
- Access external tools and resources

### MCP Capability Providers vs. Traditional Servers

#### Traditional Servers
- Run continuously as long-lived processes
- Listen on specific ports
- Accept connections from clients
- Maintain state between connections

#### MCP Capability Providers
- Expose functionality through the MCP protocol
- Are invoked on-demand when needed by an LLM
- Execute specific commands when called
- Don't need to "run" continuously
- Provide a standardized interface for LLMs to access tools

## Correct Implementation

### Configuration Approach

MCP capability providers are correctly configured in JSON files like `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "capability-name": {
      "command": "executable-command",
      "args": [
        "arg1",
        "arg2",
        "..."
      ]
    }
  }
}
```

This defines:
- What capabilities are available ("capability-name")
- How to execute them ("command" and "args")

### When an LLM Needs a Capability

1. The LLM identifies a need for a specific capability
2. The system looks up the capability in the configuration
3. The specified command is executed with the provided arguments
4. The capability provider processes the request and returns a response
5. The response is passed back to the LLM

## Common Misconceptions

### ❌ "Starting" MCP Servers

Some scripts in our codebase refer to "starting" MCP servers, which is not an accurate representation of how MCP capability providers work. These are not long-running servers that need to be started and stopped.

### ❌ Scripts That Need Correction

The following scripts may create confusion about the MCP architecture:
- `start-mcp.sh`: Suggests MCP is a service that needs to be started
- Parts of `initialize-mcp.sh`: Sets up infrastructure but also refers to MCP as a traditional server

## Best Practices

### ✅ Use the Correct Terminology

- Use "MCP capability providers" rather than "MCP servers" when possible
- Talk about "registering capabilities" rather than "starting servers"

### ✅ Configure, Don't Start

- Focus on proper configuration of capability providers
- Ensure commands and arguments are correct
- Document what capabilities each provider exposes

## Using the MCP Wizard

The MCP Configuration Wizard (`scripts/run-mcp-wizard.sh`) helps you:
1. Scan your system for available MCP capability providers
2. Configure them in the appropriate JSON files
3. Register agents with access to these capabilities

Run it with:
```
./scripts/run-mcp-wizard.sh
```

## Additional Resources

- [MCP Specification Document](/MCP_SPECIFICATION.md)
- [MCP Guide](/docs/MCP-GUIDE.md)
