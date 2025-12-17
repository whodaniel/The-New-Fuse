import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@the-new-fuse/database';
import { BrandConsistencyAgentService } from './brand-consistency-agent.service';
import { BrandConsistencyController } from './brand-consistency.controller';

@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule.forRoot()
  ],
  controllers: [BrandConsistencyController],
  providers: [BrandConsistencyAgentService],
  exports: [BrandConsistencyAgentService]
})
export class BrandConsistencyAgentModule {}
