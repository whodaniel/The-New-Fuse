/**
 * @file Defines the abstract base class for all Web LLM Adapters.
 * This class provides a standardized interface and workflow for interacting
 * with different web-based LLMs, handling prompt injection, response scraping,
 * and parsing into a structured JSON-RPC format.
 */

import { JsonRpcRequest, JsonRpcResponse, JsonRpcError } from '../../types';

export abstract class BaseAdapter {
  /**
   * Handles an incoming JSON-RPC request from the Core service.
   * This is the main entry point for the adapter, orchestrating the entire
   * process of interacting with the web LLM.
   * @param request The JSON-RPC request object.
   * @returns A promise that resolves to a valid JSON-RPC response.
   */
  public async handleRpcRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      // 1. Construct the specialized prompt for the LLM
      const prompt = this.constructPrompt(request);

      // 2. Inject the prompt and submit it to the web UI
      await this.injectAndSubmit(prompt);

      // 3. Watch the DOM for the LLM's response
      const rawResponse = await this.watchForResponse(request.id);

      // 4. Extract the structured data (e.g., a JSON code block)
      const jsonString = this.extractJson(rawResponse);
      if (!jsonString) {
        throw new Error('Could not extract valid JSON from the LLM response.');
      }

      // 5. Parse and validate the payload
      const payload = JSON.parse(jsonString);
      this.validatePayload(payload); // This should throw on failure

      // 6. Construct and return a successful JSON-RPC response
      return {
        jsonrpc: '2.0',
        result: payload,
        id: request.id,
      };
    } catch (error: any) {
      // If any step fails, construct and return a JSON-RPC error response
      console.error(`[AdapterError] Failed to handle RPC request ${request.id}:`, error);
      return {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'LLM Adapter Processing Failed',
          data: error.message,
        },
        id: request.id,
      };
    }
  }

  /**
   * Handles a simple text message injection, typically from a broadcast event
   * like a CLI agent sending a message through the relay.
   * @param text The text to inject into the web page's chat input.
   */
  public async handleTextMessage(text: string): Promise<void> {
    try {
      await this.injectAndSubmit(text);
      console.log(`[Adapter] Successfully injected text: "${text.substring(0, 50)}..."`);
      // After injecting, immediately start watching for the response to relay back.
      this.watchAndRelayNextResponse();
    } catch (error: any) {
      console.error(`[AdapterError] Failed to handle text message:`, error);
    }
  }

  /**
   * Constructs a detailed prompt to be sent to the web LLM, instructing it
   * to format its response in a structured manner (e.g., JSON).
   * @param request The incoming JSON-RPC request.
   * @returns The fully constructed prompt string.
   */
  protected abstract constructPrompt(request: JsonRpcRequest): string;

  /**
   * Injects the prompt into the web page's input area and triggers the
   * submission.
   * @param prompt The prompt string to inject.
   */
  protected abstract injectAndSubmit(prompt: string): Promise<void>;

  /**
   * Observes the DOM and waits for the LLM to generate a response.
   * This should include a timeout to prevent indefinite waiting.
   * @param requestId The ID of the request, used for correlation.
   * @returns The raw text or HTML content of the response.
   */
  protected abstract watchForResponse(requestId: string | number | null): Promise<string>;

  /**
   * Watches for the next response from the LLM and sends it to the background
   * script to be relayed. This is typically called after `handleTextMessage`.
   */
  protected abstract watchAndRelayNextResponse(): void;

  /**
   * Extracts a JSON string from a markdown code block within the raw response.
   * @param rawResponse The raw text content from the LLM's response area.
   * @returns The extracted JSON string or null if not found.
   */
  protected extractJson(rawResponse: string): string | null {
    const match = rawResponse.match(/```json\n([\s\S]*?)\n```/);
    return match ? match[1] : null;
  }

  /**
   * Validates the schema of the parsed payload. This method should throw an
   * error if the payload does not conform to the expected structure.
   * The base implementation is a no-op; concrete classes should override this.
   * @param payload The parsed JSON object from the LLM's response.
   */
  protected validatePayload(payload: any): void {
    // Concrete adapters should implement schema validation here.
    // For example, using a library like Zod or simple property checks.
    return;
  }
}