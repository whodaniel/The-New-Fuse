/**
 * Gemini Browser Automation Service
 *
 * Automates Chrome's built-in Gemini AI for free compute delegation
 * Allows TNF agents to leverage Gemini's tab-awareness and internet access
 *
 * Key Features:
 * - Opens Chrome with Gemini side panel
 * - Types prompts programmatically
 * - Extracts responses
 * - Leverages Gemini's ability to see tab contents
 * - Free compute for non-critical tasks
 */
export interface GeminiPromptRequest {
  prompt: string;
  contextUrls?: string[];
  timeout?: number;
}
export interface GeminiResponse {
  response: string;
  success: boolean;
  error?: string;
  timestamp: number;
}
export declare class GeminiBrowserAutomation {
  private browser;
  private context;
  private geminiPage;
  private isInitialized;
  /**
   * Initialize Chrome with Gemini enabled
   */
  initialize(): Promise<boolean>;
  /**
   * Open Gemini side panel using keyboard shortcut
   */
  private openGeminiPanel;
  /**
   * Type a prompt into Gemini's input field
   */
  private typePrompt;
  /**
   * Extract Gemini's response from the UI
   */
  private extractResponse;
  /**
   * Open context URLs in tabs for Gemini to see
   */
  private openContextTabs;
  /**
   * Send a prompt to Gemini and get response
   */
  prompt(request: GeminiPromptRequest): Promise<GeminiResponse>;
  /**
   * Close the browser
   */
  close(): Promise<void>;
  /**
   * Check if browser is initialized
   */
  isReady(): boolean;
}
export declare const geminiBrowser: GeminiBrowserAutomation;
