# Services for The New Fuse VS Code Extension

This directory contains service implementations for The New Fuse VS Code extension.

## Overview

Services in this directory provide core functionality for the extension, handling tasks such as communication between components, rate limiting, and external integrations. As of May 15, 2025, these services have been refactored to include functionality previously maintained in separate utility files.

## Current Services

### `chrome-websocket-service.ts`

WebSocket service for communication with the Chrome extension:

- Establishes and maintains WebSocket connections
- Handles secure WebSocket (wss://) support
- Manages client identification and message routing
- Implements reconnection logic with exponential backoff

### `rate-limiter.ts`

Rate limiting functionality to prevent API abuse:

- Configurable rate limits for different services
- Token bucket implementation
- Priority queuing for important requests
- Adaptive rate limiting based on service responses

### `relay-service.ts`

Core communication relay service for internal and external messaging:

- Message routing between extension components
- WebView message handling
- File-based communication for persistent messages
- Event-based communication with EventEmitter

## Integrated Utilities

As part of the recent refactoring, these services now directly integrate functionality that was previously in separate utility files:

- File system operations (previously in `fs-utils.ts/js`)
- WebView utilities (previously in `webview-utils.ts/js`)
- URI handling (previously in `uri-utils.ts/js`)
- VS Code-specific utilities (previously in `vscode-utils.ts/js`)

## Usage

Services are typically singleton instances that can be accessed through getter functions:

```typescript
import { getRelayService } from './relay-service';

// Use the relay service
const relayService = getRelayService();
await relayService.sendMessage({ type: 'example', data: {} });
```

## Best Practices

When working with services:

1. Follow the singleton pattern for services with global state
2. Implement proper initialization and cleanup methods
3. Use TypeScript interfaces to define service contracts
4. Handle errors gracefully with appropriate logging
5. Avoid tight coupling between services
6. Document public methods and event emissions
