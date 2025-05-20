import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EntityDiscoveryService } from './entity-discovery.service.js';
import { McpModule } from '../mcp/mcp.module.js'; // Adjust path if needed

@Module({
  imports: [
    ConfigModule, // Needed to read environment variables
    McpModule,    // Needed to access MCPRegistryService
  ],
  providers: [EntityDiscoveryService],
  exports: [EntityDiscoveryService], // Export if needed elsewhere, though likely not for a startup service
})
export class EntityDiscoveryModule {}
