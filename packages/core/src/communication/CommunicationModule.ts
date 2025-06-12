import { Module } from '@nestjs/common';
import { CommunicationService } from './CommunicationService.tsx';
import { MessageBroker } from './MessageBroker.tsx';
import { CommunicationProtocol } from './Protocol.tsx';

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
