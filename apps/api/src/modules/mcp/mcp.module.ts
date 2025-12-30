import { Module } from '@nestjs/common';
import { MCPRegistryService } from './mcp-registry.service';
import { MCPRegistryServer } from './mcp-registry.server';
import { DatabaseModule } from '@the-new-fuse/database';

@Module({
  imports: [DatabaseModule],
  providers: [MCPRegistryService, MCPRegistryServer],
  exports: [MCPRegistryService, MCPRegistryServer],
})
export class McpModule {}
