import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ADKBridgeService } from '../services/ADKBridgeService.js';
import { ADKController } from '../controllers/ADKController.js';

/**
 * ADK Module
 * 
 * This module provides integration with Google's ADK (Agent Development Kit).
 * It allows for registering tools, handling messages, and sending messages to other agents.
 */
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  controllers: [ADKController],
  providers: [
    ADKBridgeService,
    {
      provide: 'CONFIG_SERVICE',
      useValue: {
        get: (key: string) => process.env[key],
      },
    },
  ],
  exports: [
    ADKBridgeService,
  ],
})
export class ADKModule {}
