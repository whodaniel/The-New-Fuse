import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { DatabaseModule } from '@the-new-fuse/database';
import { BrandConsistencyAgentService } from './brand-consistency-agent.service';
import { BrandConsistencyController } from './brand-consistency.controller';

@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule, // Configured at root app.module level
  ],
  controllers: [BrandConsistencyController],
  providers: [BrandConsistencyAgentService],
  exports: [BrandConsistencyAgentService],
})
export class BrandConsistencyAgentModule {}
