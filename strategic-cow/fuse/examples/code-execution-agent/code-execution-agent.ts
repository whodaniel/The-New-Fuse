/**
 * Example Code Execution Agent
 * 
 * This agent demonstrates how to use the code execution capability.
 */

import { AgentCapability } from '../../packages/types/src/core/enums.js';
import { CodeExecutionLanguage } from '../../packages/core/src/services/code-execution/types.js';

/**
 * Code Execution Agent
 */
export class CodeExecutionAgent {
  private readonly agentId: string;
  private readonly mcpClient: any; // Replace with actual MCP client type

  constructor(agentId: string, mcpClient: any) {
    this.agentId = agentId;
    this.mcpClient = mcpClient;
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    console.log(`Initializing Code Execution Agent: ${this.agentId}`);

    // Register agent with capabilities
    await this.mcpClient.registerAgent({
      id: this.agentId,
      name: 'Code Execution Agent',
      capabilities: [
        AgentCapability.CODE_EXECUTION,
        AgentCapability.CODE_GENERATION,
      ],
    });

    console.log('Agent registered successfully');
  }

  /**
   * Execute JavaScript code
   */
  async executeJavaScript(code: string, options: any = {}): Promise<any> {
    console.log('Executing JavaScript code');

    try {
      // Execute code using MCP tool
      const result = await this.mcpClient.executeTool('executeCode', {
        code,
        language: CodeExecutionLanguage.JAVASCRIPT,
        timeout: options.timeout || 5000,
        memoryLimit: options.memoryLimit || 50 * 1024 * 1024,
        allowedModules: options.allowedModules || [],
        context: options.context || {},
      });

      console.log('Code execution result:', result);
      return result;
    } catch (error) {
      console.error('Error executing JavaScript code:', error);
      throw error;
    }
  }

  /**
   * Execute TypeScript code
   */
  async executeTypeScript(code: string, options: any = {}): Promise<any> {
    console.log('Executing TypeScript code');

    try {
      // Execute code using MCP tool
      const result = await this.mcpClient.executeTool('executeCode', {
        code,
        language: CodeExecutionLanguage.TYPESCRIPT,
        timeout: options.timeout || 5000,
        memoryLimit: options.memoryLimit || 50 * 1024 * 1024,
        allowedModules: options.allowedModules || [],
        context: options.context || {},
      });

      console.log('Code execution result:', result);
      return result;
    } catch (error) {
      console.error('Error executing TypeScript code:', error);
      throw error;
    }
  }

  /**
   * Get pricing information
   */
  async getPricing(tier?: string): Promise<any> {
    console.log('Getting pricing information');

    try {
      // Get pricing information using MCP tool
      const result = await this.mcpClient.executeTool('getCodeExecutionPricing', {
        tier,
      });

      console.log('Pricing information:', result);
      return result;
    } catch (error) {
      console.error('Error getting pricing information:', error);
      throw error;
    }
  }

  /**
   * Get usage information
   */
  async getUsage(startDate?: string, endDate?: string): Promise<any> {
    console.log('Getting usage information');

    try {
      // Get usage information using MCP tool
      const result = await this.mcpClient.executeTool('getCodeExecutionUsage', {
        clientId: this.agentId,
        startDate,
        endDate,
      });

      console.log('Usage information:', result);
      return result;
    } catch (error) {
      console.error('Error getting usage information:', error);
      throw error;
    }
  }
}
