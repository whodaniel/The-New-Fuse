import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module.js';
import { UserBotsController } from './user-bots.controller.js';
import { UserBotsService } from './user-bots.service.js';

@Module({
  imports: [AgentModule],
  controllers: [UserBotsController],
  providers: [UserBotsService],
  exports: [UserBotsService],
})
export class UserBotsModule {}
