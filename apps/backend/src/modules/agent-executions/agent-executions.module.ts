import { Module } from '@nestjs/common';
import { AgentExecutionsController } from './agent-executions.controller.js';
import { AgentExecutionsService } from './agent-executions.service.js';

@Module({
  controllers: [AgentExecutionsController],
  providers: [AgentExecutionsService],
  exports: [AgentExecutionsService]
})
export class AgentExecutionsModule {}
