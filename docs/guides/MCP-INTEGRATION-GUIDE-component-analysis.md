# Component Analysis MCP Integration

This document describes the integration of component analysis functionality with the Model Context Protocol (MCP) in The New Fuse.

## Overview

The component analysis functionality is integrated with MCP, making it discoverable and usable by AI agents. This enables AI agents to analyze the codebase for potentially unused components and suggest improvements.

## Available MCP Tools

| Tool Name | Description | Actions |
|-----------|-------------|---------|
| `component-analysis` | Analyze React/TypeScript components in the codebase | `analyze`, `getResults` |

## Tool Details

### component-analysis

This tool allows AI agents to analyze the codebase for potentially unused components and retrieve the analysis results.

**Schema:**
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["analyze", "getResults"],
      "description": "The action to perform"
    },
    "detailed": {
      "type": "boolean",
      "description": "Whether to return detailed results (only applicable for getResults action)",
      "default": false
    }
  },
  "required": ["action"]
}
```

**Actions:**

1. **analyze**: Runs component analysis on the codebase
   - Parameters: None
   - Returns: Analysis summary with statistics

2. **getResults**: Retrieves the results of the most recent component analysis
   - Parameters:
     - `detailed` (boolean): Whether to return detailed results
   - Returns: Analysis results (summary or detailed)

## Example Usage

### Running Component Analysis

```javascript
// Execute the analyze action
const result = await mcpManager.executeTool('component-analysis', {
  action: 'analyze'
});

console.log(`Analysis complete: ${result.stats.totalComponents} components found, ${result.stats.potentiallyLostCount} potentially lost`);
```

### Getting Analysis Results

```javascript
// Get a summary of the results
const summary = await mcpManager.executeTool('component-analysis', {
  action: 'getResults',
  detailed: false
});

console.log(`Total components: ${summary.stats.totalComponents}`);
console.log(`Potentially lost: ${summary.stats.potentiallyLostCount}`);
console.log('Most referenced components:');
summary.mostReferenced.forEach(comp => {
  console.log(`- ${comp.path}: ${comp.referencedBy.length} references`);
});

// Get detailed results
const detailed = await mcpManager.executeTool('component-analysis', {
  action: 'getResults',
  detailed: true
});

// Access all components, pages, and potentially lost components
console.log(`Total components: ${detailed.components.length}`);
console.log(`Total pages: ${detailed.pages.length}`);
console.log(`Potentially lost: ${detailed.potentiallyLost.length}`);
```

## AI Agent Capabilities

With this MCP integration, AI agents can:

1. **Analyze Codebase**: Run component analysis to identify potentially unused components
2. **Retrieve Results**: Get the results of the analysis in various levels of detail
3. **Make Recommendations**: Suggest component consolidation or removal based on the analysis
4. **Track Progress**: Compare current analysis with previous results to track progress

## Implementation Details

The component analysis MCP integration consists of:

1. **MCP Handlers**:
   - `thefuse.analysis.components.analyze`: Runs the component analysis
   - `thefuse.analysis.components.getResults`: Retrieves the analysis results

2. **Tool Registration**:
   - Registers the `component-analysis` tool with the MCP manager
   - Provides schema and examples for the tool

3. **Command Integration**:
   - Bridges the MCP tool with VS Code commands
   - Allows execution via both MCP and VS Code command palette

## Troubleshooting

If the component analysis tool is not available in MCP:

1. Make sure MCP is initialized:
   ```
   vscode.commands.executeCommand('thefuse.mcp.initialize');
   ```

2. Check if the tool is registered:
   ```
   const tools = await mcpManager.getTools();
   const hasComponentAnalysis = tools.some(t => t.name === 'component-analysis');
   console.log(`Component analysis tool available: ${hasComponentAnalysis}`);
   ```

3. If the tool is not registered, try reloading the VS Code window

If the tool execution fails:

1. Check the VS Code Developer Console for error messages
2. Verify that the workspace is a valid The New Fuse project
3. Ensure you have sufficient permissions to read all files in the workspace
