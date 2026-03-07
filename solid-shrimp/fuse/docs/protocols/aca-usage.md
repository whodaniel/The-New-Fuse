# ACA Protocol Usage Examples

This document provides examples of how to use the consolidated ACA (Agent Communication Abstraction) protocol adapter within The New Fuse.

## Overview

The `ACAProtocolAdapter` is now the primary adapter for agent-to-agent communication, registered by default in the `A2AModule`. It provides a standardized way for agents to interact.

## Sending a Message via ACA

```typescript
// Assuming you have access to the ProtocolAdapterService instance

import { ProtocolAdapterService } from '@the-new-fuse/core'; // Adjust import path as needed

async function sendMessageToAgent(adapterService: ProtocolAdapterService, targetAgentId: string, messagePayload: any) {
  try {
    // The service will automatically use the registered ACA adapter if appropriate
    const response = await adapterService.sendMessage({
      targetAgentId: targetAgentId,
      protocol: 'ACA', // Explicitly specify or let the service determine
      payload: messagePayload,
    });

    console.log('Received response:', response);
    return response;
  } catch (error) {
    console.error('Error sending message via ACA:', error);
    throw error;
  }
}
```

## Handling Incoming ACA Messages (Agent Implementation Example)

Within an agent implementation, you would typically register handlers for specific message types or actions expected via ACA.

```typescript
// Example within an Agent class or service

class MyAgent {
  constructor(private protocolAdapterService: ProtocolAdapterService) {
    // Register message handlers upon initialization
    this.protocolAdapterService.registerMessageHandler('ACA', this.handleIncomingACAMessage.bind(this));
  }

  async handleIncomingACAMessage(message: any): Promise<any> {
    console.log('Received ACA message:', message);

    // Process the message based on its content/type
    const { action, data } = message.payload;

    switch (action) {
      case 'query':
        return { result: `Processed query: ${data}` };
      case 'update':
        // Perform update logic
        return { status: 'Update successful' };
      default:
        return { error: 'Unknown action' };
    }
  }
}
```

*Note: The exact implementation details for message handling might vary based on the agent framework structure.*
