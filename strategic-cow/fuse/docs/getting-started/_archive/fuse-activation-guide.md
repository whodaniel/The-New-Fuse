# The New Fuse Activation Guide

This guide will help you activate The New Fuse extension and establish communication with GitHub Copilot.

> **Note:** The New Fuse VS Code extension is already installed in your environment, but needs to be activated to establish communication with other AI agents like GitHub Copilot.

## Activation Steps

### Step 1: Open VS Code Command Palette
Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) to open the VS Code Command Palette.

### Step 2: Show Discovered AI Agents
Type the following command in the Command Palette and select it:
```
The New Fuse: Show Discovered AI Agents
```
This will activate The New Fuse extension and show you the currently discovered AI agents.

### Step 3: Refresh Agent Discovery
Open the Command Palette again and type:
```
The New Fuse: Refresh Agent Discovery
```
This will scan for available AI agents, including GitHub Copilot.

### Step 4: Verify Communication Status
Look for a status indicator in the VS Code status bar that shows The New Fuse is active. It should display the number of discovered agents, including Copilot.

The status bar item will look like: `$(search) AI Agents (X)` where X is the number of discovered agents.

### Step 5: Open Workflow Builder
Open the Command Palette again and type:
```
The New Fuse: Open Workflow Builder
```
This will open the workflow builder interface where you can create workflows between AI agents.

## Verifying Communication with Copilot

### Check Discovered Agents
In the workflow builder or agent list, you should see GitHub Copilot listed among the discovered agents.

If Copilot is properly detected, it will appear with capabilities like code-completion, code-generation, and code-explanation.

### Create a Test Workflow
In the workflow builder, you can create a simple workflow that includes Copilot to test the communication:

1. Click "New Workflow" to create a new workflow
2. Add a step and select GitHub Copilot as the agent
3. Configure the step to use one of Copilot's capabilities (e.g., code generation)
4. Save and execute the workflow to verify communication

**Success Indicator:** When communication is successfully established, you'll be able to see GitHub Copilot listed in the agent discovery list and use it in workflows.

**Troubleshooting:** If you don't see Copilot in the list of discovered agents, try the following:
- Make sure GitHub Copilot is installed and activated in VS Code
- Restart VS Code and try the activation process again
- Check the VS Code output panel for "The New Fuse" to see any error messages
- Verify that the Redis server is running (it's a key component for communication)

## Using the JavaScript Activation Helper

Alternatively, you can use the provided JavaScript file to automate the activation process:

### Run the Activation Script
Open a JavaScript Debug Terminal in VS Code and run:
```
node activate-fuse.js
```
This script will execute all the necessary commands to activate The New Fuse and establish communication with Copilot.

> **Note:** The Redis server should already be running, which is a key component for communication between services.
