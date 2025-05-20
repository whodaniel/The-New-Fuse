import { Module } from '@nestjs/common';
import { CommunicationService } from './CommunicationService.js';
import { MessageBroker } from './MessageBroker.js';
import { CommunicationProtocol } from './Protocol.js';

@Module({
  providers: [
    CommunicationService,
    MessageBroker,
    CommunicationProtocol
  ],
  exports: [
    CommunicationService,
    MessageBroker,
    CommunicationProtocol
  ]
})
export class CommunicationModule {}
