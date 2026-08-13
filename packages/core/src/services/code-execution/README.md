# Code Execution Service

The Code Execution Service provides secure code execution capabilities for agents in The New Fuse platform. It allows agents to execute code in isolated environments with resource limits and usage tracking for billing purposes.

## Features

- **Secure Execution**: Code is executed in isolated environments with strict resource limits
- **Multiple Languages**: Supports JavaScript, TypeScript, Python, Ruby, Shell, HTML, CSS, and more
- **Resource Limits**: Configurable timeout and memory limits
- **Usage Tracking**: Track resource usage for billing purposes with database integration
- **Tiered Pricing**: Different pricing tiers based on resource requirements
- **Cloud Execution**: Code is executed in Cloudflare Workers for scalability and security
- **Security Scanning**: Automatic scanning of code for security issues
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **Collaborative Sessions**: Support for collaborative code execution sessions
- **Persistent Environments**: Option to persist execution environments between runs
- **Admin Dashboard**: UI for monitoring and managing code execution

## Architecture

The Code Execution Service consists of the following components:

1. **Code Execution Service**: Core service that handles code execution requests
2. **Cloudflare Worker**: Serverless function that executes code in an isolated environment
3. **MCP Tools**: Tools registered with the MCP server for agent access
4. **Database Integration**: Storage of usage records, sessions, and security logs
5. **Security Module**: Code scanning and rate limiting for enhanced security
6. **Collaboration Module**: Support for collaborative code execution sessions
7. **Admin Dashboard**: UI for monitoring and managing code execution

### Database Schema

The service uses the following database tables:

- **CodeExecutionUsage**: Records of code execution with usage metrics and billing information
- **CodeExecutionSession**: Collaborative code execution sessions with files and collaborators

### Security Features

The service includes several security features:

- **Code Scanning**: Automatic scanning of code for security issues
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **Resource Limits**: Strict limits on execution time and memory usage
- **Module Restrictions**: Control over which modules can be imported
- **Sandboxing**: Isolation of code execution from the host environment

### Collaboration Features

The service supports collaborative code execution:

- **Shared Sessions**: Multiple users can collaborate on the same code
- **File Management**: Create, update, and delete files in a session
- **Access Control**: Control who can access and modify a session
- **Persistent Environments**: Option to persist execution environments between runs

## Usage

### Agent Capabilities

Agents can use the `CODE_EXECUTION` capability to execute code. This capability is defined in the `AgentCapability` enum.

### MCP Tools

The following MCP tools are available for code execution:

#### Code Execution Tools

- `executeCode`: Execute code in a secure environment
- `getCodeExecutionPricing`: Get pricing information for code execution
- `getCodeExecutionUsage`: Get usage information for code execution

#### Session Management Tools

- `createCodeExecutionSession`: Create a collaborative code execution session
- `getCodeExecutionSession`: Get a collaborative code execution session
- `updateCodeExecutionSession`: Update a collaborative code execution session
- `deleteCodeExecutionSession`: Delete a collaborative code execution session
- `getUserCodeExecutionSessions`: Get collaborative code execution sessions for a user
- `getPublicCodeExecutionSessions`: Get public collaborative code execution sessions

#### File Management Tools

- `addFileToCodeExecutionSession`: Add a file to a collaborative code execution session
- `updateFileInCodeExecutionSession`: Update a file in a collaborative code execution session
- `deleteFileFromCodeExecutionSession`: Delete a file from a collaborative code execution session

#### Collaboration Tools

- `addCollaboratorToCodeExecutionSession`: Add a collaborator to a collaborative code execution session
- `removeCollaboratorFromCodeExecutionSession`: Remove a collaborator from a collaborative code execution session

### Examples

#### Execute Code

```typescript
// Execute JavaScript code
const result = await mcpServer.executeTool('executeCode', {
  code: 'const x = 10; const y = 20; return x + y;',
  language: 'javascript',
  timeout: 5000,
  memoryLimit: 50 * 1024 * 1024,
  allowedModules: ['path', 'util'],
  context: {
    customVar: 123,
    customFunc: (x) => x * 2
  }
});

console.log(result);
// {
//   success: true,
//   output: [],
//   result: 30,
//   metrics: {
//     executionTime: 123,
//     memoryUsage: 1024,
//     computeUnits: 0.123,
//     cost: 0.0001
//   }
// }
```

#### Create a Session

```typescript
// Create a collaborative code execution session
const session = await mcpServer.executeTool('createCodeExecutionSession', {
  name: 'JavaScript Playground',
  description: 'A playground for JavaScript experiments',
  collaborators: ['user2', 'user3'],
  isPublic: true,
  files: [
    {
      name: 'main.js',
      content: 'console.log("Hello, world!");',
      language: 'javascript'
    }
  ]
});

console.log(session);
// {
//   id: '1234-5678-9012',
//   name: 'JavaScript Playground',
//   description: 'A playground for JavaScript experiments',
//   ownerId: 'user1',
//   collaborators: ['user2', 'user3'],
//   isPublic: true,
//   files: [
//     {
//       id: 'abcd-efgh-ijkl',
//       name: 'main.js',
//       content: 'console.log("Hello, world!");',
//       language: 'javascript',
//       lastModified: '2023-01-01T00:00:00.000Z'
//     }
//   ],
//   createdAt: '2023-01-01T00:00:00.000Z',
//   updatedAt: '2023-01-01T00:00:00.000Z'
// }
```

#### Execute Code in a Session

```typescript
// Execute code in a collaborative session
const result = await mcpServer.executeTool('executeCode', {
  code: 'console.log("Hello from session!");',
  language: 'javascript',
  sessionId: '1234-5678-9012',
  persistEnvironment: true
});

console.log(result);
// {
//   success: true,
//   output: ['[log] Hello from session!'],
//   metrics: {
//     executionTime: 123,
//     memoryUsage: 1024,
//     computeUnits: 0.123,
//     cost: 0.0001
//   }
// }
```

## Pricing Tiers

The Code Execution Service offers four pricing tiers:

### Basic Tier

- Cost per second: $0.0001
- Cost per MB: $0.00001
- Maximum execution time: 10 seconds
- Maximum memory limit: 128MB
- Allowed modules: path, util, crypto

### Standard Tier

- Cost per second: $0.0005
- Cost per MB: $0.00005
- Maximum execution time: 30 seconds
- Maximum memory limit: 256MB
- Allowed modules: path, util, crypto, fs, http, https, zlib

### Premium Tier

- Cost per second: $0.001
- Cost per MB: $0.0001
- Maximum execution time: 60 seconds
- Maximum memory limit: 512MB
- Allowed modules: path, util, crypto, fs, http, https, zlib, stream, child_process

### Enterprise Tier

- Cost per second: $0.002
- Cost per MB: $0.0002
- Maximum execution time: 5 minutes
- Maximum memory limit: 1GB
- Allowed modules: All modules

## Security Considerations

The Code Execution Service implements several security measures:

- **Isolated Execution**: Code is executed in isolated environments
- **Resource Limits**: Strict limits on execution time and memory usage
- **Module Restrictions**: Only allowed modules can be imported
- **Input Validation**: All inputs are validated before execution
- **Error Handling**: Errors are caught and reported safely
- **Code Scanning**: Automatic scanning of code for security issues
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **Access Control**: Control who can access and modify sessions
- **Audit Logging**: Logging of all code execution attempts and security issues

## Deployment

The Cloudflare Worker is deployed using Wrangler. See the `cloudflare-worker/wrangler.toml` file for configuration details.

## Admin Dashboard

The Code Execution Service includes an admin dashboard for monitoring and managing code execution. The dashboard provides the following features:

- **Usage Statistics**: View usage statistics for code execution
- **Sessions Management**: Manage collaborative code execution sessions
- **Pricing Tiers**: View and edit pricing tiers
- **Security Logs**: View security logs and alerts

## Future Improvements

- Add support for more programming languages (e.g., Go, Rust, C#)
- Implement more advanced sandboxing techniques (e.g., WebAssembly)
- Add support for persistent storage between executions
- Implement real-time collaboration with WebSockets
- Add support for debugging tools and breakpoints
- Implement AI-assisted code completion and suggestions
- Add support for custom runtime environments
- Implement more detailed usage analytics and reporting
- Add support for custom billing and invoicing
