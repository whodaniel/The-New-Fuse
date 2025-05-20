# The New Fuse Commands Reference

This guide explains how to use the Command Palette to run The New Fuse commands and provides a reference for all available commands.

## Using the Command Palette

1. **Open the Command Palette**:
   - On macOS: Press `Cmd+Shift+P`
   - On Windows/Linux: Press `Ctrl+Shift+P`

2. **Run MCP Initialize**:
   - Type `thefuse.mcp.initialize` in the Command Palette
   - As you type, you'll see matching commands appear
   - Click on "The New Fuse: Initialize MCP Integration" when it appears
   - The MCP integration will initialize and you'll see a confirmation message

## Available Commands

### MCP Commands

| Command Name | Display Name | Description |
|-------------|--------------|-------------|
| `thefuse.mcp.initialize` | The New Fuse: Initialize MCP Integration | Sets up the Model Context Protocol integration |
| `thefuse.mcp.showTools` | The New Fuse: Show MCP Tools | Displays a list of available MCP tools |
| `thefuse.mcp.testTool` | The New Fuse: Test MCP Tool | Tests a specific MCP tool interactively |
| `thefuse.mcp.askAgent` | The New Fuse: Ask Agent | Ask an AI agent a question using MCP tools |

### Component Analysis Commands

| Command Name | Display Name | Description |
|-------------|--------------|-------------|
| `thefuse.analyzeComponents` | The New Fuse: Analyze Components | Runs component analysis to identify potentially unused components |
| `thefuse.showComponentAnalysisResults` | The New Fuse: Show Component Analysis Results | Displays the results of the most recent component analysis |

For detailed information about component analysis commands, see [Component Analysis Commands](docs/reference/COMMAND-REFERENCE-component-analysis.md).

### Verification Commands

| Command Name | Display Name | Description |
|-------------|--------------|-------------|
| `thefuse.verification.initialize` | The New Fuse: Initialize Verification Agent | Initializes a verification agent with specified parameters |
| `thefuse.verification.verifyClaim` | The New Fuse: Verify Claim | Verifies a claim using a verification agent |
| `thefuse.verification.setLevel` | The New Fuse: Set Verification Level | Changes the verification level of a verification agent |

The verification agent uses LLM-based fact-checking in production mode and simulated verification in development mode. It supports caching of verification results and event-based communication with other components.

#### Verification Levels

- **STRICT**: Requires multiple credible sources (verification threshold: 0.7)
- **STANDARD**: Requires at least one credible source (verification threshold: 0.5)
- **PERMISSIVE**: Accepts claims with minimal verification (verification threshold: 0.3)

#### Verification Results

Claims can have one of the following verification statuses:

- **verified**: The claim is supported by credible sources
- **refuted**: The claim is contradicted by credible sources
- **unverified**: The claim could not be verified or refuted
- **insufficient_data**: There is not enough information to verify the claim

### Other The New Fuse Commands

| Command Name | Display Name | Description |
|-------------|--------------|-------------|
| `thefuse.showWelcome` | The New Fuse: Show Welcome Page | Opens the welcome/getting started page |
| `thefuse.openSettings` | The New Fuse: Open Settings | Opens the extension settings page |
| `thefuse.startWorkspaceChat` | The New Fuse: Start Workspace Chat | Begins a new chat session about the workspace |
| `thefuse.quickActionsMenu` | The New Fuse: Quick Actions | Shows a menu of available quick actions |

## Using MCP Commands

### Initialize MCP Integration
To initialize the MCP integration:
1. Open the Command Palette
2. Type `thefuse.mcp.initialize`
3. Press Enter

The extension will:
- Check if MCP servers are running
- Configure necessary tooling
- Show a success message when complete

### Show MCP Tools
To see available MCP tools:
1. Open the Command Palette
2. Type `thefuse.mcp.showTools`
3. Press Enter

This will display a list of available tools, such as:
- `list_files`: Lists files in a directory
- `read_file`: Reads contents of a file
- `brave_search`: Performs web searches (if configured)
- `query`: Executes SQL queries (if configured)

### Test a Specific MCP Tool
To test a specific tool:
1. Open the Command Palette
2. Type `thefuse.mcp.testTool`
3. Select the tool you want to test
4. Enter the required parameters when prompted
5. See the tool's output in the results panel

### Ask the Agent
To ask the AI agent questions:
1. Open the Command Palette
2. Type `thefuse.mcp.askAgent`
3. Enter your question when prompted
4. The agent will use appropriate tools to answer your question

## Using Verification Commands

### Initialize Verification Agent
To initialize a verification agent:
1. Open the Command Palette
2. Type `thefuse.verification.initialize`
3. The agent will be initialized with default parameters

The verification agent will:
- Register itself with the system
- Set up verification capabilities
- Prepare to verify claims

### Verify a Claim
To verify a claim:
1. Open the Command Palette
2. Type `thefuse.verification.verifyClaim`
3. Provide the claim text and other required parameters
4. The agent will verify the claim and return the result

### Change Verification Level
To change the verification level:
1. Open the Command Palette
2. Type `thefuse.verification.setLevel`
3. Select the desired verification level (STRICT, STANDARD, or PERMISSIVE)

## Troubleshooting

If commands aren't showing up in the Command Palette:
1. Check if the extension is properly loaded (look for The New Fuse in Extensions view)
2. Try reloading the VS Code window (Command Palette > `Developer: Reload Window`)
3. Check the Output panel (View > Output) and select "The New Fuse" from the dropdown

## Additional Resources

### Analysis Commands

- [Component Analysis](docs/reference/automated-component-analysis.md) - Automated daily component usage analysis and tracking