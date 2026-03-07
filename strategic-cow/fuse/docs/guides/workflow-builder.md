# Workflow Builder Documentation

The Workflow Builder is a powerful tool for creating, editing, and executing workflows that orchestrate agent-to-agent communication and tool interactions. This document provides a comprehensive guide to using the Workflow Builder.

## Table of Contents

1. [Overview](#overview)
2. [Components](#components)
3. [Node Types](#node-types)
4. [Creating Workflows](#creating-workflows)
5. [Executing Workflows](#executing-workflows)
6. [Debugging Workflows](#debugging-workflows)
7. [Templates](#templates)
8. [Analytics](#analytics)
9. [API Reference](#api-reference)
10. [Advanced Features](#advanced-features)

## Overview

The Workflow Builder is a visual editor for creating workflows that orchestrate agent-to-agent communication and tool interactions. It provides a drag-and-drop interface for creating nodes and connecting them to form a workflow. Workflows can be saved, loaded, executed, and debugged.

### Key Features

- Visual workflow editor with drag-and-drop interface
- Support for various node types (agents, tools, transformations, etc.)
- Real-time workflow execution
- Step-by-step debugging
- Workflow templates
- Execution analytics
- A2A protocol support with multiple versions

## Components

The Workflow Builder consists of several key components:

### WorkflowCanvas

The main component that provides the canvas for creating and editing workflows. It includes:

- Node and edge creation and manipulation
- Toolbar with save, load, validate, optimize, export, and import functions
- Integration with templates and execution

### NodeToolbox

A sidebar component that provides a list of available node types that can be dragged onto the canvas.

### NodeProperties

A sidebar component that displays and allows editing of the properties of the selected node.

### WorkflowExecutionContext

A component that provides controls for executing workflows and displays execution status.

### WorkflowDebugger

A component that provides debugging tools for workflows, including breakpoints and step-by-step execution.

### WorkflowAnalytics

A component that displays analytics for workflow executions, including execution time, success rate, and node-level metrics.

### WorkflowTemplates

A component that provides pre-defined workflow templates that can be applied to the canvas.

## Node Types

The Workflow Builder supports several node types:

### Input Node

Represents the input to the workflow. It can be configured to accept various input types.

### Output Node

Represents the output of the workflow. It can be configured to format the output in various ways.

### Agent Node

Represents an agent that can perform tasks. It can be configured to use different agent types and parameters.

### A2A Node

Represents agent-to-agent communication. It can be configured to use different communication patterns and protocol versions.

### MCP Tool Node

Represents a tool from the MCP (Multi-agent Collaboration Platform). It can be configured to use different tools and parameters.

### Transform Node

Represents a transformation of data. It can be configured to use different transformation types and code.

### Condition Node

Represents a conditional branch in the workflow. It can be configured with different conditions and has true/false outputs.

### Notification Node

Represents a notification to be sent. It can be configured with different notification types and channels.

## Creating Workflows

### Basic Workflow Creation

1. Drag nodes from the NodeToolbox onto the canvas
2. Connect nodes by dragging from an output handle to an input handle
3. Configure node properties by selecting a node and using the NodeProperties panel
4. Save the workflow using the Save button in the toolbar

### Using Templates

1. Click the Templates button in the toolbar
2. Select a template category
3. Choose a template
4. Click "Use Template" to apply it to the canvas

### Importing and Exporting

- Use the Export button to save the workflow as a JSON file
- Use the Import button to load a workflow from a JSON file

## Executing Workflows

### Basic Execution

1. Create a workflow
2. Click the Execute Workflow button in the WorkflowExecutionContext
3. View execution progress in real-time
4. View execution results in the output nodes

### Execution Options

- Parallel execution: Execute nodes in parallel when possible
- Variables: Provide variables for the workflow execution
- Timeout: Set a timeout for the workflow execution

## Debugging Workflows

### Debug Mode

1. Click the Debug button to open the WorkflowDebugger
2. Enable Debug Mode
3. Set breakpoints on nodes
4. Execute the workflow
5. Use the Continue and Step buttons to control execution

### Log Levels

- Error: Only show errors
- Warn: Show errors and warnings
- Info: Show errors, warnings, and info messages
- Debug: Show errors, warnings, info, and debug messages
- Trace: Show all messages

## Templates

The Workflow Builder provides several pre-defined templates:

### Basic Templates

- Simple Agent Task: A simple workflow with an input, agent, and output node
- Conditional Workflow: A workflow with conditional branching based on input data

### Agent Collaboration Templates

- Agent Collaboration: A workflow with two agents collaborating via A2A communication

### Data Processing Templates

- Data Processing Pipeline: A workflow for processing and transforming data

### Integration Templates

- API Integration: A workflow for integrating with external APIs

## Analytics

The Workflow Builder provides analytics for workflow executions:

### Workflow-Level Metrics

- Execution Count: Number of workflow executions
- Average Execution Time: Average time to execute the workflow
- Success Rate: Percentage of successful executions
- Last Execution: Time of the last execution

### Node-Level Metrics

- Execution Time: Time to execute each node
- Success Rate: Percentage of successful executions for each node
- Execution Count: Number of executions for each node

## API Reference

### WorkflowExecutionService

The WorkflowExecutionService provides methods for executing workflows:

- `executeWorkflow(workflow, options)`: Execute a workflow
- `abortExecution(executionId)`: Abort a workflow execution
- `subscribe(callback)`: Subscribe to execution updates
- `getExecutionHistory()`: Get execution history
- `setDebugOptions(options)`: Set debug options
- `getDebugOptions()`: Get debug options
- `continueExecution()`: Continue execution in debug mode

### A2AProtocolService

The A2AProtocolService provides methods for A2A protocol operations:

- `createMessage(type, payload, sender, recipient, options)`: Create a new A2A message
- `transformMessage(message, targetVersion)`: Transform a message from one version to another
- `validateMessage(message)`: Validate a message
- `sendMessage(message)`: Send a message
- `broadcastMessage(message)`: Broadcast a message
- `sendRequestAndWaitForResponse(message, timeout)`: Send a request and wait for a response

### MCPService

The MCPService provides methods for MCP operations:

- `getServers()`: Get all MCP servers
- `getServer(id)`: Get an MCP server by ID
- `getTools()`: Get all MCP tools
- `getTool(id)`: Get an MCP tool by ID
- `executeTool(toolId, parameters)`: Execute an MCP tool

### WorkflowDatabaseService

The WorkflowDatabaseService provides methods for workflow database operations:

- `getWorkflows()`: Get all workflows
- `getWorkflow(id)`: Get a workflow by ID
- `createWorkflow(workflow)`: Create a new workflow
- `updateWorkflow(id, workflow)`: Update a workflow
- `deleteWorkflow(id)`: Delete a workflow
- `getWorkflowExecutions(workflowId)`: Get workflow executions
- `getWorkflowExecution(workflowId, executionId)`: Get a workflow execution
- `createWorkflowExecution(workflowId, input)`: Create a workflow execution
- `abortWorkflowExecution(workflowId, executionId)`: Abort a workflow execution

## Advanced Features

### A2A Protocol Versions

The Workflow Builder supports multiple A2A protocol versions:

- v1.0: Flat message structure with basic metadata
- v2.0: Header/body structure with enhanced metadata

### Message Encryption

The Workflow Builder supports end-to-end encryption for A2A messages:

- Enable encryption in the A2A node properties
- Configure encryption options (algorithm, key size, etc.)

### Retry Policies

The Workflow Builder supports retry policies for node execution:

- Configure max retries
- Configure backoff strategy
- Configure error behavior (fail, continue, retry)

### Conditional Routing

The Workflow Builder supports conditional routing based on node output:

- Use condition nodes to branch workflow execution
- Configure conditions using JavaScript expressions
- Connect true/false outputs to different nodes

### Parallel Execution

The Workflow Builder supports parallel execution of nodes:

- Configure workflow to execute nodes in parallel
- View parallel execution in real-time
- Analyze parallel execution performance
