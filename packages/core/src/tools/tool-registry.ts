import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Tool, ToolExecutionResult, ToolParameter } from '../types';
export interface ToolRegistryEvents {
  // Implementation needed
}
  'tool:registered': (tool: Tool) => void;
  'tool:executing': (toolId: string, parameters: any) => void;
  'tool:executed': (toolId: string, result: ToolExecutionResult) => void;
  'tool:failed': (toolId: string, error: Error) => void;
  'tool:unregistered': (toolId: string) => void;
}

export class ToolRegistry extends EventEmitter {
  // Implementation needed
}
  private tools = new Map<string, Tool>();
  private executions = new Map<string, ToolExecutionResult>();
  register(tool: Tool): void {
  // Implementation needed
}
    if (this.tools.has(tool.id)) {
  // Implementation needed
}
      throw new Error(`Tool with id ${tool.id} already registered`);
    }
    
    this.tools.set(tool.id, tool);
    this.emit('tool:registered', tool);
  }

  unregister(toolId: string): void {
  // Implementation needed
}
    if (!this.tools.has(toolId)) {
  // Implementation needed
}
      throw new Error(`Tool with id ${toolId} not found`);
    }
    
    this.tools.delete(toolId);
    this.emit('tool:unregistered', toolId);
  }

  get(toolId: string): Tool | undefined {
  // Implementation needed
}
    return this.tools.get(toolId);
  }

  getAll(): Tool[] {
  // Implementation needed
}
    return Array.from(this.tools.values());
  }

  async execute(toolId: string, parameters: any): Promise<ToolExecutionResult> {
  // Implementation needed
}
    const tool = this.tools.get(toolId);
    if (!tool) {
  // Implementation needed
}
      throw new Error(`Tool with id ${toolId} not found`);
    }

    this.validateParameters(tool.parameters, parameters);
    const executionId = uuidv4();
    this.emit('tool:executing', toolId, parameters);
    try {
  // Implementation needed
}
      const result = await tool.execute(parameters);
      const executionResult: ToolExecutionResult = {
  // Implementation needed
}
        id: executionId,
        toolId,
        parameters,
        result,
        timestamp: new Date(),
        success: true
      };
      this.executions.set(executionId, executionResult);
      this.emit('tool:executed', toolId, executionResult);
      return executionResult;
    } catch (error) {
  // Implementation needed
}
      const executionResult: ToolExecutionResult = {
  // Implementation needed
}
        id: executionId,
        toolId,
        parameters,
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: new Date(),
        success: false
      };
      this.executions.set(executionId, executionResult);
      this.emit('tool:failed', toolId, error instanceof Error ? error : new Error(String(error)));
      return executionResult;
    }
  }

  getExecution(executionId: string): ToolExecutionResult | undefined {
  // Implementation needed
}
    return this.executions.get(executionId);
  }

  private validateParameters(parameters: ToolParameter[], values: any): void {
  // Implementation needed
}
    if (!parameters || parameters.length === 0) {
  // Implementation needed
}
      return;
    }

    for (const param of parameters) {
  // Implementation needed
}
      const value = values[param.name];
      if (param.required && (value === undefined || value === null)) {
  // Implementation needed
}
        throw new Error(`Parameter ${param.name} is required`);
      }

      if (value !== undefined && value !== null) {
  // Implementation needed
}
        this.validateParameterType(param.name, value, param);
      }
    }
  }

  private validateParameterType(name: string, value: any, parameter: ToolParameter): void {
  // Implementation needed
}
    switch (parameter.type) {
  // Implementation needed
}
      case 'string':
        if (typeof value !== 'string') {
  // Implementation needed
}
          throw new Error(`Parameter ${name} must be a string`);
        }
        if (parameter.enum && !parameter.enum.includes(value)) {
  // Implementation needed
}
          throw new Error(`Parameter ${name} must be one of: ${parameter.enum.join(', ')}`);
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
  // Implementation needed
}
          throw new Error(`Parameter ${name} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
  // Implementation needed
}
          throw new Error(`Parameter ${name} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
  // Implementation needed
}
          throw new Error(`Parameter ${name} must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
  // Implementation needed
}
          throw new Error(`Parameter ${name} must be an object`);
        }
        break;
      default:
        throw new Error(`Unsupported parameter type: ${parameter.type}`);
    }
  }
}