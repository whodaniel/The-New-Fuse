import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { BrowserStreamingModule } from './browser-streaming/browser-streaming.module';
import { HealthController } from './health.controller';
import { SystemController } from './system.controller';

@Module({
  imports: [BrowserStreamingModule],
  controllers: [AgentController, SystemController, HealthController],
  providers: [],
})
export class ApiModule {}
