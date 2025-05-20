import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AgentLLMService, MemorySystem, PromptService } from '@the-new-fuse/core';
import { MemoryContent, MemoryQuery } from '@the-new-fuse/core';
import { AuthGuard } from '../guards/auth.guard.js';

@Controller('neural')
@UseGuards(AuthGuard)
export class NeuralController {
  constructor(
    private readonly agentService: AgentLLMService,
    private readonly memorySystem: MemorySystem,
    private readonly promptService: PromptService,
  ) {}

  @Get('search')
  async searchMemories(@Query() query: MemoryQuery) {
    try {
      const results = await this.memorySystem.search(query);
      return {
        success: true,
        data: results,
      };
    } catch (error: unknown) { // Explicitly type error as unknown
      return {
        success: false,
        // Check if error is an instance of Error before accessing message
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  @Post('memory')
  async addMemory(@Body() content: MemoryContent) {
    try {
      await this.memorySystem.add(content);
      return {
        success: true,
        message: 'Memory stored successfully',
      };
    } catch (error: unknown) { // Explicitly type error as unknown
      return {
        success: false,
        // Check if error is an instance of Error before accessing message
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  @Post('memory/batch')
  async addMemoryBatch(
    @Body() body: {
      memories: MemoryContent[];
    }
  ) {
    try {
      for (const content of body.memories) {
        await this.memorySystem.add(content);
      }
      return { success: true };
    } catch (error: unknown) { // Explicitly type error as unknown
      return {
        success: false,
        // Check if error is an instance of Error before accessing message
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  @Post('prompt')
  async renderPrompt(
    @Body() data: { 
      templateId: string; 
      variables: Record<string, any>;
      agentId?: string;
    }
  ) {
    try {
      let renderedPrompt;
      
      if (data.agentId) {
        // For agent-specific templates
        renderedPrompt = await this.promptService.createAgentTemplate({
          agentId: data.agentId,
          name: `Agent Template ${data.templateId}`,
          description: 'Dynamically created agent template',
          template: data.templateId,
          parameters: Object.keys(data.variables).map(key => ({
            name: key,
            type: 'string',
            required: true
          })),
          purpose: 'user',
          category: 'agent_prompts',
          version: 1,
          metrics: {
              successRate: 0,
              averageResponseTime: 0,
              errorRate: 0,
              tokenUsage: {
                  average: 0,
                  total: 0
              },
              lastUsed: undefined
          },
          metadata: {
            author: 'system',
            created: new Date(),
            updated: new Date(),
            tags: ['agent', 'dynamic']
          },
          contextRequirements: {
            needsHistory: true,
            needsMemory: true,
            needsTools: true,
            needsState: true
          },
          expectedResponse: {
            format: 'text'
          }
        });
      } else {
        // For regular templates
        renderedPrompt = await this.promptService.renderTemplate(
          data.templateId, 
          data.variables
        );
      }
        
      return {
        success: true,
        data: renderedPrompt,
      };
    } catch (error: unknown) { // Explicitly type error as unknown
      return {
        success: false,
        // Check if error is an instance of Error before accessing message
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }
}
