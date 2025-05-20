import { MCPServer, MCPServerOptions } from './MCPServer.js';
import { AgentService } from '../services/agentService.js';
/**
 * MCP Server implementation for the Agent System
 * Provides capabilities for agent registration, discovery, and communication
 */
export declare class MCPAgentServer extends MCPServer {
  private readonly agentService;
  constructor(agentService: AgentService, options?: MCPServerOptions);
  /**
   * Register a new capability for an agent
   */
  private registerNewCapability;
  /**
   * Route a message between agents
   */
  private routeAgentMessage;
  /**
   * Discover agents based on criteria
   */
  private discoverAgents;
  /**
   * Monitor agent state changes
   */
  private monitorAgentState;
}
