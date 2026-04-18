import { Module } from '@nestjs/common';
import { DrizzleModule } from '@the-new-fuse/database';
import { AgentController } from './agent.controller.js';
import { AgentService } from './agent.service.js';

@Module({
  imports: [DrizzleModule.forRootAsync()],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
