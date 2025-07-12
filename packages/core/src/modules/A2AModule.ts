import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule],
  providers: [
    // A2A services would go here when implemented
  ],
  controllers: [
    // A2A controllers would go here when implemented
  ],
  exports: [
    // A2A exports would go here when implemented
  ],
})
export class A2AModule {}