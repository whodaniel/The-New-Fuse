import { Module } from '@nestjs/common';
import { CommunicationService } from './CommunicationService';
import { CommunicationProtocol } from './CommunicationProtocol';
import { CommunicationTypes } from './CommunicationTypes';
@Module({
  // Implementation needed
}
  providers: [CommunicationService, CommunicationProtocol, CommunicationTypes],
  exports: [CommunicationService, CommunicationProtocol, CommunicationTypes],
})
export class CommunicationModule {}