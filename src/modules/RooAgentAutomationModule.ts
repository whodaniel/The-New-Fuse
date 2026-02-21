/**
 * Roo Agent Automation Module
 * 
 * NestJS module for integrating the Roo Code Agent Automation System
 * into The New Fuse platform architecture.
 */

import { Module } from '@nestjs/common';
import { RooAgentAutomationService } from '../../services/roo-agent-automation.service';
import { RooAgentAutomationController } from '../../controllers/roo-agent-automation.controller';
import { MCPService } from '../../services/MCPService';

@Module({
  providers: [
    RooAgentAutomationService,
    {
      provide: 'MCPService',
      useFactory: () => {
        // Initialize MCP service if needed
        return new MCPService();
      }
    }
  ],
  controllers: [RooAgentAutomationController],
  exports: [RooAgentAutomationService]
})
export class RooAgentAutomationModule {}
