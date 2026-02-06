import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  systemPrompt: z.string(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateAgentSchema = AgentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export class CreateAgentDtoZod {
  @ApiProperty({ description: 'Name of the agent' })
  name: string;

  @ApiProperty({ description: 'Description of the agent', required: false })
  description?: string;

  @ApiProperty({ description: 'System prompt for the agent' })
  systemPrompt: string;

  @ApiProperty({ description: 'Maximum tokens for agent response', required: false })
  maxTokens?: number;

  @ApiProperty({ description: 'Temperature for agent response generation', required: false })
  temperature?: number;

  constructor() {
    this.name = '';
    this.systemPrompt = '';
  }
}

export const UpdateAgentSchema = AgentSchema.partial();

export class UpdateAgentDtoZod {
  @ApiProperty({ description: 'Name of the agent', required: false })
  name?: string;

  @ApiProperty({ description: 'Description of the agent', required: false })
  description?: string;

  @ApiProperty({ description: 'System prompt for the agent', required: false })
  systemPrompt?: string;

  @ApiProperty({ description: 'Maximum tokens for agent response', required: false })
  maxTokens?: number;

  @ApiProperty({ description: 'Temperature for agent response generation', required: false })
  temperature?: number;
}
