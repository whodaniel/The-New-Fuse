import { Module } from '@nestjs/common';
import { MCPRegistryService } from './mcp-registry.service';
import { MCPRegistryServer } from './mcp-registry.server';
import { PrismaService } from '@the-new-fuse/database';

@Module({
  providers: [MCPRegistryService, MCPRegistryServer, PrismaService],
  exports: [MCPRegistryService, MCPRegistryServer],
})
export class McpModule {}
