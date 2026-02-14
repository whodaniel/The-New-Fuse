import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MCPModule } from '../mcp/mcp.module.js';
import { AgentDiscoveryService } from '../services/agent-discovery.service.js';

@Module({
  imports: [
    MCPModule,
    EventEmitterModule.forRoot()
  ],
  providers: [AgentDiscoveryService],
  exports: [AgentDiscoveryService]
})
export class AgentDiscoveryModule {}
