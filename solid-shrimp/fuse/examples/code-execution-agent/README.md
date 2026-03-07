# Code Execution Agent Example

This example demonstrates how to create an agent that uses the code execution capability.

## Overview

The Code Execution Agent is a simple agent that can execute JavaScript and TypeScript code in a secure environment. It uses the MCP (Model Context Protocol) to communicate with the Code Execution Service.

## Files

- `code-execution-agent.ts`: The agent implementation
- `example.ts`: An example script that demonstrates how to use the agent
- `README.md`: This file

## Prerequisites

- The New Fuse platform running locally
- MCP server running on port 3000
- Code Execution Service configured and running

## Usage

1. **Start the MCP Server**

   ```bash
   cd src/mcp
   node server.js
   ```

2. **Run the Example**

   ```bash
   cd examples/code-execution-agent
   ts-node example.ts
   ```

## Agent Capabilities

The Code Execution Agent has the following capabilities:

- `CODE_EXECUTION`: Execute code in a secure environment
- `CODE_GENERATION`: Generate code (not implemented in this example)

## Agent Methods

The agent provides the following methods:

- `initialize()`: Initialize the agent and register it with the MCP server
- `executeJavaScript(code, options)`: Execute JavaScript code
- `executeTypeScript(code, options)`: Execute TypeScript code
- `getPricing(tier)`: Get pricing information for code execution
- `getUsage(startDate, endDate)`: Get usage information for code execution

## Example Output

```
Initializing Code Execution Agent: code-execution-agent-1
Agent registered successfully
Executing JavaScript code
Code execution result: {
  success: true,
  output: [],
  result: 30,
  metrics: {
    executionTime: 123,
    memoryUsage: 1024,
    computeUnits: 0.123,
    cost: 0.0001
  }
}
Example 1 Result: {
  success: true,
  output: [],
  result: 30,
  metrics: {
    executionTime: 123,
    memoryUsage: 1024,
    computeUnits: 0.123,
    cost: 0.0001
  }
}
...
```

## Customization

You can customize the agent by modifying the following:

- **Agent ID**: Change the agent ID in the example script
- **MCP Server URL**: Change the server URL in the example script
- **API Key**: Change the API key in the example script
- **Code Execution Options**: Modify the options passed to the execute methods

## Security Considerations

The Code Execution Agent executes code in a secure environment with the following security measures:

- **Resource Limits**: Strict limits on execution time and memory usage
- **Module Restrictions**: Only allowed modules can be imported
- **Input Validation**: All inputs are validated before execution
- **Error Handling**: Errors are caught and reported safely

## Billing

The Code Execution Service implements a billing system that tracks resource usage and calculates costs. You can get pricing information using the `getPricing()` method and usage information using the `getUsage()` method.
