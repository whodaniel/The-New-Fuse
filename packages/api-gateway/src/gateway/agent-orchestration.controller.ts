import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('agent-orchestration')
export class AgentOrchestrationController {
  @Get()
  getOrchestrationStatus() {
    return { status: 'active', agents: [] };
  }

  @Post()
  createOrchestration(@Body() data: any) {
    return { id: 'orchestration-1', ...data };
  }
}
