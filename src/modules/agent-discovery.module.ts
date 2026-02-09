import { Module } from '@nestjs/common';
import { AgentDiscoveryService } from '../services/agent-discovery.service.js';
import { PrismaModule } from '../lib/prisma/prisma.module.js';
import { MCPModule } from '../mcp/mcp.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    PrismaModule,
    MCPModule,
    EventEmitterModule.forRoot()
  ],
  providers: [AgentDiscoveryService],
  exports: [AgentDiscoveryService]
})
export class AgentDiscoveryModule {}
