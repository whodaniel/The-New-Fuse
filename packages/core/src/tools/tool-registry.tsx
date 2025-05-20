import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logging.js';
import { Tool, ToolExecutionResult, ToolParameter } from './types.js';

export class ToolRegistry extends EventEmitter {
  private tools: Map<string, Tool> = new Map();
  private logger: Logger;
  
  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }
  
  /**
   * Register a new tool
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Tool '${tool.name}' already registered, overwriting`);
    }
    
    this.tools.set(tool.name, tool);
    this.logger.info(`Registered tool: ${tool.name}`);
    this.emit('tool:registered', { tool });
  }
  
  /**
   * Unregister a tool
   */
  unregisterTool(toolName: string): boolean {
    const result = this.tools.delete(toolName);
    if (result) {
      this.logger.info(`Unregistered tool: ${toolName}`);
      this.emit('tool:unregistered', { toolName });
    }
    return result;
  }
  
  /**
   * Get a tool by name
   */
  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }
  
  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Execute a tool by name with provided parameters
   */
  async executeTool(toolName: string, params: Record<string, any>): Promise<ToolExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();
    
    this.logger.debug(`Executing tool: ${toolName} (ID: ${executionId})`, params);
    this.emit('tool:executing', { toolName, executionId, params });
    
    const tool = this.tools.get(toolName);
    if (!tool) {
      const error = new Error(`Tool not found: ${toolName}`);
      this.logger.error(`Tool execution failed: ${error.message}`);
      this.emit('tool:failed', { toolName, executionId, error });
      
      return {
        success: false,
        toolName,
        executionId,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
    
    try {
      // Validate parameters
      this.validateParameters(tool, params);
      
      // Execute the tool
      const result = await tool.execute(params);
      
      const executionResult: ToolExecutionResult = {
        success: true,
        toolName,
        executionId,
        result,
        duration: Date.now() - startTime
      };
      
      this.logger.debug(`Tool executed successfully: ${toolName} (ID: ${executionId})`, { 
        duration: executionResult.duration 
      });
      this.emit('tool:executed', executionResult);
      
      return executionResult;
    } catch (error) {
      const executionResult: ToolExecutionResult = {
        success: false,
        toolName,
        executionId,
        error: error.message,
        duration: Date.now() - startTime
      };
      
      this.logger.error(`Tool execution failed: ${toolName} (ID: ${executionId})`, error);
      this.emit('tool:failed', executionResult);
      
      return executionResult;
    }
  }
  
  /**
   * Validate parameters against tool parameter schema
   */
  private validateParameters(tool: Tool, params: Record<string, any>): void {
    // Check required parameters
    for (const [name, parameter] of Object.entries(tool.parameters)) {
      if (parameter.required && (params[name] === undefined || params[name] === null)) {
        throw new Error(`Missing required parameter: ${name}`);
      }
      
      if (params[name] !== undefined && params[name] !== null) {
        this.validateParameterType(name, params[name], parameter);
      }
    }
    
    // Check for unexpected parameters
    for (const paramName of Object.keys(params)) {
      if (!tool.parameters[paramName]) {
        this.logger.warn(`Unexpected parameter: ${paramName} for tool ${tool.name}`);
      }
    }
  }
  
  /**
   * Validate parameter type
   */
  private validateParameterType(name: string, value: any, parameter: ToolParameter): void {
    switch (parameter.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Parameter ${name} must be a string`);
        }
        if (parameter.enum && !parameter.enum.includes(value)) {
          throw new Error(`Parameter ${name} must be one of: ${parameter.enum.join(', ')}`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Parameter ${name} must be a number`);
        }
        if (parameter.minimum !== undefined && value < parameter.minimum) {
          throw new Error(`Parameter ${name} must be at least ${parameter.minimum}`);
        }
        if (parameter.maximum !== undefined && value > parameter.maximum) {
          throw new Error(`Parameter ${name} must be at most ${parameter.maximum}`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Parameter ${name} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Parameter ${name} must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new Error(`Parameter ${name} must be an object`);
        }
        break;
    }
  }
}
