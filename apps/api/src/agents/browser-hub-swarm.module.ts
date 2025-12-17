import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@the-new-fuse/database';
import { BrowserHubSwarmService } from './browser-hub-swarm.service';
import { BrowserHubSwarmController } from './browser-hub-swarm.controller';

@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule.forRoot()
  ],
  controllers: [BrowserHubSwarmController],
  providers: [BrowserHubSwarmService],
  exports: [BrowserHubSwarmService]
})
export class BrowserHubSwarmModule {}
