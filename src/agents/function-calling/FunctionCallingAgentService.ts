import { FunctionCallingAgent, FunctionCallingAgentConfig } from './FunctionCallingAgent.js';
import { predefinedTools } from './predefined-tools.js';
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger.js';

/**
 * Service for managing function-calling agents
 */
export class FunctionCallingAgentService extends EventEmitter {
  private agents: Map<string, FunctionCallingAgent> = new Map();
  private logger: Logger;

  constructor() {
    super();
    this.logger = new Logger('FunctionCallingAgentService');
  }

  /**
   * Create a new function-calling agent
   */
  async createAgent(config: FunctionCallingAgentConfig): Promise<string> {
    const agent = new FunctionCallingAgent(config);
    
    // Forward agent events to service listeners
    agent.on('running', (data) => this.emit('agent:running', { agentId: config.name, ...data }));
    agent.on('response', (data) => this.emit('agent:response', { agentId: config.name, ...data }));
    agent.on('error', (data) => this.emit('agent:error', { agentId: config.name, ...data }));
    agent.on('toolAdded', (data) => this.emit('agent:toolAdded', { agentId: config.name, ...data }));
    agent.on('toolRemoved', (data) => this.emit('agent:toolRemoved', { agentId: config.name, ...data }));
    agent.on('taskCreated', (data) => this.emit('agent:taskCreated', { agentId: config.name, ...data }));
    agent.on('taskCompleted', (data) => this.emit('agent:taskCompleted', { agentId: config.name, ...data }));
    agent.on('taskFailed', (data) => this.emit('agent:taskFailed', { agentId: config.name, ...data }));
    agent.on('memoryAdded', (data) => this.emit('agent:memoryAdded', { agentId: config.name, ...data }));
    agent.on('memoryCleared', (data) => this.emit('agent:memoryCleared', { agentId: config.name, ...data }));
    
    this.agents.set(config.name, agent);
    
    this.emit('agentCreated', { agentId: config.name });
    this.logger.info(`Agent created: ${config.name}`);
    
    return config.name;
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): FunctionCallingAgent | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * Delete an agent
   */
  deleteAgent(agentId: string): boolean {
    const deleted = this.agents.delete(agentId);
    
    if (deleted) {
      this.emit('agentDeleted', { agentId });
      this.logger.info(`Agent deleted: ${agentId}`);
    }
    
    return deleted;
  }

  /**
   * Get a list of all agent IDs
   */
  listAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Run an agent with the provided messages
   */
  async runAgent(agentId: string, messages: any[]): Promise<any> {
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      const error = `Agent not found: ${agentId}`;
      this.logger.error(error);
      throw new Error(error);
    }
    
    return agent.run(messages);
  }

  /**
   * Add a tool to an agent
   */
  async addToolToAgent(agentId: string, tool: any): Promise<boolean> {
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      const error = `Agent not found: ${agentId}`;
      this.logger.error(error);
      throw new Error(error);
    }
    
    agent.addTool(tool);
    return true;
  }

  /**
   * Remove a tool from an agent
   */
  async removeToolFromAgent(agentId: string, toolName: string): Promise<boolean> {
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      const error = `Agent not found: ${agentId}`;
      this.logger.error(error);
      throw new Error(error);
    }
    
    return agent.removeTool(toolName);
  }
  
  /**
   * Get all tools for an agent
   */
  getAgentTools(agentId: string): any[] {
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      const error = `Agent not found: ${agentId}`;
      this.logger.error(error);
      throw new Error(error);
    }
    
    return agent.getTools();
  }

  /**
   * Get all predefined tools
   */
  getPredefinedTools(): any {
    return predefinedTools;
  }

  /**
   * Create a task for an agent
   */
  async createTask(agentId: string, description: string): Promise<string> {
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      const error = `Agent not found: ${agentId}`;
      this.logger.error(error);
      throw new Error(error);
    }
    
    return agent.createTask(description);
  }

  /**
   * Check the status of a task
   */
  async checkTask(agentId: string, taskId: string): Promise<any> {
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      const error = `Agent not found: ${agentId}`;
      this.logger.error(error);
      throw new Error(error);
    }
    
    return agent.checkTask(taskId);
  }

  /**
   * Process function call from LLM response
   * 
   * This method handles the execution of function calls returned by the LLM
   */
  async processFunctionCall(agentId: string, functionCall: any): Promise<any> {
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      const error = `Agent not found: ${agentId}`;
      this.logger.error(error);
      throw new Error(error);
    }
    
    // Extract function name and arguments
    const functionName = functionCall.name;
    const args = functionCall.arguments ? JSON.parse(functionCall.arguments) : {};
    
    this.logger.info(`Processing function call: ${functionName}`, { args });
    
    // Handle different functions
    switch (functionName) {
      case 'get_weather':
        // In a real implementation, this would call a weather API
        const { getWeather } = await import('./predefined-tools');
        return await getWeather(args);
        
      case 'add_to_memory':
        agent.addToMemory(args.text);
        return { success: true, message: 'Added to memory' };
        
      case 'create_task':
        const taskId = await agent.createTask(args.description);
        return { taskId, status: 'created' };
        
      case 'check_task':
        return await agent.checkTask(args.taskId);
        
      // Add more function implementations as needed
      
      default:
        const errorMsg = `Unknown function: ${functionName}`;
        this.logger.error(errorMsg);
        return { error: errorMsg };
    }
  }
}