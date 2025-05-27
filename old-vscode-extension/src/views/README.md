# WebView Providers for The New Fuse VS Code Extension

This directory contains WebView provider implementations for The New Fuse VS Code extension.

## Overview

WebView providers in this directory create and manage UI components for The New Fuse, including communication hubs, relay panels, and settings views. As of May 15, 2025, these providers have been refactored to include functionality previously maintained in separate utility files.

## Current Providers

### `communication-hub-provider.ts`

Provider for the communication hub WebView:

- Creates UI for agent-to-agent communication
- Displays message history between agents
- Allows sending messages to specific agents
- Integrates with the relay service for message transport

### `relay-panel-provider.js`

Provider for the relay panel WebView:

- Displays real-time message traffic
- Provides debugging information for message relay
- Allows filtering and searching through messages
- Displays message metadata and timing information

### `settings-view-provider.ts`

Provider for the settings WebView:

- Creates UI for configuring extension settings
- Provides form controls for all configurable options
- Validates and saves settings to VS Code configuration
- Displays current configuration status

## Integrated Utilities

As part of the recent refactoring, these WebView providers now directly integrate functionality that was previously in separate utility files:

- WebView HTML generation (previously in `webview-utils.ts/js`)
- URI handling for WebView resources (previously in `uri-utils.ts/js`)
- Panel management utilities (previously in `panel-utils.ts/js`)

## Usage

WebView providers are typically registered with the extension context:

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Register WebView provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'thefuse.communicationHub',
      new CommunicationHubProvider(context.extensionUri)
    )
  );
}
```

## Best Practices

When working with WebView providers:

1. Use proper content security policies for WebViews
2. Handle WebView lifecycle events appropriately
3. Implement proper message passing between WebView and extension
4. Use VS Code's theming CSS variables for consistent styling
5. Clean up resources when WebViews are disposed
6. Cache WebView contents when appropriate for performance
7. Separate UI logic from business logic where possible
