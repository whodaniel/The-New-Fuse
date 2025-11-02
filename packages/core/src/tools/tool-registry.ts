import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Conflict 1 Resolution: Use 'Incoming' path
import { Tool, ToolExecutionResult, ToolParameter } from '../types';

export interface ToolRegistryEvents {
  'tool:registered': (tool: Tool) => void;
  'tool:executing': (toolId: string, parameters: any) => void;
  'tool:executed': (toolId: string, result: ToolExecutionResult) => void;
  'tool:failed': (toolId: string, error: Error) => void;
  'tool:unregistered': (toolId: string) => void;
}

export class ToolRegistry extends EventEmitter {
  private tools = new Map<string, Tool>();
  private executions = new Map<string, ToolExecutionResult>();

  register(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with id ${tool.id} already registered`);
    }
    // Conflict 2 Resolution: Removed extra whitespace
    this.tools.set(tool.id, tool);
    this.emit('tool:registered', tool);
  }

  unregister(toolId: string): void {
    if (!this.tools.has(toolId)) {
      throw new Error(`Tool with id ${toolId} not found`);
    }
    // Conflict 3 Resolution: Removed extra whitespace
    this.tools.delete(toolId);
    this.emit('tool:unregistered', toolId);
  }

  get(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  async execute(toolId: string, parameters: any): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool with id ${toolId} not found`);
    }

    this.validateParameters(tool.parameters, parameters);
    const executionId = uuidv4();
    this.emit('tool:executing', toolId, parameters);

    try {
      const result = await tool.execute(parameters);
      const executionResult: ToolExecutionResult = {
        id: executionId,
        toolId,
        parameters,
        result,
        timestamp: new Date(),
        success: true,
      };
      this.executions.set(executionId, executionResult);
      this.emit('tool:executed', toolId, executionResult);
      return executionResult;
    } catch (error) {
      const executionResult: ToolExecutionResult = {
        id: executionId,
        toolId,
        parameters,
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: new Date(),
        success: false,
      };
      this.executions.set(executionId, executionResult);
      this.emit(
        'tool:failed',
        toolId,
        error instanceof Error ? error : new Error(String(error)),
      );
      return executionResult;
    }
  }

  getExecution(executionId: string): ToolExecutionResult | undefined {
    return this.executions.get(executionId);
  }

  // Conflict 4 Resolution: Merged both conditions
  private validateParameters(
    parameters: ToolParameter[] | undefined,
    values: any,
  ): void {
    if (!parameters || parameters.length === 0) {
      return;
    }

    for (const param of parameters) {
      const value = values[param.name];
      if (param.required && value === undefined) {
        throw new Error(`Parameter ${param.name} is required`);
      }

      if (value !== undefined) {
        this.validateParameterType(param.name, value, param);
      }
    }
  }

  private validateParameterType(
    name: string,
    value: any,
    parameter: ToolParameter,
  ): void {
    switch (parameter.type) {
      case 'string':
        // ... (rest of the file is unchanged)
    }
  }
}
