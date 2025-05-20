import { MCPServer, MCPServerOptions } from './MCPServer.js';
/**
 * MCP Server implementation for the Chat System
 * Provides capabilities for contextual messaging and code collaboration
 */
export declare class MCPChatServer extends MCPServer {
  constructor(options?: MCPServerOptions);
  /**
   * Send a message with context
   */
  private sendWithContext;
  /**
   * Handle code collaboration
   */
  private handleCodeCollab;
  /**
   * Create a conversation group
   */
  private createGroup;
  /**
   * Attach a resource to a message
   */
  private attachToMessage;
}
