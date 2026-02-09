# ADK Integration Usage Examples

This document provides examples of how to interact with the Google ADK (Agent Development Kit) integration via the Python bridge in The New Fuse.

## Overview

The ADK integration allows The New Fuse platform to leverage agents and tools developed using Google's ADK framework. Communication is handled through the `ADKBridgeService` which utilizes the `EnhancedPythonBridge`.

## Calling an ADK Tool via `ADKBridgeService`

This example shows how a backend service can call a tool registered within the ADK environment.

```typescript
// Assuming you have injected ADKBridgeService

import { ADKBridgeService } from 'src/services/ADKBridgeService'; // Adjust import path

async function callADKTool(adkBridgeService: ADKBridgeService, toolName: string, input: any) {
  try {
    console.log(`Calling ADK tool: ${toolName} with input:`, input);
    const result = await adkBridgeService.callTool(toolName, input);
    console.log('Received result from ADK tool:', result);
    return result;
  } catch (error) {
    console.error(`Error calling ADK tool ${toolName}:`, error);
    throw error;
  }
}

// Example usage:
// const result = await callADKTool(myAdkBridgeService, 'document_summarizer', { documentUrl: '...' });
```

## Accessing ADK Tools via REST API

The `ADKController` exposes endpoints (e.g., `/api/adk/call-tool`) to interact with the ADK bridge. This is useful for frontend applications or external systems.

**Example Request:**

```http
POST /api/adk/call-tool
Content-Type: application/json

{
  "toolName": "example_adk_tool",
  "input": {
    "query": "some input data"
  }
}
```

**Example Success Response:**

```json
{
  "result": "ADK tool executed successfully with output: ..."
}
```

**Example Error Response:**

```json
{
  "statusCode": 500,
  "message": "Failed to execute ADK tool: example_adk_tool",
  "error": "Internal Server Error // Specific error from bridge"
}
```

*Refer to the API documentation or `ADKController.ts` for specific endpoint details and request/response schemas.*

## Python Bridge (`adk_bridge.py`)

The Python script (`src/protocols/adk_bridge.py`) acts as the intermediary. It receives requests from the `EnhancedPythonBridge`, interacts with the ADK framework (e.g., loading agents, calling tools), and returns results.

*Developers typically don't interact with this script directly, but understanding its role is helpful for debugging.*
