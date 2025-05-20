# Component Analysis Commands

This document describes the VS Code commands available for component analysis in The New Fuse.

## Available Commands

| Command Name | Display Name | Description |
|-------------|--------------|-------------|
| `thefuse.analyzeComponents` | The New Fuse: Analyze Components | Runs component analysis to identify potentially unused components |
| `thefuse.showComponentAnalysisResults` | The New Fuse: Show Component Analysis Results | Displays the results of the most recent component analysis |

## Command Details

### thefuse.analyzeComponents

This command runs a comprehensive analysis of all components in the codebase to identify potentially unused or "lost" components.

**Behavior:**
- Scans the codebase for React/TypeScript components
- Identifies components that aren't referenced elsewhere
- Generates detailed analysis results
- Shows a notification with summary statistics
- Outputs detailed results to `component-analysis-results.json` and `component-analysis-log.txt`

**Usage:**
1. Open the Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Type "Analyze Components"
3. Select "The New Fuse: Analyze Components"
4. Wait for the analysis to complete

**Output:**
- An output channel named "Component Analysis" will show the progress and results
- A notification will display summary statistics when complete
- Detailed results are saved to files in the workspace root

### thefuse.showComponentAnalysisResults

This command displays the results of the most recent component analysis in a readable format.

**Behavior:**
- Opens the component analysis log file
- Creates and displays a summary document with key statistics
- Shows the most referenced components
- Provides recommendations based on the analysis

**Usage:**
1. Open the Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Type "Show Component Analysis Results"
3. Select "The New Fuse: Show Component Analysis Results"

**Output:**
- Opens the component analysis log file
- Creates a new document with a summary of the analysis results

## Integration with Yarn Scripts

These commands are also available as Yarn scripts:

```bash
# Run component analysis
yarn analyze:components

# Run component analysis and show summary report
yarn analyze:components:report
```

## Integration with MCP

The component analysis functionality is also available as MCP tools, making it accessible to AI agents. See the [MCP Integration Guide](../guides/MCP-INTEGRATION-GUIDE.md#component-analysis-tools) for more details.

## Troubleshooting

If the commands don't appear in the Command Palette:
1. Make sure the extension is properly loaded
2. Try reloading the VS Code window (Command Palette > "Developer: Reload Window")
3. Check the VS Code Developer Console for any errors

If the analysis fails:
1. Check the "Component Analysis" output channel for error messages
2. Verify that the workspace is a valid The New Fuse project
3. Ensure you have sufficient permissions to read all files in the workspace
