import { Module } from '@nestjs/common';
import { DrizzleModule } from '@the-new-fuse/database';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
  imports: [DrizzleModule.forRootAsync()],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
