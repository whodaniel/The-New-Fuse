import { Module } from '@nestjs/common';
import { BrowserStreamingModule } from './browser-streaming/browser-streaming.module';
import { HealthController } from './health.controller';
import { SystemController } from './system.controller';

@Module({
  imports: [BrowserStreamingModule],
  controllers: [SystemController, HealthController],
  providers: [],
})
export class ApiModule {}
