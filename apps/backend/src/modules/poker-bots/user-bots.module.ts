import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { UserBotsController } from './user-bots.controller';
import { UserBotsService } from './user-bots.service';

@Module({
  imports: [AgentModule],
  controllers: [UserBotsController],
  providers: [UserBotsService],
  exports: [UserBotsService],
})
export class UserBotsModule {}
