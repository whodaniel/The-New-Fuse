import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { SupabaseService } from '../supabase/SupabaseService';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler(params: any): Promise<any>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

@Injectable()
export class McpToolRegistry {
  private logger = new Logger('McpToolRegistry');
  private tools: Map<string, MCPTool> = new Map();

  constructor(private readonly supabaseService: SupabaseService) {
    this.registerDefaultTools();
  }

  private registerDefaultTools(): void {
    // File system tool
    this.registerTool({
      name: 'read_file',
      description: 'Read contents of a file',
      inputSchema: z.object({
        path: z.string().describe('File path to read'),
      }),
      async handler(): Promise<any> {
        // Implementation would go here
        return { content: 'File content would be returned here' };
      },
    });

    // Command execution tool
    this.registerTool({
      name: 'execute_command',
      description: 'Execute a shell command',
      inputSchema: z.object({
        command: z.string().describe('Command to execute'),
        cwd: z.string().optional().describe('Working directory'),
      }),
      async handler(): Promise<any> {
        // Implementation would go here
        return { output: 'Command output would be returned here' };
      },
    });

    // Web interaction tool
    this.registerTool({
      name: 'web_request',
      description: 'Make HTTP requests to web APIs',
      inputSchema: z.object({
        url: z.string().describe('URL to request'),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
        headers: z.record(z.string()).optional(),
        body: z.any().optional(),
      }),
      async handler(data: any): Promise<any> {
        // Implementation would go here
        return { status: 200, data: 'Response data would be returned here' };
      },
    });

    // Code analysis tool
    this.registerTool({
      name: 'analyze_code',
      description: 'Analyze code structure and patterns',
      inputSchema: z.object({
        query: z.string().describe('Analysis query or file pattern'),
        type: z
          .enum(['structure', 'dependencies', 'complexity'])
          .default('structure'),
      }),
      async handler(): Promise<any> {
        // Implementation would go here
        return { analysis: 'Code analysis results would be returned here' };
      },
    });

    this.registerTool({
      name: 'supabase_query',
      description: 'Query a Supabase table',
      inputSchema: z.object({
        table: z.string().describe('The table to query'),
        columns: z.string().optional().describe('The columns to select'),
      }),
      handler: this.supabaseService.query.bind(this.supabaseService),
    });

    this.registerTool({
      name: 'supabase_insert',
      description: 'Insert a new row into a Supabase table',
      inputSchema: z.object({
        table: z.string().describe('The table to insert into'),
        values: z.any().describe('The values to insert'),
      }),
      handler: this.supabaseService.insert.bind(this.supabaseService),
    });

    this.registerTool({
      name: 'supabase_update',
      description: 'Update rows in a Supabase table',
      inputSchema: z.object({
        table: z.string().describe('The table to update'),
        values: z.any().describe('The new values'),
        match: z.any().describe('The rows to update'),
      }),
      handler: this.supabaseService.update.bind(this.supabaseService),
    });

    this.registerTool({
      name: 'supabase_delete',
      description: 'Delete rows from a Supabase table',
      inputSchema: z.object({
        table: z.string().describe('The table to delete from'),
        match: z.any().describe('The rows to delete'),
      }),
      handler: this.supabaseService.delete.bind(this.supabaseService),
    });

    this.logger.info(`Registered ${this.tools.size} default tools`);
  }

  public registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    this.logger.debug(`Registered tool: ${tool.name}`);
  }

  public unregisterTool(name: string): boolean {
    const removed = this.tools.delete(name);
    if (removed) {
      this.logger.debug(`Unregistered tool: ${name}`);
    }
    return removed;
  }

  public getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  public getToolDefinitions(): ToolDefinition[] {
    return this.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: this.zodSchemaToJsonSchema(tool.inputSchema),
    }));
  }

  public async executeTool(name: string, params: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      // Validate parameters against schema
      const validatedParams = tool.inputSchema.parse(params);
      // Execute the tool
      const result = await tool.handler(validatedParams);
      this.logger.debug(`Tool executed successfully: ${name}`);
      return result;
    } catch (error) {
      this.logger.error(`Tool execution failed: ${name}`, error);
      throw error;
    }
  }

  public hasToolGroup(group: string): boolean {
    return this.getAllTools().some((tool) => tool.name.startsWith(`${group}.`));
  }

  public getToolsByGroup(group: string): MCPTool[] {
    return this.getAllTools().filter((tool) =>
      tool.name.startsWith(`${group}.`)
    );
  }

  private zodSchemaToJsonSchema(schema: z.ZodSchema): any {
    // Basic conversion of Zod schema to JSON schema
    // This is a simplified implementation - in production you might want to use a library
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: Record<string, any> = {};
      const required: string[] = [];
      Object.entries(shape).forEach(([key, value]) => {
        if (value instanceof z.ZodString) {
          properties[key] = { type: 'string' };
          if (value.description) {
            properties[key].description = value.description;
          }
        } else if (value instanceof z.ZodNumber) {
          properties[key] = { type: 'number' };
        } else if (value instanceof z.ZodBoolean) {
          properties[key] = { type: 'boolean' };
        } else if (value instanceof z.ZodEnum) {
          properties[key] = {
            type: 'string',
            enum: value.options,
          };
        } else if (value instanceof z.ZodOptional) {
          // Handle optional fields - don't add to required
          const innerSchema = this.zodSchemaToJsonSchema(value.unwrap());
          properties[key] = innerSchema;
        } else {
          properties[key] = { type: 'string' }; // fallback
        }

        // Add to required if not optional
        if (!(value instanceof z.ZodOptional)) {
          required.push(key);
        }
      });
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    return { type: 'string' }; // fallback
  }

  public getToolCount(): number {
    return this.tools.size;
  }

  public clear(): void {
    this.tools.clear();
    this.registerDefaultTools();
    this.logger.info('Tool registry cleared and reset to defaults');
  }
}
