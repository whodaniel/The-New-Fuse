/**
 * Service interfaces for the application
 */

export interface MCPBrokerService {
  /**
   * Initialize the MCP broker
   */
  initialize(): Promise<void>;

  /**
   * Clean up resources
   */
  cleanup(): Promise<void>;

  /**
   * Register a handler for a specific message type
   * @param type Message type
   * @param handler Handler function
   */
  registerHandler(type: string, handler: (message: any) => Promise<any>): void;

  /**
   * Get all capabilities from registered agents
   */
  getAllCapabilities(): Record<string, Record<string, any>>;

  /**
   * Get all tools from registered agents
   */
  getAllTools(): Record<string, Record<string, any>>;

  /**
   * Execute a command on an agent
   * @param agentId Agent ID
   * @param command Command to execute
   * @param params Command parameters
   * @param options Execution options
   */
  executeCommand(
    agentId: string,
    command: string,
    params: Record<string, any>,
    options?: { sender: string; metadata?: Record<string, any> }
  ): Promise<any>;
}
