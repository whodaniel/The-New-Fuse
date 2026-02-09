import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { SystemController } from './system.controller';

@Module({
  controllers: [AgentController, SystemController],
  providers: [],
})
export class ApiModule {}