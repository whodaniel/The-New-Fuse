import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios'; // Import HttpModule
import { MCPService } from './services/mcp.service.js';
import { MCPController } from './controllers/mcp.controller.js';
import { MCPRegistryService } from './mcp-registry.service.js'; // Import new service
import { MCPRegistryServer } from './mcp-registry.server.js'; // Import new server

@Module({
  imports: [
    ConfigModule,
    HttpModule, // Add HttpModule for MCPRegistryService
  ],
  controllers: [MCPController],
  providers: [
    MCPService,
    MCPRegistryService, // Add MCPRegistryService as a provider
    MCPRegistryServer,  // Add MCPRegistryServer as a provider
  ],
  exports: [
    MCPService,
    MCPRegistryService, // Export if needed by other modules
    // MCPRegistryServer is likely self-contained and doesn't need exporting
  ],
})
export class MCPModule {}

// Keep existing exports, add new ones if necessary (though probably not for server/service)
export * from './services/mcp.service.js';
export * from './controllers/mcp.controller.js';
// export * from './mcp-registry.service.js'; // Uncomment if needed elsewhere
