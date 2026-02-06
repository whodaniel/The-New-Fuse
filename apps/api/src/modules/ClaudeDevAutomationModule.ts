import { Module } from '@nestjs/common';
import { ClaudeDevAutomationController } from '../controllers/claude-dev-automation.controller';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';

@Module({
  controllers: [ClaudeDevAutomationController],
  providers: [ClaudeDevAutomationService],
  exports: [ClaudeDevAutomationService],
})
export class ClaudeDevAutomationModule {}
