# @the-new-fuse/testing

Testing utilities for The New Fuse platform.

## Overview

This package provides testing utilities for The New Fuse platform, including:

- Artifact generation and management
- Custom Jest matchers
- Test data generators
- Performance testing utilities
- Contract testing tools

## Installation

```bash
yarn add -D @the-new-fuse/testing
```

## Usage

### Artifact Generation

```typescript
import { artifactManager } from '@the-new-fuse/testing';

describe('My Test Suite', () => {
  it('should generate an artifact', () => {
    // Test code...
    
    // Generate an artifact
    const artifactPath = artifactManager.createArtifact({
      name: 'test-result',
      content: { foo: 'bar', baz: 123 },
      metadata: {
        testName: 'should generate an artifact',
        category: 'example'
      }
    });
    
    console.log(`Artifact generated: ${artifactPath}`);
  });
  
  it('should create a snapshot', () => {
    const data = { user: { id: 123, name: 'Test User' } };
    
    // Create a snapshot
    artifactManager.createSnapshot('user-data', data);
  });
  
  it('should create a log', () => {
    const logEntries = [
      { level: 'info', message: 'Test started' },
      { level: 'debug', message: 'Processing data' },
      { level: 'info', message: 'Test completed' }
    ];
    
    // Create a log
    artifactManager.createLog('test-log', logEntries);
  });
});
```

### Custom Jest Matchers

```typescript
import { artifactMatchers } from '@the-new-fuse/testing';

// Extend Jest's expect
expect.extend(artifactMatchers);

describe('Custom Matchers', () => {
  it('should generate an artifact using a matcher', () => {
    const result = { success: true, data: [1, 2, 3] };
    
    // Generate artifact using the matcher
    expect(result).toGenerateArtifact('test-result');
  });
});
```

## API Reference

### ArtifactManager

The `ArtifactManager` class provides methods for generating and managing test artifacts.

#### Methods

- `createArtifact(options)`: Create a new artifact
- `createSnapshot(name, data, metadata)`: Create a snapshot artifact
- `createLog(name, entries, metadata)`: Create a log artifact
- `createReport(name, data, metadata)`: Create a report artifact
- `listArtifacts()`: List all artifacts for the current run
- `getArtifact(name)`: Get an artifact by name

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `yarn test`
4. Submit a pull request

## License

MIT
