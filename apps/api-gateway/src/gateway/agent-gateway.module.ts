/**
 * Agent Gateway Module
 * Consolidates agent-related endpoints from multiple services
 */

import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { AgentGatewayController } from './agent-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [AgentGatewayController],
})
export class AgentGatewayModule {}