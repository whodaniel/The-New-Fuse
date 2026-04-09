import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { SystemController } from './system.controller';
import { TnfRegistryService } from './tnf-registry.service';

@Module({
  controllers: [AgentController, SystemController],
  providers: [TnfRegistryService],
})
export class ApiModule {}
