import { Module } from '@nestjs/common';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService.js';
import { ClaudeDevAutomationController } from '../controllers/claude-dev-automation.controller.js';

@Module({
  controllers: [ClaudeDevAutomationController],
  providers: [ClaudeDevAutomationService],
  exports: [ClaudeDevAutomationService],
})
export class ClaudeDevAutomationModule {}
