import { MCPRequest, MCPResponse } from './IMCPMessage';
import { MCPResource } from './IMCPResource';
import { MCPTool } from './IMCPTool';
import { MCPCapability } from './IMCPCapability';
import { MCPServerConfig, MCPServerInfo } from '../types';
/**
 * Core MCP Server interface that defines the contract for MCP server implementations.
 * Provides methods for server lifecycle management, resource/tool registration,
 * and request handling according to MCP protocol specification.
 */
export interface IMCPServer {
    /**
     * Start the MCP server with the provided configuration
     * @param config Server configuration including port, host, and other settings
     */
    start(config: MCPServerConfig): Promise<void>;
    /**
     * Stop the MCP server gracefully
     */
    stop(): Promise<void>;
    /**
     * Register a resource with the MCP server
     * @param resource The resource to register
     */
    registerResource(resource: MCPResource): void;
    /**
     * Register a tool with the MCP server
     * @param tool The tool to register
     */
    registerTool(tool: MCPTool): void;
    /**
     * Register a capability with the MCP server
     * @param capability The capability to register
     */
    registerCapability(capability: MCPCapability): void;
    /**
     * Handle an incoming MCP request according to JSON-RPC 2.0 specification
     * @param request The MCP request to handle
     * @returns Promise resolving to MCP response
     */
    handleRequest(request: MCPRequest): Promise<MCPResponse>;
    /**
     * Get server information including capabilities and status
     * @returns Server information object
     */
    getServerInfo(): MCPServerInfo;
    /**
     * Check if the server is currently running
     * @returns True if server is running, false otherwise
     */
    isRunning(): boolean;
    /**
     * Get the list of registered resources
     * @returns Array of registered resources
     */
    getRegisteredResources(): MCPResource[];
    /**
     * Get the list of registered tools
     * @returns Array of registered tools
     */
    getRegisteredTools(): MCPTool[];
    /**
     * Get the list of registered capabilities
     * @returns Array of registered capabilities
     */
    getRegisteredCapabilities(): MCPCapability[];
}
//# sourceMappingURL=IMCPServer.d.ts.map