import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { BrowserStreamingModule } from './browser-streaming/browser-streaming.module';
import { SystemController } from './system.controller';

@Module({
  imports: [BrowserStreamingModule],
  controllers: [AgentController, SystemController],
  providers: [],
})
export class ApiModule {}
