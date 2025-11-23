import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AgentLLMService, MemorySystem, PromptService } from '../types/core';
import { MemoryContent, MemoryQuery } from '../types/core';
import { AuthGuard } from '../guards/auth.guard';

@Controller('neural')
@UseGuards(AuthGuard)
export class NeuralController {
  constructor(
    private readonly agentService: AgentLLMService,
    // private readonly memorySystem: MemorySystem, // Commented out due to build errors
    // private readonly promptService: PromptService, // Commented out due to build errors
  ) {}

  // @Get('search')
  // async searchMemories(@Query() query: MemoryQuery) {
  //   throw new HttpException('Memory search is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Post('memory')
  // async addMemory(@Body() content: MemoryContent) {
  //   throw new HttpException('Adding memory is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Post('memory/batch')
  // async addMemoryBatch(
  //   @Body() body: {
  //     memories: MemoryContent[];
  //   }
  // ) {
  //   throw new HttpException('Batch adding memory is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }

  // @Post('prompt')
  // async renderPrompt(
  //   @Body() data: {
  //     templateId: string;
  //     variables: Record<string, any>;
  //     agentId?: string;
  //   }
  // ) {
  //   throw new HttpException('Prompt rendering is not currently available', HttpStatus.NOT_IMPLEMENTED);
  // }
}
