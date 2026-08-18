# TNF Browser Control Surface

A comprehensive browser automation and agent orchestration interface that
provides parity with and exceeds other AI agent players' browser control
surfaces.

## Overview

The TNF Browser Control Surface integrates with the TNF federation protocol to
provide:

- **Multi-Platform Browser Detection**: Automatically detects and configures
  control for Claude.ai, ChatGPT, Gemini, Perplexity, Qwen, and Kimi
- **Federation Channels**: Real-time agent-to-agent messaging and channel
  management
- **Agent Orchestration**: Fleet delegation to specialized agents with cargo
- **Security & Governance**: Terminal heartbeat monitoring and gate verification

## Key Features

### 1. Federation Integration

- WebSocket connection to TNF relay (port 3007)
- Real-time agent presence tracking
- Channel creation and management
- Message history persistence

### 2. Browser Automation

- Platform-specific control strategies
- Element detection and interaction
- Content extraction and modification
- Navigation and form automation

### 3. Agent Fleet Management

- Task proposal system
- Capability-based agent assignment
- Multi-agent coordination patterns
- Turn Zero compliance verification

### 4. Security Protocol

- Terminal heartbeat monitoring
- AppleScript circuit breaker
- Slash-command guard enforcement
- Coordination poll verification

## Installation

```bash
cd apps/browser-control-surfaces
npm install
npm run build
```

## Usage

```tsx
import { BrowserControlSurface } from './apps/browser-control-surfaces';

function App() {
  return <BrowserControlSurface />;
}
```

## Components

- `BROWSER_CONTROL_SURFACE.tsx` - Main container component
- `BrowserDetection.tsx` - Platform detection and control initiation
- `ChannelManager.tsx` - Federation channel management
- `AgentOrchestrator.tsx` - Agent fleet coordination
- `SecurityMonitor.tsx` - Governance and security status
- `TnfHarnessStatusBar.tsx` - Connection status indicator

## Hooks

- `useTnfFederation` - Federation connection and messaging
- `useBrowserState` - Browser state and control
- `useTnfAuthorization` - User and permission management

## Configuration

Set the relay URL in environment variables:

```env
TNF_RELAY_URL=ws://127.0.0.1:3007/ws
```

## Development

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test
```

### Lint

```bash
pnpm lint
```

## Architecture

The control surface follows the TNF harness protocol:

1. **INPECT**: Read current browser state and federation status
2. **ACT**: Execute control commands and agent delegation
3. **VERIFY**: Confirm state changes through heartbeat and gate checks

## Related

- [TNF Harness Protocol](../docs/INSPECT_ACT_VERIFY_PROTOCOL.md)
- [Federation Protocol](../lib/federation-protocol.cjs)
- [Agent Registry](../agent-registry)
