import { Module } from '@nestjs/common';
import { BrowserStreamingModule } from './browser-streaming/browser-streaming.module';
import { HealthController } from './health.controller';
import { SystemController } from './system.controller';
import { AgentController } from './agent.controller';
import { TaskController } from './task.controller';
import { ThoughtController } from './thought.controller';

@Module({
  imports: [BrowserStreamingModule],
  controllers: [SystemController, HealthController, AgentController, TaskController, ThoughtController],
  providers: [],
})
export class ApiModule {}
