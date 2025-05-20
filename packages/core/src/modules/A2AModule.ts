import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgentCardService } from '../services/AgentCardService.js';
import { A2AProtocolHandler } from '../protocols/A2AProtocolHandler.js';
import { ProtocolAdapterService } from '../protocols/ProtocolAdapterService.js';
import { GoogleA2AAdapter } from '../protocols/adapters/GoogleA2AAdapter.js';
import { ACAProtocolAdapter } from '../protocols/adapters/ACAProtocolAdapter.js';
import { A2AWebSocketService } from '../services/A2AWebSocketService.js';
import { A2AController } from '../controllers/A2AController.js';

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
  controllers: [A2AController],
  providers: [
    AgentCardService,
    A2AProtocolHandler,
    ProtocolAdapterService,
    GoogleA2AAdapter,
    ACAProtocolAdapter,
    A2AWebSocketService,
    {
      provide: 'CONFIG_SERVICE',
      useValue: {
        get: (key: string) => process.env[key],
      },
    },
  ],
  exports: [
    AgentCardService,
    A2AProtocolHandler,
    ProtocolAdapterService,
    A2AWebSocketService,
  ],
})
export class A2AModule {
  constructor(
    private protocolAdapter: ProtocolAdapterService,
    private googleAdapter: GoogleA2AAdapter,
    private acaAdapter: ACAProtocolAdapter
  ) {
    // Register the ACA adapter as the primary protocol
    this.protocolAdapter.registerAdapter(this.acaAdapter);

    // Register the Google A2A adapter for backward compatibility
    this.protocolAdapter.registerAdapter(this.googleAdapter);
  }
}