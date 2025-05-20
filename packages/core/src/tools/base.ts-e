import { Injectable } from '@nestjs/common';

export interface ToolConfig {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

@Injectable()
export abstract class BaseTool {
  abstract readonly config: ToolConfig;

  abstract execute(params: Record<string, unknown>): Promise<unknown>;

  getName(): string {
    return this.config.name;
  }

  getDescription(): string {
    return this.config.description;
  }

  getParameters(): Record<string, unknown> {
    return this.config.parameters;
  }
}