# Inter-Extension Communication - Technical Documentation

This document describes the technical implementation of inter-extension communication protocols used by The New Fuse to enable different AI extensions to communicate with each other.

## Overview

The New Fuse implements multiple communication protocols to enable AI extensions to exchange messages, collaborate on tasks, and coordinate their actions. Each protocol has different advantages and use cases.

## Core Concepts

### Agent Model

Each AI extension is modeled as an "agent" with:
- **Unique ID**: Identifies the agent (e.g., `thefuse.main`, `github.copilot`)
- **Capabilities**: Describes what the agent can do (e.g., `code-generation`, `text-explanation`)
- **Registration**: Agents register their presence with the system
- **Message Handling**: Agents can send and receive messages

### Message Format

All inter-extension messages have a common format:
```typescript
interface AgentMessage {
  id: string;          // Unique message ID
  sender: string;      // ID of sending agent
  recipient: string;   // ID of receiving agent, or '*' for broadcast
  action: string;      // Action to be performed
  payload: any;        // Message data
  timestamp: number;   // Unix timestamp
  signature?: string;  // Optional cryptographic signature
}
```

## Communication Protocols

### 1. Workspace State Protocol

The simplest protocol, using VS Code's workspace state storage for message passing.

#### Implementation
```typescript
// Send a message
const messages = context.workspaceState.get<AgentMessage[]>('thefuse.messages', []);
messages.push(message);
await context.workspaceState.update('thefuse.messages', messages);

// Receive messages
const messages = context.workspaceState.get<AgentMessage[]>('thefuse.messages', []);
const myMessages = messages.filter(m => m.recipient === myAgentId || m.recipient === '*');
// Process messages...
```

#### Advantages
- Simple implementation
- Works for extensions in the same VS Code window
- No file system access required

#### Limitations
- Limited to a single VS Code window instance
- Limited storage space
- No persistence across VS Code restarts (unless handled separately)

### 2. File Protocol

Uses files in a shared workspace folder for communication.

#### Implementation
- Messages are written to JSON files in a designated folder (e.g., `ai-communication/`)
- Each file represents one message
- File watchers monitor for new/changed files

```typescript
// Send a message
const filePath = path.join(communicationDir, `${Date.now()}-${messageId.substring(0, 8)}.json`);
fs.writeFileSync(filePath, JSON.stringify(message, null, 2));

// Receive messages via file watcher
const pattern = new vscode.RelativePattern(communicationDirPath, '*.json');
const fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
fileWatcher.onDidCreate(uri => handleNewMessage(uri));
fileWatcher.onDidChange(uri => handleUpdatedMessage(uri));
```

#### Message Lifecycle
1. Sender writes message to a new file
2. Recipient's file watcher detects the new file
3. Recipient reads the file and processes the message
4. Recipient updates the file to mark it as processed
5. (Optional) File is archived or deleted after processing

#### Advantages
- Works across multiple VS Code windows
- Persists across VS Code sessions
- Supports large message payloads
- Can be traced for debugging (messages are visible in the file system)

#### Limitations
- Requires file system access
- Potential race conditions
- Needs careful cleanup to avoid accumulating files

### 3. Command Protocol

Uses VS Code's command API for direct extension-to-extension communication.

#### Implementation
```typescript
// Register a command handler
const disposable = vscode.commands.registerCommand('my-extension.handleMessage', 
  (sender, action, payload) => {
    // Process the message...
    return result; // Return value sent back to the caller
  }
);

// Send a message
const result = await vscode.commands.executeCommand(
  'other-extension.handleMessage',
  'my-extension',  // sender
  'someAction',    // action
  { data: 123 }    // payload
);
```

#### Advantages
- Direct, synchronous communication
- Simple return values
- No need to set up callbacks or promises

#### Limitations
- Requires knowledge of the exact command IDs
- Limited to the current VS Code window
- No message queuing or retry mechanisms

### 4. Message Control Protocol (MCP)

A more sophisticated protocol with standardized message formats and handlers.

#### Implementation
- Adds a layer on top of other protocols (typically File Protocol or Workspace State)
- Standardizes messages with namespaces and commands
- Support for auto-discovery of capabilities

```typescript
// Register a MCP handler
mcpManager.registerHandler('my-namespace.doSomething', async (parameters) => {
  // Handle the command
  return result;
});

// Send a MCP message
const response = await mcpManager.sendMCPMessage(
  'other-extension.id',
  'other-namespace',
  'doSomething',
  { param1: 'value1', param2: 'value2' }
);
```

#### Core MCP Commands
- `mcp.core.discover`: Discover available agents
- `mcp.core.getCapabilities`: Get capabilities of a specific agent
- `mcp.core.echo`: Simple ping/echo test

#### Advantages
- Standardized message format
- Namespace/command model similar to JSON-RPC
- Auto-discovery of capabilities
- Better separation of concerns

#### Limitations
- More complex implementation
- Additional layer of indirection

## Protocol Selection

The New Fuse automatically selects the most appropriate protocol based on:
1. Availability (can the recipient be reached via a particular protocol?)
2. Message size (larger messages use File Protocol)
3. User configuration preferences

Protocols can be manually selected in the Master Command Center UI.

## Security Considerations

### Authentication
- Messages can be signed using a shared secret key
- Signature verification prevents message tampering

### Authorization
- Capabilities declaration limits what actions an agent can perform
- The user must grant permission for certain high-privilege actions

### Privacy
- All communication stays within the user's VS Code environment
- No data is sent externally unless explicitly configured

## Extending With New Protocols

New protocols can be added by implementing the core `MessageTransport` interface:

```typescript
interface MessageTransport {
  sendMessage(message: AgentMessage): Promise<boolean>;
  subscribeToMessages(callback: (message: AgentMessage) => Promise<void>): void;
  dispose(): void;
}
```

Then register the new transport with the message orchestrator:

```typescript
orchestrator.registerTransport('new-protocol-name', new MyCustomTransport());
```

## Examples

### Using Workspace State Protocol

```typescript
// Basic message sending
const agentClient = createAgentClient(context, 'my-extension-id', outputChannel);
await agentClient.register('My Extension', ['custom-capability'], '1.0.0');
await agentClient.sendMessage('other-extension.id', 'doSomething', { data: 'value' });

// Handling messages
agentClient.subscribe(async (message) => {
  if (message.action === 'doSomething') {
    // Handle the message...
  }
});
```

### Using File Protocol

```typescript
// Initialize the communicator
const communicator = createFileProtocolCommunicator(context, agentClient, outputChannel);
await communicator.initialize();

// Send a message
await communicator.sendMessage('other-extension.id', 'processData', { data: 'large-payload' });
```

### Using MCP Protocol

```typescript
// Initialize MCP manager
const mcpManager = createMCPProtocolManager(context, agentClient, outputChannel);

// Register a handler
mcpManager.registerHandler('my-extension.processData', async (params) => {
  // Process the data
  return { success: true, result: 'processed data' };
});

// Send a message
const response = await mcpManager.sendMCPMessage(
  'other-extension.id',
  'other-extension',
  'generateText',
  { prompt: 'Generate a hello world program' }
);
```

## Troubleshooting

### Message Not Received
1. Verify the recipient ID is correct
2. Check that the recipient extension is active
3. Look for errors in the Output channel
4. Verify the communication protocol is available

### File Protocol Issues
1. Ensure the communication directory (`ai-communication/`) exists
2. Check file permissions
3. Verify file watchers are active

### Command Protocol Issues
1. Verify the command ID matches exactly what the recipient has registered
2. Ensure the recipient extension is active in the current window

### MCP Protocol Issues
1. Verify the namespace and command names
2. Check if the recipient supports MCP
3. Run auto-discovery to refresh agent capabilities

## References

- [VS Code API Documentation](https://code.visualstudio.com/api/references/vscode-api)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
