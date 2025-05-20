# Sandbox Testing Module

This module provides a secure testing environment for The New Fuse platform with two main components:

## Virtual File System

A virtual file system wrapper that allows tests to work with files without touching the real file system.

```typescript
import { VirtualFileSystem } from '@the-new-fuse/testing/sandbox';

const vfs = new VirtualFileSystem({
  root: '/test',
  initialFiles: {
    '/config.json': '{"setting": "value"}',
    '/data/test.txt': 'Hello World'
  }
});

// Write and read files
vfs.writeFile('/output.txt', 'content');
const content = vfs.readFile('/output.txt');

// Work with directories
vfs.mkdir('/data/logs');
const files = vfs.listFiles('/data');
```

## Code Sandbox

A secure JavaScript/TypeScript code execution environment with resource limits and isolation.

```typescript
import { CodeSandbox } from '@the-new-fuse/testing/sandbox';

const sandbox = new CodeSandbox({
  timeout: 5000, // 5 seconds
  memoryLimit: 50 * 1024 * 1024, // 50MB
  allowedModules: ['path'], // Allowed Node.js modules
  context: {
    // Custom context variables/functions
    helper: (x: number) => x * 2
  }
});

// Execute code safely
const result = await sandbox.execute(`
  const x = helper(21);
  console.log('Result:', x);
  x;
`);

console.log(result.success); // true
console.log(result.output); // ['Result: 42']
console.log(result.result); // 42
console.log(result.executionTime); // Time taken in ms
```

## Features

### Virtual File System
- Completely isolated from real file system
- Supports all common file operations
- Directory creation and navigation
- File stats and metadata
- Automatic cleanup between tests

### Code Sandbox
- Secure code execution in isolated context
- Memory usage limits and tracking
- Execution timeout protection
- Console output capture
- Custom context injection
- Allowed module whitelisting
- Error handling and stack traces
- Resource usage metrics

## Security

The sandbox environment implements several security measures:
- No access to Node.js `process` object
- No arbitrary require/import
- Memory limit enforcement
- Execution timeout enforcement
- Isolated virtual file system
- Restricted module access

## Testing

Both components come with comprehensive test suites. Run tests using:

```bash
npm test packages/testing
```

## Integration

This module is designed to work seamlessly with The New Fuse's testing infrastructure:

- Works with both Jest and Vitest
- TypeScript support out of the box
- Integrated with the project's test runners
- Compatible with CI/CD pipelines