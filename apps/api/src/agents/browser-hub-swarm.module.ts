import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@the-new-fuse/database';
import { BrowserHubSwarmController } from './browser-hub-swarm.controller';
import { BrowserHubSwarmService } from './browser-hub-swarm.service';

@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule, // Configured at root app.module level
  ],
  controllers: [BrowserHubSwarmController],
  providers: [BrowserHubSwarmService],
  exports: [BrowserHubSwarmService],
})
export class BrowserHubSwarmModule {}
