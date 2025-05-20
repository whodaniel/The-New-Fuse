import { MCPServer, MCPServerOptions } from './MCPServer.js';
/**
 * MCP Server implementation for the Workflow System
 * Provides capabilities for workflow execution, composition, and monitoring
 */
export declare class MCPWorkflowServer extends MCPServer {
  private readonly workflowExecutionRepository;
  constructor(options?: MCPServerOptions);
  /**
   * Execute a workflow node with full integration
   */
  private executeNode;
  /**
   * Compose a workflow from components
   */
  private composeWorkflow;
  /**
   * Monitor workflow execution
   */
  private monitorWorkflow;
  /**
   * Control workflow execution (pause/resume/stop)
   */
  private controlWorkflow;
}
