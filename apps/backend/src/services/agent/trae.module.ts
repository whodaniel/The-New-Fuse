import { Module } from '@nestjs/common';
import { TraeAgent } from './trae-agent';

@Module({
  providers: [TraeAgent],
  exports: [TraeAgent]
})
export class TraeAgentModule {}