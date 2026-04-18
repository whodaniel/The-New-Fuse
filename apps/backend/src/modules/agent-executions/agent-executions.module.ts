import { Module } from '@nestjs/common';
import { AgentExecutionsController } from './agent-executions.controller';
import { AgentExecutionsService } from './agent-executions.service';

@Module({
  controllers: [AgentExecutionsController],
  providers: [AgentExecutionsService],
  exports: [AgentExecutionsService]
})
export class AgentExecutionsModule {}
