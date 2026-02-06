import { Module } from '@nestjs/common';
import { CommunicationService } from './CommunicationService';
import { CommunicationProtocol } from './CommunicationProtocol';

@Module({
  providers: [CommunicationService, CommunicationProtocol],
  exports: [CommunicationService, CommunicationProtocol],
})
export class CommunicationModule {}
