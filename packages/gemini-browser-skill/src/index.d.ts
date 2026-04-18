/**
 * Gemini Browser Skill
 *
 * Main entry point for the Gemini browser automation skill
 */
export { GeminiBrowserAutomation, geminiBrowser } from './GeminiBrowserAutomation';
export type { GeminiPromptRequest, GeminiResponse } from './GeminiBrowserAutomation';
export { GeminiBrowserMCPServer, geminiBrowserMCP } from './GeminiBrowserMCPServer';
export type { MCPTool, MCPToolCall, MCPToolResponse } from './GeminiBrowserMCPServer';
