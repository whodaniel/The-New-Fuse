# The New Fuse Tasks Reference

This document provides a reference for all tasks available in The New Fuse workspace. These tasks can be executed using VS Code's task runner.

## Core Commands

- **Open The New Fuse UI**
  - Command: `${command:thefuse.openWebUI}`
  - Description: Opens The New Fuse's main user interface.

- **Open Communication Hub**
  - Command: `${command:thefuse.openCommunicationPanel}`
  - Description: Opens the communication hub for agent interactions.

- **Start AI Collaboration**
  - Command: `${command:thefuse.startAICollab}`
  - Description: Initiates an AI collaboration session.

- **Toggle Collaborative Completion**
  - Command: `${command:thefuse.toggleCollaborativeCompletion}`
  - Description: Toggles the collaborative completion feature on/off.

- **Open Master Command Center**
  - Command: `${command:thefuse.openMasterCommandCenter}`
  - Description: Opens the unified command center for The New Fuse.

## MCP Setup Tasks

- **Initialize MCP Integration**
  - Command: `bash ${workspaceFolder}/scripts/initialize-mcp.sh`
  - Description: Initializes the MCP integration with the system.

- **Setup MCP**
  - Command: `bash ${workspaceFolder}/fix-permissions.sh && bash ${workspaceFolder}/setup-extension.sh`
  - Description: Sets up MCP by fixing permissions and setting up the extension.

- **MCP Complete Setup**
  - Command: `bash ${workspaceFolder}/scripts/mcp-setup.sh`
  - Description: Performs a complete setup of the MCP environment.

## MCP Command Tasks

- **Register MCP Commands**
  - Command: `node ${workspaceFolder}/scripts/initialize-mcp-commands.js`
  - Description: Registers MCP commands with the system.

- **Show MCP Tools Direct**
  - Command: `node ${workspaceFolder}/scripts/show-mcp-tools.js`
  - Description: Directly shows available MCP tools using direct script execution.

- **Show MCP Tools**
  - Command: `${command:thefuse.mcp.showTools}`
  - Description: Shows available MCP tools through the VS Code command interface.

- **Test MCP Tool**
  - Command: `${command:thefuse.mcp.testTool}`
  - Description: Tests an MCP tool through the VS Code command.

- **Ask Agent with MCP Tools**
  - Command: `${command:thefuse.mcp.askAgent}`
  - Description: Allows asking an agent with access to MCP tools.

## MCP Health and Monitoring

- **Run MCP Health Check**
  - Command: `node ${workspaceFolder}/scripts/mcp-health-check.js`
  - Description: Runs a health check on the MCP system to verify proper functioning.

## MCP Launch Tasks

- **Launch Universal MCP Wizard**
  - Command: `bash ${workspaceFolder}/scripts/launch-mcp-wizard.sh`
  - Description: Launches the universal MCP wizard for configuring and managing MCP features.

- **Launch VS Code with Extension**
  - Command: `cd ${workspaceFolder}/src/vscode-extension && ./launch-vscode.sh`
  - Description: Launches a new VS Code instance with The New Fuse extension preloaded.

- **Launch Integrated Extension**
  - Command: `cd ${workspaceFolder}/src/vscode-extension && ./launch-integrated-extension.sh`
  - Description: Launches the integrated MCP extension in the current VS Code window.

- **MCP Quick Start (All Steps)**
  - Dependencies: Setup MCP → Create Sample Files → Launch VS Code with Extension
  - Description: Performs a complete MCP setup and launches VS Code with the extension.

## LLM Orchestrator Tasks

- **Show AI Agents**
  - Command: `${command:llm-orchestrator.showAgents}`
  - Description: Shows available AI agents in the environment.

- **Discover AI Agents**
  - Command: `${command:llm-orchestrator.discoverAgents}`
  - Description: Discovers AI agents that can be used for collaboration.

- **Create Collaborative Task**
  - Command: `${command:llm-orchestrator.createCollaborativeTask}`
  - Description: Creates a new collaborative task for AI agents.

## AI Coding Team Tasks

- **Start Collaborative Coding**
  - Command: `${command:thefuse.startCollaborativeCoding}`
  - Description: Start a collaborative coding session with AI assistants.

- **Analyze Code Problem**
  - Command: `${command:thefuse.analyzeCodeProblem}`
  - Description: Analyze a code problem using AI assistants.

- **Consult Specific AI Coder**
  - Command: `${command:thefuse.ai.consultCoder}`
  - Description: Consult with a specific AI coding assistant.

## Message-Based Communication Tasks

- **Send Message via File Protocol**
  - Command: `${command:thefuse.sendFileMessage}`
  - Description: Send a message using the file-based protocol.

- **Send MCP Message**
  - Command: `${command:thefuse.mcp.sendMessage}`
  - Description: Send a message using the Model Context Protocol.

- **Register MCP Handler**
  - Command: `${command:thefuse.mcp.registerHandler}`
  - Description: Register a handler for MCP messages.

- **Start MCP Auto-Discovery**
  - Command: `${command:thefuse.mcp.startAutoDiscovery}`
  - Description: Start auto-discovery of MCP-enabled agents.

## Workflow Engine Tasks

- **Start AI Collaboration Workflow**
  - Command: `${command:thefuse.ai.startCollaboration}`
  - Description: Start a predefined AI collaboration workflow.

- **Execute AI Task**
  - Command: `${command:thefuse.ai.executeTask}`
  - Description: Execute a specific AI task.

## Language Model Tasks

- **Generate Text with LM**
  - Command: `${command:thefuse.lm.generate}`
  - Description: Generate text using a language model.

## Combined Workflow Tasks

- **Start Complete AI Collaboration**
  - Dependencies: Show AI Agents → Start AI Collaboration Workflow → Open Communication Hub
  - Description: Complete end-to-end setup for AI collaboration.

- **Start Code Analysis Pipeline**
  - Dependencies: Analyze Code Problem → Consult Specific AI Coder
  - Description: Full code analysis workflow with AI assistance.

- **MCP Message Communication Pipeline**
  - Dependencies: Register MCP Handler → Start MCP Auto-Discovery → Send MCP Message
  - Description: Complete setup for MCP-based agent communication.

- **Full LLM Integration Setup**
  - Dependencies: Initialize MCP Integration → Show MCP Tools → Generate Text with LM
  - Description: Full setup of language model integration with MCP tools.

## Additional Utility Tasks

- **Kill Port Processes**
  - Command: `node ${workspaceFolder}/scripts/kill-port-processes.js`
  - Description: Kills processes running on specific ports.

- **Check Docker Ports**
  - Command: `node ${workspaceFolder}/scripts/check-docker-ports.js`
  - Description: Checks Docker ports for availability.

- **Create Sample Files**
  - Command: `bash ${workspaceFolder}/create-sample-files.sh`
  - Description: Creates sample files for MCP usage.

## How to Run These Tasks

To run any of these tasks, you can:

1. Open the Command Palette in VS Code (`Cmd+Shift+P` on macOS)
2. Type "Tasks: Run Task" and select it
3. Select the task you want to run from the list

Alternatively, you can use the Terminal menu and select "Run Task..." to access the same list.

## Task Categories

Tasks are organized into the following categories:

- **fuse-core**: Core functionality tasks
- **llm-orchestrator**: AI agent orchestration tasks
- **ai-coding**: AI coding assistance tasks
- **messaging**: Communication protocol tasks
- **workflow**: Workflow engine tasks
- **language-model**: Language model interaction tasks
- **workflows**: Combined workflow tasks

Last updated: May 20, 2025
