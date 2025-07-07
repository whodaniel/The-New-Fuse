import { Module } from '@nestjs/common';
import { AgentService } from '../services/agent.service';
import { AgentController } from '../controllers/agent.controller';
import { DatabaseModule, AgentRepository } from '@the-new-fuse/database';

@Module({
  imports: [DatabaseModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
