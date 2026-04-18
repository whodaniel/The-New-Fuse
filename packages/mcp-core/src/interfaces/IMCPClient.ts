import { 
  MCPRequest, 
  MCPResponse, 
  MCPNotification
} from './IMCPMessage.js';
import { MCPResource, ResourceContent } from './IMCPResource.js';
import { MCPCapability } from './IMCPCapability.js';
import { ToolResult } from './IMCPTool.js';
import { ConnectionOptions } from './IMCPConnection.js';
import { NotificationCallback } from '../types/index.js';

/**
 * Core MCP Client interface that defines the contract for MCP client implementations.
 * Provides methods for connecting to MCP servers, sending requests, and managing
 * resources and tools according to MCP protocol specification.
 */
export interface IMCPClient {
  /**
   * Connect to an MCP server endpoint
   * @param endpoint The server endpoint URL
   * @param options Optional connection configuration
   */
  connect(endpoint: string, options?: ConnectionOptions): Promise<void>;

  /**
   * Disconnect from the MCP server
   */
  disconnect(): Promise<void>;

  /**
   * Send a request to the connected MCP server
   * @param request The MCP request to send
   * @returns Promise resolving to MCP response
   */
  sendRequest(request: MCPRequest): Promise<MCPResponse>;

  /**
   * Subscribe to notifications from the MCP server
   * @param callback Function to handle incoming notifications
   */
  subscribeToNotifications(callback: NotificationCallback): void;

  /**
   * List available resources from the MCP server
   * @param pattern Optional pattern to filter resources
   * @returns Promise resolving to array of available resources
   */
  listResources(pattern?: string): Promise<MCPResource[]>;

  /**
   * Read content from a specific resource
   * @param uri The resource URI to read
   * @returns Promise resolving to resource content
   */
  readResource(uri: string): Promise<ResourceContent>;

  /**
   * Call a tool on the MCP server
   * @param name The tool name to call
   * @param params Parameters to pass to the tool
   * @returns Promise resolving to tool execution result
   */
  callTool(name: string, params: any): Promise<ToolResult>;

  /**
   * Get server capabilities
   * @returns Promise resolving to array of server capabilities
   */
  getServerCapabilities(): Promise<MCPCapability[]>;

  /**
   * Check if the client is currently connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean;

  /**
   * Get the current connection endpoint
   * @returns The endpoint URL if connected, null otherwise
   */
  getEndpoint(): string | null;

  /**
   * Send a notification to the server (fire-and-forget)
   * @param notification The notification to send
   */
  sendNotification(notification: MCPNotification): Promise<void>;
}