import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EntityDiscoveryService } from './entity-discovery.service';
import { MCPModule } from '../mcp.module'; // Adjust path if needed

@Module({
  imports: [
    ConfigModule, // Needed to read environment variables
    MCPModule,    // Needed to access MCPRegistryService
  ],
  providers: [EntityDiscoveryService],
  exports: [EntityDiscoveryService], // Export if needed elsewhere, though likely not for a startup service
})
export class EntityDiscoveryModule {}
