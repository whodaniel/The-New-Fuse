/**
 * Gemini Browser Skill
 *
 * Main entry point for the Gemini browser automation skill
 */

export { GeminiBrowserAutomation, geminiBrowser } from './GeminiBrowserAutomation.js';
export type { GeminiPromptRequest, GeminiResponse } from './GeminiBrowserAutomation.js';
export { GeminiBrowserMCPServer, geminiBrowserMCP } from './GeminiBrowserMCPServer.js';
export type { MCPTool, MCPToolCall, MCPToolResponse } from './GeminiBrowserMCPServer.js';
