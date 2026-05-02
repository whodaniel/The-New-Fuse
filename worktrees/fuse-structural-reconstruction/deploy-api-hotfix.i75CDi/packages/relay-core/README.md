# @the-new-fuse/relay-core

Relay infrastructure for agent communication in The New Fuse.

## Installation

```bash
pnpm add @the-new-fuse/relay-core
```

## Usage

```typescript
import { RelayServer } from '@the-new-fuse/relay-core';

const relay = new RelayServer({ port: 3000 });
relay.start();
```

## Features

- WebSocket-based relay
- Message routing
- Agent discovery
- Channel management

## Build

```bash
pnpm build
```
