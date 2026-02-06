import { Controller, Get, Param } from '@nestjs/common';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  getAgents() {
    return this.agentsService.getAgents();
  }

  @Get(':id')
  getAgent(@Param('id') id: string) {
    return this.agentsService.getAgent(id);
  }
}
