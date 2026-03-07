# 🧩 The New Fuse - Web LLM Integration & Parsing Strategy

This document outlines the architectural pattern for integrating with third-party web-based LLMs (like Gemini, Claude, etc.) and transforming their unstructured text responses into the structured JSON-RPC 2.0 format required by The New Fuse Core service.

## 1. The Core Challenge

The VS Code Core service communicates using a strict JSON-RPC 2.0 protocol over WebSockets. However, web-based LLMs interact via a standard chat UI, producing unstructured, natural-language text.

**The Problem:** How does the Chrome Extension reliably convert a plain text response from a web page into a valid JSON-RPC response to send back to the Core?

## 2. The Adapter Pattern

The solution is to use an **Adapter Pattern**. For each supported web LLM, we will create a dedicated "Adapter" within the Chrome Extension's content script layer. This adapter is a module whose sole responsibility is to manage the interaction with that specific website.

```
                                ┌──────────────────────────┐
                                │      Content Script      │
                                │                          │
┌──────────────┐  JSON-RPC  ┌───┴────────────┐  HTML/Text  ┌───────────┐
│ Core Service │ ◄──────────► │ Gemini Adapter │ ◄───────────► │ Gemini UI │
└──────────────┘ (WebSocket) └────────────────┘ (DOM)      └───────────┘
                                │                          │
                                └──────────────────────────┘
```

### Adapter Responsibilities

Each adapter must perform four key tasks:

#### A. Prompt Construction & Injection

The adapter receives a JSON-RPC request from the Core. It must transform this request into a carefully engineered prompt for the web LLM. This prompt must explicitly instruct the LLM to format its *entire* response within a specific structure, such as a JSON code block.

**Example Prompt:**
```text
Analyze the following code snippet. Provide your analysis exclusively in a JSON format inside a markdown code block. The JSON object must contain two keys: "summary" (a string) and "issues" (an array of strings).

Code:
function hello() { console.log("Hello); }
```

#### B. Response Scraping

The adapter uses a `MutationObserver` or similar mechanism to watch the DOM for the LLM's response to appear. It then scrapes the raw HTML or text content of that response.

#### C. Response Parsing & Validation

This is the most critical step. The adapter must:
1.  **Extract the Structured Data:** Use a regular expression to find and extract the content of the JSON code block (e.g., `/```json\n([\s\S]*?)\n```/`).
2.  **Parse the JSON:** Use `JSON.parse()` on the extracted string. This must be wrapped in a `try...catch` block to handle malformed JSON from the LLM.
3.  **Validate the Schema:** Check that the parsed object contains the expected keys and data types (`summary` is a string, `issues` is an array).

#### D. Transformation to JSON-RPC

Once the payload is parsed and validated, the adapter constructs a valid JSON-RPC response object, including the original `id` from the request, and sends it back to the Core via the WebSocket connection.

If any step in the parsing/validation fails, the adapter must construct and send a valid JSON-RPC *error* response, providing details about what went wrong (e.g., "LLM response was not valid JSON."). This ensures the Core service always receives a predictable response.

## 3. Example Implementation

A new directory, `chrome-extension/src/content/adapters/`, will house these modules.

```typescript
// Example: chrome-extension/src/content/adapters/gemini-adapter.ts

export class GeminiAdapter {
  // ... implementation for DOM selectors ...

  public async handleRpcRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const prompt = this.constructPrompt(request.params);
    this.injectAndSubmit(prompt);
    
    const rawResponse = await this.watchForResponse();
    
    try {
      const jsonString = this.extractJson(rawResponse);
      const payload = JSON.parse(jsonString);
      this.validatePayload(payload); // Throws error on failure
      
      return { jsonrpc: "2.0", result: payload, id: request.id };
    } catch (error) {
      return { 
        jsonrpc: "2.0", 
        error: { code: -32000, message: "LLM Response Parsing Failed", data: error.message },
        id: request.id 
      };
    }
  }
  // ... private methods for each step ...
}
```

By adopting this pattern, we create a robust and maintainable bridge between the structured world of our internal services and the unstructured world of third-party web applications.