import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    ApiModule
  ],
  controllers: [],
  providers: [],
})
export class SimpleAppModule {}
