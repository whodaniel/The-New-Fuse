/**
 * MCP Gateway Module
 * Consolidates Model Context Protocol server endpoints
 */

import { Module } from '@nestjs/common';
import { ProxyModule } from '../proxy/proxy.module';
import { McpGatewayController } from './mcp-gateway.controller';

@Module({
  imports: [ProxyModule],
  controllers: [McpGatewayController],
})
export class McpGatewayModule {}