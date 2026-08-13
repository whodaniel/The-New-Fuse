import { Module } from '@nestjs/common';
import { CommunicationService } from './CommunicationService.js';
import { CommunicationProtocol } from './CommunicationProtocol.js';

@Module({
  providers: [CommunicationService, CommunicationProtocol],
  exports: [CommunicationService, CommunicationProtocol],
})
export class CommunicationModule {}