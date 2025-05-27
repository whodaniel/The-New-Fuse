# VS Code Extension Commands

This directory contains the implementation of VS Code extension commands for The New Fuse.

## Project Structure Updates

As part of the recent project structure refactoring (May 15, 2025), utility files that were previously separate have been consolidated into relevant service and component classes. Command implementations now directly use:

- Built-in Node.js functionality (`fs/promises`) for file operations
- VS Code's URI utilities (`vscode.Uri` methods) for URI handling
- Component-specific utility functions instead of shared utilities

## Verification Commands

The `verification-commands.ts` file implements commands for the AI Verification Agent:

- `thefuse.verification.initialize`: Initializes a verification agent
- `thefuse.verification.verifyClaim`: Verifies a claim using a verification agent
- `thefuse.verification.setLevel`: Changes the verification level of a verification agent

### Features

- LLM-based verification in production mode
- Simulated verification in development mode
- Caching of verification results
- Event-based communication with other components

### Testing

Unit tests for the verification commands are in the `__tests__` directory.

## Usage

See the [verification agent documentation](../docs/verification-agent.md) for detailed usage instructions.

## Command Registration

All commands should be registered through the central command registry to ensure proper error handling and logging. For example:

```typescript
// Example command registration
context.subscriptions.push(
  vscode.commands.registerCommand(
    'thefuse.myCommand',
    wrapAsyncCommand(async () => {
      // Command implementation
    })
  )
);
```

## Best Practices

1. Use the `wrapAsyncCommand` utility for proper error handling
2. Include clear success/error messages to the user
3. Log command execution and results using the logger
4. Implement commands as async functions when appropriate
5. Add commands to the command palette with descriptive labels
6. Group related commands together in dedicated files
7. Follow the pattern of existing commands for consistency
